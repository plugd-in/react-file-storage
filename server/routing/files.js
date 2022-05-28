"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
function fileRouter(fileModel) {
    const router = (0, express_1.Router)();
    router.get('/', (req, res) => {
        res.set({
            "Content-Type": "application/json"
        });
        if (typeof req["sessionID"] !== "undefined") {
            fileModel.getUserFiles(req["sessionID"]).then(files => {
                res.status(200).json(files);
            }).catch(err => {
                if (err instanceof Error && err.message == "Session not authenticated.")
                    res.status(401).send(err.message).end();
                else {
                    console.error(err);
                    res.status(500).end();
                }
            });
        }
        else
            res.status(401).send("Session not authenticated.").end();
    });
    return router;
}
exports.default = fileRouter;
