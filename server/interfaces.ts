import { Cookie as _Cookie } from "express-session";


export interface RawAccount {
    uid: string;
    username: string;
    password_hash: string;
}

export interface Account {
    uid: string; // Primary Key uuid4
    username: string; // Unique
    passwordHash: string; // Formatted as <algorithm>$<digest>$<iterations>$<salt>$<hash>
}

export interface FileObject {
    id: string;
    owner: string;
    filename: string;
}

export interface FileList {
    [fileId: string]: FileObject
}

export interface CookieData {
    originalMaxAge: number;
    expires: Date;
    secure: boolean;
    httpOnly: boolean;
    domain: string;
    path: string;
    sameSite: boolean | 'lax' | 'none' | 'strict';
}

export interface CookieOptions {
    domain: string | null;
    expires: number | null;
    httpOnly: boolean | null;
    maxAge: number | null;
    path: string | null;
    sameSite: boolean | 'lax' | 'none' | 'strict' | null;
    secure: boolean | null;
}

export abstract class Cookie {
    constructor (options: CookieOptions) {};
    abstract set expires (date: Date);
    abstract get expires (): Date;
    abstract set maxAge (ms: number);
    abstract get maxAge (): number;
    abstract get data (): CookieData;
    abstract serialize (name: string, val: string);
    abstract toJSON (): CookieData;
}

export interface SessionStorage {
    cookie: Cookie;
}

export interface Session {
    sid: string;
    expired: number; // Expiration date as timestamp.
    sess: string;
    uid: string | null; // User id if the session is authenticated or null otherwise.
}

export interface SessionList {
    [sessionId: string]: SessionStorage
}