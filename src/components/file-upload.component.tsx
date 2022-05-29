import React from "react";
import { mutate } from "swr";
import { config } from "../App";

const fetchStatus = (response: Response) => {
    if ( response.status >= 200 && response.status < 300)
        return Promise.resolve(response.json())
    return Promise.reject(new Error(response.statusText));
}

export default function FileUpload () {
    function handleUpload (e: React.FormEvent<HTMLFormElement>) {
        const files = (e.currentTarget.firstElementChild as HTMLInputElement).files as FileList;
        
        const data = new FormData();

        for ( const file in files ) {
            data.append('files', files[file]);
        }

        fetch(`${config.apiRoot}/files`, {
            method: "post",
            body: data
        }).then(fetchStatus).then(response => {
            mutate(`${config.apiRoot}/files`);
        });
        e.preventDefault();
    }
    return (
        <form className='container mt-1 border rounded p-3' onSubmit={e => handleUpload(e)}>
          <input className='form-control mb-1' type="file" name="file" id="file" multiple/>
          <button className='btn btn-primary' type="submit">Upload</button>
        </form>
    );
}