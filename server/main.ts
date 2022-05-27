import sqlite3, { Database, verbose } from 'sqlite3';
import { join, resolve } from 'path';
import { env, config } from 'process';
import { Account } from './interfaces';
import UserModel from './models/user';
import session from 'express-session'
import cors from 'cors'

import accountRouter from './routing/account';

import SessionStore from './models/session';

import express, { Express, RequestHandler, Router, static as staticMiddleware} from 'express';


const dbfile = join(resolve('.'), env["dbFileName"] || 'sqlite.db');

console.log("DB File:", dbfile);


const sqlite = env.NODE_ENV == "development" ? verbose() : sqlite3;
const db: Database = new sqlite.Database(dbfile);

const store = new SessionStore(( typeof session["session"] !== "undefined" ) ? session["session"].Store : session.Store, {db});

const userModel = new UserModel(db, store);

const app: Express = express();
const PORT = env["PORT"] || 8080;

app.use(cors())

app.use(express.json());

app.use(session({
    store: store,
    secret: env["SESSION_SECRET"] || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000
    }
}) as RequestHandler);

app.use('/account', accountRouter(userModel, store));

app.use('/', staticMiddleware('build'));

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
})

userModel.createUser("plunged", "guest").then(() => userModel.getUser('plunged')).then((user) => {
    console.log(user);
}).catch((err) => {
    console.error(err);
});