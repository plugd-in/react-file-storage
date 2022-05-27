import sqlite3, { Database, verbose } from 'sqlite3';
import { join, resolve } from 'path';
import { env, config } from 'process';
import { Account } from './interfaces';
import UserModel from './models/user';
import session from 'express-session'
import cors from 'cors'

import SessionStore from './models/session';

import express, { Express, RequestHandler, Router} from 'express';
import cookieParser from 'cookie-parser';


const dbfile = join(resolve('.'), env["dbFileName"] || 'sqlite.db');

console.log("DB File:", dbfile);


const sqlite = env.NODE_ENV == "development" ? verbose() : sqlite3;
const db: Database = new sqlite.Database(dbfile);
const userModel = new UserModel(db);

const Store = new SessionStore(( typeof session["session"] !== "undefined" ) ? session["session"].Store : session.Store, {db});

const app: Express = express();
const router = Router();
const PORT = env["PORT"] || 8080;

app.use(cors())

// app.use(cookieParser() as RequestHandler)

app.use(express.json());

app.use(session({
    store: Store,
    secret: env["SESSION_SECRET"] || 'secret',
    resave: true,
    saveUninitialized: true,
}) as RequestHandler);


router.get('/', (req, res, next) => {
    res.send("Hello, world!");
});

router.post('/account/login', (req, res) => {
    res.set({
        "Accept-Post": "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    });
    const jsonBody: {
        username: string;
        password: string;
    } = req.body;
    if (
        typeof jsonBody == "object" &&
        typeof jsonBody["username"] !== "undefined" &&
        typeof jsonBody["password"] !== "undefined"
    ) {
        
        userModel.authenticateUser(jsonBody.username, jsonBody.password).then(user => {
            
            res.status(200).json(user);
        }).catch(err => {
            res.status(401).end();
        });
    } else {
        
        res.status(400).end();
    }
});

app.use('/', router);


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
})

userModel.createUser("plunged", "guest").then(() => userModel.getUser('plunged')).then((user) => {
    console.log(user);
}).catch((err) => {
    console.error(err);
});