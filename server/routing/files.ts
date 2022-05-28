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
    console.log("Mark 8:", storageDestination);
    
    const storage = multer.diskStorage({
        destination:  (req, file, cb) => {
            console.log("Mark 4");
            
            cb(null, storageDestination);
        },
        filename: (req, file: string, cb) => {
            console.log("Mark 3:", file);
            
            const fileSplit = file["originalname"].split('.');
            const uuid = randomUUID();
            cb(null, uuid + (fileSplit.length > 1 ? '.' + fileSplit[fileSplit.length - 1] : ''));
        }
    });
    const upload = multer({
        storage: storage
    });
    
    router.post('/', (req, res, next) => {
        res.set({

        });
        console.log("Mark 1");
        
        if ( typeof req["sessionID"] !== "undefined" ) {
            userModel.getUserBySession(req["sessionID"]).then(user => {
                if ( user === null ) res.status(401).send("Session not authenticated.");
                else {
                    console.log("Mark 2");
                    
                    req["user"] = user;
                    
                    next();
                }
            })
        } else res.status(401).send("Session not authenticated.").end();
    }, upload.any(), (req, res) => {
        console.log("Mark 6:", req["user"]);
        console.log("Mark 7:", req["files"]);
        
        
        if ( typeof req["user"] !== "undefined") {
            if ( typeof req["files"] !== "undefined" ) {
                const files = req["files"] as MulterFile[];
                const fileObjects: {
                    [id: string]: FileObject
                } = {};
                let inOrder = Promise.resolve<FileObject>(null);
                files.forEach(file => {
                    inOrder = inOrder.then(() => fileModel.setFile(file.originalname, req["sessionID"])).then(fileObject => {
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



    return router;
}