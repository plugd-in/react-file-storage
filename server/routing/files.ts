import { Router } from "express"
import FileModel from "../models/files";

export default function fileRouter (fileModel: FileModel) {
    const router = Router();

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