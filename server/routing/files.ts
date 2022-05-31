import { randomUUID } from "crypto";
import { Router } from "express"
import multer from "multer";
import { join, resolve } from "path";
import { FileObject } from "../interfaces";
import FileModel from "../models/files";
import UserModel from "../models/user";

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: bigint;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

export default function fileRouter (fileModel: FileModel, userModel: UserModel) {
    const router = Router();
    const storageDestination = join(resolve('.'), 'server/files');
    
    const storage = multer.diskStorage({
        destination:  (req, file, cb) => {
            
            cb(null, storageDestination);
        },
        filename: (req, file: string, cb) => {
            
            const fileSplit = file["originalname"].split('.');
            const uuid = randomUUID();
            cb(null, uuid);
        }
    });
    const upload = multer({
        storage: storage
    });
    
    router.post('/', (req, res, next) => {
        
        if ( typeof req["sessionID"] !== "undefined" ) {
            userModel.getUserBySession(req["sessionID"]).then(user => {
                if ( user === null ) res.status(401).send("Session not authenticated.");
                else {
                    
                    req["user"] = user;
                    
                    next();
                }
            })
        } else res.status(401).send("Session not authenticated.").end();
    }, upload.any(), (req, res) => {
        
        
        if ( typeof req["user"] !== "undefined") {
            if ( typeof req["files"] !== "undefined" ) {
                const files = req["files"] as MulterFile[];
                const fileObjects: {
                    [id: string]: FileObject
                } = {};
                let inOrder = Promise.resolve<FileObject>(null);
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
            } else res.status(200).end();
        } else res.status(500).end();
    });

    router.get('/:fileId([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})', (req, res) => {
        
        if ( typeof req["sessionID"] !== "undefined" ) {
            
            fileModel.getFile(req.params.fileId, req["sessionID"]).then(file => {
                res.download(`${storageDestination}/${file.id}`, file.filename, err => {
                    if (err) {
                        console.error(err);
                        res.status(500).end();
                    }
                })
            }).catch((err: Error) => {
                if (err.message == "No such file.")
                    res.status(404).end();
                else if (err.message == "Session not authenticated.")
                    res.status(401).send("Session not authenticated.").end();
                else {
                    console.error(err);
                    res.status(500).end();
                }
            });
        } else res.status(401).send("Session not authenticated.").end();
    })

    router.get('/', (req, res) => {
        res.set({
            "Content-Type": "application/json"
        });
        if ( typeof req["sessionID"] !== "undefined") {
            fileModel.getUserFiles(req["sessionID"]).then(files => {
                res.status(200).json(files);
            }).catch(err => {
                if ( err instanceof Error && err.message == "Session not authenticated.")
                    res.status(401).send(err.message).end();
                else {
                    console.error(err);                    
                    res.status(500).end();
                }
            });
        } else res.status(401).send("Session not authenticated.").end();
    });

    router.delete('/:fileId([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})', (req, res) => {
        if ( typeof req["sessionID"] !== "undefined" ) {
            fileModel.deleteFile(req.params["fileId"], req["sessionID"]).then(() => {
                res.status(200).end();
            }).catch(err => {
                console.error(err);
                res.status(500).end();
            });
        } else res.status(401).send("Session not authenticated.").end();
    });


    return router;
}