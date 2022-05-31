import { useMemo } from "react";
import useSWR, {mutate} from "swr";

import { config } from "../App";
import { FileList } from "../interfaces";

export default function FileListComponent () {

    const { data, error } = useSWR<FileList>(`${config.apiRoot}/files`, url => fetch(url).then(response => response.json()));
    const files = useMemo(() => {
        return Object.keys(data||{}).map(key => {
            return (
                <li className="list-group-item">
                    <a href={`${config.apiRoot}/files/${(data||{})[key].id}`}>{(data||{})[key].filename}</a>
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