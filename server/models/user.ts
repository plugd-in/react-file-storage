import { Database, RunResult } from "sqlite3";
import { Account, RawAccount } from "../interfaces";
import { pbkdf2 as hashPassword, pbkdf2, randomBytes, randomUUID } from 'crypto';
import assert from "assert";
import SessionStore from "./session";

export default class UserModel {
    private db: Database;
    private sessionStore: SessionStore;
    private table: string;
    constructor (db: Database, sessionStore: SessionStore, table: string = 'users') {
        this.db = db;
        this.sessionStore = sessionStore;
        this.table = table;
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table} (
            uid TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT
        )`, (err: Error) => {
            if (err) throw err;
        });
    }

    getUser (username): Promise<Account> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.get(`SELECT * FROM ${this.table} WHERE username = ?`, username, (err, row: RawAccount) => {
                    if (err)
                        reject(err);
                    else if (typeof row == "undefined")
                        reject(new Error("No such user."));
                    else
                        resolve({uid: row.uid, username: row.username, passwordHash: row.password_hash});
                });
            });
        });
    }

    authenticateUser (username, password): Promise<Account> {
        return this.getUser(username).then((user: Account) => {
            
            const passwordInfo: string[] = user.passwordHash.split("$");
            const cleanPasswordInfo: {
                algorithm?: string;
                digest?: string;
                iterations?: number;
                salt?: string;
                hash?: string;
            } = {
                algorithm: passwordInfo[0],
                digest: passwordInfo[1],
                iterations: Number(passwordInfo[2]),
                salt: passwordInfo[3],
                hash: passwordInfo[4]
            };
            if ( passwordInfo[0] != "pbkdf2" )
                throw new Error(`Unsupported password hashing algorithm: ${passwordInfo[0]}`);
            return new Promise((resolve, reject) => {
                
                if ( Object.keys(cleanPasswordInfo).filter((key) => typeof cleanPasswordInfo[key] !== "undefined").length === 5 ) {
                    
                    pbkdf2(password, cleanPasswordInfo!.salt, cleanPasswordInfo!.iterations, 256, cleanPasswordInfo!.digest, (err, key) => {
                        
                        if( err )
                            reject(err);
                        else if ( key.toString('hex') == cleanPasswordInfo!.hash )
                            resolve(user);
                        else
                            reject(new Error("Password invalid"));
                    })
                }
                else
                    reject(new Error("Database format error."));
            });
        })
    }

    createUser (username: string, password: string, sessionId: string | null = null) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const salt = randomBytes(16).toString('hex');
                const iterations: number = 1000;
                const digest = "sha512";
                pbkdf2(password, salt, iterations, 256, digest, (err, key) => {
                    if ( err )
                        reject(err);
                    else {
                        const uuid = randomUUID();
                        this.db.run(`INSERT INTO ${this.table} (uid, username, password_hash) VALUES (?, ?, ?)`, [
                            uuid,
                            username,
                            `pbkdf2$${digest}$${iterations}$${salt}$${key.toString('hex')}`
                        ], (err) => {
                            if ( err )
                                reject(err);
                            else {
                                if (sessionId !== null ) {
                                    this.sessionStore.authenticateSession(sessionId, uuid).then(resolve).catch(reject);
                                } else resolve(null);
                            }
                        })
                    }
                })
            });
        });
    }

    getUserBySession (sessionId: string): Promise<Account | null> {
        return this.sessionStore.getSessionUser(sessionId);
    }

    logoutSession (sessionId: string): Promise<void> {
        return this.sessionStore.unauthSession(sessionId);
    }

    userSearch (username: string): Promise<Account[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT (username) FROM ${this.table} WHERE username LIKE ?`, [`${username.replace('%', '\\%')}%`], (err, users: Account[]) => {
                if (err) reject(err);
                else resolve(users);
            });
        });
    }
}