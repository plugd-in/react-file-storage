import EventEmitter from "events";
import { Store as _SessionStore } from "express-session";
import { Database } from "sqlite3";
import { setInterval } from "timers";
import { SessionList, Session, SessionStorage, Account, RawAccount } from "../interfaces";

interface StoreOptions {
    [key: string | number | symbol]: any;
    db: Database;
    cleanupTime?: number | undefined;
    table?: string | undefined;
    maxAge?: number | undefined;
}

abstract class Store extends _SessionStore {
    constructor (store: new () => unknown, options) {
        super();
    }
    abstract all (callback: (error: Error, sessions?: SessionList) => void): void;
    abstract clear (callback: (error: Error, success?: boolean) => void): void;
    abstract destroy (sessionId: string, callback: (error: Error) => void): void;
    abstract get (sessionId: string, callback: (error: Error, session?: SessionStorage) => void): void;
    abstract set (sessionId: string, session: SessionStorage, callback: (error: Error, session?: Session) => void): void;
    abstract length (callback: (error: Error, length: number) => void): void;
    abstract touch (sessionId: string, session: SessionStorage, callback: (error: Error, result?: boolean) => void): void;
}

export default class SessionStore extends Store {
    private db: Database;
    private table: string;
    private cleanupTime: number;
    private lifetime: number; // The expiration (age) of sessions.
    client: EventEmitter = new EventEmitter();

    constructor (store: new () => unknown, config: StoreOptions) {
        super(store, config);
        this.db = config.db;
        this.table = config.table || "sessions";
        this.lifetime = config.maxAge || 3600000 * 24; // One day default.
        this.cleanupTime = config.cleanupTime || 3600000; // One hour default.
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table} (
            sid TEXT PRIMARY KEY,
            expired INTEGER NOT NULL,
            sess TEXT,
            uid TEXT,
            FOREIGN KEY (uid) REFERENCES users (uid)
                ON DELETE CASCADE)`, (err: Error) => {
            if (err) throw err;
            this.client.emit('connect');
            this.cleanup();
            setInterval(this.cleanup, this.cleanupTime).unref();
        });
    }

    private cleanup () {
        const now = new Date().getTime();
        this.db.run(`DELETE FROM ${this.table} WHERE ? > expired`, [now]);
    }

    all(callback: (error: Error, sessions?: SessionList) => void): void {
        this.db.all("SELECT * FROM sessions", (err: Error, rows: Session[]) => {
            if ( err ) callback(err);
            else {
                const sessionList = {};
                rows.forEach(session => {
                    sessionList[session.sid] = session.sess;
                });
                callback(null, sessionList);
            }
        });
    }

    clear(callback: (error: Error, success?: boolean) => void): void {
        this.db.exec(`DELETE FROM ${this.table}`, (err: Error) => {
            if (err) callback(err);
            else callback(null, true);
        });
    }

    destroy(sessionId: string, callback: (error: Error) => void): void {
        this.db.run(`DELETE FROM ${this.table} WHERE sid = ?`, [sessionId], callback);
    }

    get(sessionId: string, callback: (error: Error, session?: SessionStorage) => void): void {
        const now = new Date().getTime();
        this.db.get(`SELECT * FROM ${this.table} WHERE sid = ? and ? <= expired`, [sessionId, now], (err, row: Session) => {
            if ( err || typeof row == "undefined") callback(err || new Error());
            else callback(null, JSON.parse(row.sess));
        });
    }

    set(sessionId: string, session: SessionStorage, callback?: (error: Error, session?: Session) => void): void {
        try {
            const maxAge = session.cookie.maxAge;
            const now = new Date().getTime();
            let expired = maxAge ? now + maxAge : now + this.lifetime;
            let rawSession = JSON.stringify(session);

            this.db.get(`WITH a(x) AS (SELECT uid FROM sessions WHERE sid=?) INSERT OR REPLACE INTO ${this.table} VALUES (?, ?, ?, (SELECT a.x FROM a))`, [sessionId, sessionId, expired, rawSession], (err: Error, rows) => {
                if (err) callback(err);
                else if (callback) callback(null, rows);
            })
        } catch (e) {
            if (e) callback(e);
        }
    }

    length(callback: (error: Error, length?: number) => void): void {
        this.db.get(`SELECT COUNT(*) AS count FROM ${this.table}`, (err: Error, row: {count: number}) => {
            if (err) callback(err);
            else callback(null, row.count);
        })
    }

    touch(sessionId: string, session: SessionStorage, callback: (error: Error, result?: boolean) => void): void {
        if ( session && session.cookie && session.cookie.expires ) {
            const now = new Date().getTime();
            let expire = new Date(session.cookie.expires).getTime();
            this.db.run(`UPDATE ${this.table} SET expired=? WHERE sid=? AND ? <= expired`, [expire, sessionId, now], (err) => {
                if (err) callback(err);
                else callback (null, true);
            });
        } else {
            callback(null, false);
        }
    }

    getSessionUser (sessionId: string): Promise<Account | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT u.* FROM ${this.table} s INNER JOIN users u USING(uid) WHERE s.sid = ?`, [sessionId], (err: Error, row: RawAccount | null) => {
                if (err) reject(err);
                else if ( row ) resolve({uid: row.uid, username: row.username, passwordHash: row.password_hash});
                else resolve(null);
            });
        });
    }

    authenticateSession (sessionId: string, uid: string): void {
        const now = new Date().getTime();
        this.db.run(`UPDATE ${this.table} SET uid = ? WHERE sid = ? AND ? <= expired`, [uid, sessionId, now], (err: Error) => {
            if (err) console.error(err);
        });
    }

}