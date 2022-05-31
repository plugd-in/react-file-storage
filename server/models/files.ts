import { sqlite3, Database } from "sqlite3";
import SessionStore from "./session";
import { FileObject, FileList } from '../interfaces';
import { randomUUID } from "crypto";
import { rm } from 'fs/promises';
import { join, resolve } from "path";

interface FileModelConfig {
    db: Database;
    store: SessionStore;
    table?: string;
}

function getUserBySession (sessionStore: SessionStore, sessionId: string) {
    return sessionStore.getSessionUser(sessionId).then(account => {
        if ( account === null )
            return Promise.reject(new Error("Session not authenticated."));
        else 
            return Promise.resolve(account);
    });
}

export default class FileModel {
    private db: Database;
    private table: string;
    private sessionStore: SessionStore;
    private storageDestination: string;
    constructor (config: FileModelConfig) {
        this.db = config.db;
        this.table = config.table || 'files';
        this.sessionStore = config.store;
        this.storageDestination = join(resolve('.'), 'server/files');

        this.db.serialize(() => {
            this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table} (
                id TEXT PRIMARY KEY,
                owner TEXT NOT NULL,
                filename TEXT,
                FOREIGN KEY (owner) REFERENCES users (uid)
                    ON DELETE CASCADE)`, (err: Error) => {
                if (err) throw err;
            });
            this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table}_shares (
                fid,
                uid,
                PRIMARY KEY (fid, uid),
                FOREIGN KEY (uid) REFERENCES users (uid)
                    ON DELETE CASCADE,
                FOREIGN KEY (fid) REFERENCES ${this.table} (id)
                    ON DELETE CASCADE)`, (err: Error) => {
                if (err) throw err;
            });
        });
    }

    getUserFiles (sessionId: string): Promise<FileList> {
        return getUserBySession(this.sessionStore, sessionId).then(account => {
            return new Promise((resolve, reject) => {
                this.db.all(`WITH perms(fid) AS (
                    SELECT fid FROM ${this.table}_shares WHERE uid=? 
                    UNION SELECT id FROM ${this.table} WHERE owner=?
                ) SELECT f.* FROM perms p INNER JOIN ${this.table} f ON p.fid = f.id`, [account.uid, account.uid], (err:Error, rows: FileObject[]) => {
                    if (err) reject(err);
                    else try {
                        const result = {};
                        rows.forEach(row => result[row.id] = row);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        });
    }

    setFile (filename: string, sessionId: string, fid: string = randomUUID()): Promise<FileObject> {
        return getUserBySession(this.sessionStore, sessionId).then(account => {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT OR REPLACE INTO ${this.table} VALUES (?, ?, ?)`, [fid, account.uid, filename], err => {
                    if ( err ) reject(err);
                    else resolve({id: fid, owner: account.uid, filename});
                })
            });
        });
    }

    getFile (fid: string, sessionId: string): Promise<FileObject> {
        return getUserBySession(this.sessionStore, sessionId).then(user => {
            return new Promise((resolve, reject) => {
                this.db.get(`WITH perms(fid) AS (
                    SELECT fid FROM ${this.table}_shares WHERE uid=$uid 
                    UNION SELECT id FROM ${this.table} WHERE owner=$uid
                ) SELECT f.* FROM perms p INNER JOIN ${this.table} f ON p.fid = f.id WHERE f.id = $fid`, {
                    $fid: fid,
                    $uid: user.uid
                }, (err, row: FileObject) => {
                    if (err) reject(err);
                    else if (row) resolve(row);
                    else reject(new Error("No such file."))
                });
            });
        });
    }

    deleteFile (fid: string, sessionId: string): Promise<void> {
        return getUserBySession(this.sessionStore, sessionId).then(user => {
            return new Promise((resolve, reject) => {
                this.db.run(`DELETE FROM ${this.table} WHERE id = $fid AND owner = $uid`,{
                    $uid: user.uid,
                    $fid: fid
                }, (err) => {
                    if (err) reject(err);
                    else {
                        rm(`${this.storageDestination}/${fid}`).then(() => resolve()).catch(reject);
                    }
                });
            });
        })
    }

}