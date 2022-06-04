import { useMemo } from "react";
import useSWR, {mutate} from "swr";

import { config } from "../App";
import { FileList } from "../interfaces";
import FileViewer from "./file-viewer.component";
import Share from "./share.component";



const fetchStatus = (response: Response) => {
    if ( response.status >= 200 && response.status < 300)
        return Promise.resolve(response.json().catch(() => null));
    return Promise.reject(new Error(response.statusText));
}

export default function FileListComponent () {

    const { data, error } = useSWR<FileList>(`${config.apiRoot}/files`, url => fetch(url).then(response => response.json()));

    const deleteFile = (fileId: string) => fetch(`${config.apiRoot}/files/${fileId}`, {
        method: "delete"
    }).then(fetchStatus).then(() => mutate(`${config.apiRoot}/files`)).catch(err => console.error(err));

    const files = useMemo(() => {
        const fileList = data || {};
        return Object.keys(fileList).map(key => {
            return (
                <li className="list-group-item position-relative d-flex align-items-stretch" id={`fli-${fileList[key].id}`}>
                    <div className="position-relative flex-grow-1 align-items-center d-flex">
                        <FileViewer file={fileList[key]}>
                            <a
                                className="stretched-link"
                                href={`${config.apiRoot}/files/${fileList[key].id}`}
                            >
                                {fileList[key].filename}
                            </a>
                            </FileViewer>
                    </div>
                    <button className="btn btn-danger me-1" onClick={() => deleteFile(fileList[key].id)}>Delete</button>
                    <Share id={fileList[key].id}><button className="btn btn-success me-1">Share</button></Share>
                </li>
            );
        });
    }, [data]);

    if ( files.length === 0 ) 
        return (
            <div className='container mt-1 p-3 border'>
                <div className="container">
                    <h1>No files.</h1>
                </div>
            </div>
        );
    return (
        <div className='container mt-1 p-3 border'>
            <ul className="list-group">
                { files }
            </ul>
        </div>
    );
}