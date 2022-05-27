"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
function accountRouter(userModel, sessionStore) {
    const router = (0, express_1.Router)();
    router.post('/login', (req, res) => {
        res.set({
            "Accept-Post": "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        const jsonBody = req.body;
        if (typeof jsonBody == "object" &&
            typeof jsonBody["username"] !== "undefined" &&
            typeof jsonBody["password"] !== "undefined") {
            userModel.authenticateUser(jsonBody.username, jsonBody.password).then(user => {
                if (typeof req["sessionID"] !== "undefined")
                    sessionStore.authenticateSession(req["sessionID"], user.uid);
                res.status(200).json(user);
            }).catch(err => {
                res.status(401).end();
            });
        }
        else {
            res.status(400).end();
        }
    });
    router.get('/', (req, res) => {
        res.set({
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        if (typeof req["sessionID"] !== "undefined") {
            userModel.getUserBySession(req["sessionID"]).then(user => {
                if (user !== null) {
                    res.status(200).json(user);
                }
                else
                    res.status(401).send("No authenticated session.").end();
            }).catch(err => {
                console.error(err);
                res.status(500).send("An unknown error occured.").end();
            });
        }
        else {
            res.status(401).send("No authenticated session.").end();
        }
    });
    return router;
}
exports.default = accountRouter;
