"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
function getUserBySession(sessionStore, sessionId) {
    return sessionStore.getSessionUser(sessionId).then(account => {
        if (account === null)
            return Promise.reject(new Error("Session not authenticated."));
        else
            return Promise.resolve(account);
    });
}
class FileModel {
    constructor(config) {
        this.db = config.db;
        this.table = config.table || 'files';
        this.sessionStore = config.store;
        this.db.serialize(() => {
            this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table} (
                id TEXT PRIMARY KEY,
                owner TEXT NOT NULL,
                filename TEXT,
                FOREIGN KEY (owner) REFERENCES users (uid)
                    ON DELETE CASCADE)`, (err) => {
                if (err)
                    throw err;
            });
            this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table}_shares (
                fid,
                uid,
                PRIMARY KEY (fid, uid),
                FOREIGN KEY (uid) REFERENCES users (uid)
                    ON DELETE CASCADE,
                FOREIGN KEY (fid) REFERENCES ${this.table} (id)
                    ON DELETE CASCADE)`, (err) => {
                if (err)
                    throw err;
            });
        });
    }
    getUserFiles(sessionId) {
        return getUserBySession(this.sessionStore, sessionId).then(account => {
            return new Promise((resolve, reject) => {
                this.db.all(`WITH perms(fid) AS (
                    SELECT fid FROM ${this.table}_shares WHERE uid=? 
                    UNION SELECT id FROM ${this.table} WHERE owner=?
                ) SELECT f.* FROM perms p INNER JOIN ${this.table} f ON p.fid = f.id`, [account.uid, account.uid], (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        try {
                            const result = {};
                            rows.forEach(row => result[row.id] = row);
                            resolve(result);
                        }
                        catch (e) {
                            reject(e);
                        }
                });
            });
        });
    }
    setFile(filename, sessionId) {
        return getUserBySession(this.sessionStore, sessionId).then(account => {
            const fid = (0, crypto_1.randomUUID)();
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT OR REPLACE INTO ${this.table} VALUES (?, ?, ?)`, [fid, account.uid, filename], err => {
                    if (err)
                        reject(err);
                    else
                        resolve({ id: fid, owner: account.uid, filename });
                });
            });
        });
    }
}
exports.default = FileModel;
