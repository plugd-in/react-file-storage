"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const path_1 = require("path");
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
        this.storageDestination = (0, path_1.join)((0, path_1.resolve)('.'), 'server/files');
        this.userModel = config.userModel;
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
    setFile(filename, sessionId, fid = (0, crypto_1.randomUUID)()) {
        return getUserBySession(this.sessionStore, sessionId).then(account => {
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
    getFile(fid, sessionId) {
        return getUserBySession(this.sessionStore, sessionId).then(user => {
            return new Promise((resolve, reject) => {
                this.db.get(`WITH perms(fid) AS (
                    SELECT fid FROM ${this.table}_shares WHERE uid=$uid 
                    UNION SELECT id FROM ${this.table} WHERE owner=$uid
                ) SELECT f.* FROM perms p INNER JOIN ${this.table} f ON p.fid = f.id WHERE f.id = $fid`, {
                    $fid: fid,
                    $uid: user.uid
                }, (err, row) => {
                    if (err)
                        reject(err);
                    else if (row)
                        resolve(row);
                    else
                        reject(new Error("No such file."));
                });
            });
        });
    }
    deleteFile(fid, sessionId) {
        return getUserBySession(this.sessionStore, sessionId).then(user => {
            return new Promise((resolve, reject) => {
                this.db.run(`DELETE FROM ${this.table} WHERE id = $fid AND owner = $uid`, {
                    $uid: user.uid,
                    $fid: fid
                }, (err) => {
                    if (err)
                        reject(err);
                    else {
                        (0, promises_1.rm)(`${this.storageDestination}/${fid}`).then(() => resolve()).catch(reject);
                    }
                });
            });
        });
    }
    ownsFile(fid, sessionId) {
        return this.userModel.getUserBySession(sessionId).then(user => {
            if (user)
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM ${this.table} WHERE owner=?`, [user.uid], (err, row) => {
                        if (err)
                            reject(err);
                        else
                            resolve(row !== null);
                    });
                });
            else
                return Promise.reject("Session not authenticated.");
        });
    }
    shareFile(fid, sessionId, username) {
        return this.ownsFile(fid, sessionId).then(owner => {
            if (owner)
                return this.userModel.getUser(username).then(user => {
                    return new Promise((resolve, reject) => {
                        this.db.run(`INSERT OR REPLACE INTO ${this.table}_shares VALUES (?, ?)`, [fid, user.uid], (err) => {
                            if (err)
                                reject(err);
                            else
                                resolve(true);
                        });
                    });
                });
            else
                return Promise.resolve(false);
        });
    }
}
exports.default = FileModel;
