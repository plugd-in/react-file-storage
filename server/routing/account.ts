import { Router } from 'express';
import SessionStore from '../models/session';
import UserModel from '../models/user';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { join, resolve } from 'path';





export default function accountRouter (userModel: UserModel, sessionStore: SessionStore) {
    const router = Router();

    router.post('/login', (req, res) => {
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
                if ( typeof req["sessionID"] !== "undefined" ) sessionStore.authenticateSession(req["sessionID"] as string, user.uid);
                res.status(200).json(user);
            }).catch(err => {
                res.status(401).end();
            });
        } else {
            
            res.status(400).end();
        }
    });

    router.get('/', (req, res) => {
        res.set({
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        if ( typeof req["sessionID"] !== "undefined" ) {
            userModel.getUserBySession(req["sessionID"]).then(user => {
                if ( user !== null ) {
                    res.status(200).json(user);
                } else res.status(401).send("No authenticated session.").end();
            }).catch(err => {
                console.error(err);
                
                res.status(500).send("An unknown error occured.").end();
            });
        } else {
            res.status(401).send("No authenticated session.").end();
        }
    });

    return router;
}