"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const express_session_1 = require("express-session");
const timers_1 = require("timers");
class Store extends express_session_1.Store {
    constructor(store, options) {
        super();
    }
}
class SessionStore extends Store {
    constructor(store, config) {
        super(store, config);
        this.client = new events_1.default();
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
                ON DELETE CASCADE)`, (err) => {
            if (err)
                throw err;
            this.client.emit('connect');
            this.cleanup();
            (0, timers_1.setInterval)(this.cleanup, this.cleanupTime).unref();
        });
    }
    cleanup() {
        const now = new Date().getTime();
        this.db.run(`DELETE FROM ${this.table} WHERE ? > expired`, [now]);
    }
    all(callback) {
        this.db.all("SELECT * FROM sessions", (err, rows) => {
            if (err)
                callback(err);
            else {
                const sessionList = {};
                rows.forEach(session => {
                    sessionList[session.sid] = session.sess;
                });
                callback(null, sessionList);
            }
        });
    }
    clear(callback) {
        this.db.exec(`DELETE FROM ${this.table}`, (err) => {
            if (err)
                callback(err);
            else
                callback(null, true);
        });
    }
    destroy(sessionId, callback) {
        this.db.run(`DELETE FROM ${this.table} WHERE sid = ?`, [sessionId], callback);
    }
    get(sessionId, callback) {
        const now = new Date().getTime();
        this.db.get(`SELECT * FROM ${this.table} WHERE sid = ? and ? <= expired`, [sessionId, now], (err, row) => {
            if (err || typeof row == "undefined")
                callback(err || new Error());
            else
                callback(null, JSON.parse(row.sess));
        });
    }
    set(sessionId, session, callback) {
        try {
            const maxAge = session.cookie.maxAge;
            const now = new Date().getTime();
            let expired = maxAge ? now + maxAge : now + this.lifetime;
            let rawSession = JSON.stringify(session);
            this.db.get(`WITH a(x) AS (SELECT uid FROM sessions WHERE sid=?) INSERT OR REPLACE INTO ${this.table} VALUES (?, ?, ?, (SELECT a.x FROM a))`, [sessionId, sessionId, expired, rawSession], (err, rows) => {
                if (err)
                    callback(err);
                else if (callback)
                    callback(null, rows);
            });
        }
        catch (e) {
            if (e)
                callback(e);
        }
    }
    length(callback) {
        this.db.get(`SELECT COUNT(*) AS count FROM ${this.table}`, (err, row) => {
            if (err)
                callback(err);
            else
                callback(null, row.count);
        });
    }
    touch(sessionId, session, callback) {
        if (session && session.cookie && session.cookie.expires) {
            const now = new Date().getTime();
            let expire = new Date(session.cookie.expires).getTime();
            this.db.run(`UPDATE ${this.table} SET expired=? WHERE sid=? AND ? <= expired`, [expire, sessionId, now], (err) => {
                if (err)
                    callback(err);
                else
                    callback(null, true);
            });
        }
        else {
            callback(null, false);
        }
    }
    getSessionUser(sessionId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT u.* FROM ${this.table} s INNER JOIN users u USING(uid) WHERE s.sid = ?`, [sessionId], (err, row) => {
                if (err)
                    reject(err);
                else if (row)
                    resolve({ uid: row.uid, username: row.username, passwordHash: row.password_hash });
                else
                    resolve(null);
            });
        });
    }
    authenticateSession(sessionId, uid) {
        const now = new Date().getTime();
        console.log("Merk 3:", sessionId, uid);
        this.db.run(`UPDATE ${this.table} SET uid = ? WHERE sid = ? AND ? <= expired`, [uid, sessionId, now], (err) => {
            if (err)
                console.error(err);
        });
    }
}
exports.default = SessionStore;
