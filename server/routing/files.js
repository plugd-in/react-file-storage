"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = require("path");
function fileRouter(fileModel, userModel) {
    const router = (0, express_1.Router)();
    const storageDestination = (0, path_1.join)((0, path_1.resolve)('.'), 'server/files');
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, storageDestination);
        },
        filename: (req, file, cb) => {
            const fileSplit = file["originalname"].split('.');
            const uuid = (0, crypto_1.randomUUID)();
            cb(null, uuid);
        }
    });
    const upload = (0, multer_1.default)({
        storage: storage
    });
    router.post('/', (req, res, next) => {
        if (typeof req["sessionID"] !== "undefined") {
            userModel.getUserBySession(req["sessionID"]).then(user => {
                if (user === null)
                    res.status(401).send("Session not authenticated.");
                else {
                    req["user"] = user;
                    next();
                }
            });
        }
        else
            res.status(401).send("Session not authenticated.").end();
    }, upload.any(), (req, res) => {
        if (typeof req["user"] !== "undefined") {
            if (typeof req["files"] !== "undefined") {
                const files = req["files"];
                const fileObjects = {};
                let inOrder = Promise.resolve(null);
                files.forEach(file => {
                    inOrder = inOrder.then(() => fileModel.setFile(file.originalname, req["sessionID"], file.filename)).then(fileObject => {
                        fileObjects[fileObject.id] = fileObject;
                        return fileObject;
                    });
                });
                inOrder.then(() => {
                    res.status(201).json(fileObjects);
                }).catch(err => {
                    console.error(err);
                    res.status(500).end();
                });
            }
            else
                res.status(200).end();
        }
        else
            res.status(500).end();
    });
    router.get('/:fileId([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})', (req, res) => {
        console.log(req.params);
        if (typeof req["sessionID"] !== "undefined") {
            fileModel.getFile(req.params.fileId, req["sessionID"]).then(file => {
                res.download(`${storageDestination}/${file.id}`, file.filename, err => {
                    if (err) {
                        console.error(err);
                        res.status(500).end();
                    }
                });
            }).catch((err) => {
                if (err.message == "No such file.")
                    res.status(404).end();
                else if (err.message == "Session not authenticated.")
                    res.status(401).send("Session not authenticated.").end();
                else {
                    console.error(err);
                    res.status(500).end();
                }
            });
        }
        else
            res.status(401).send("Session not authenticated.").end();
    });
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
