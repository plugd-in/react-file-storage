import { useMemo } from "react";
import useSWR, {mutate} from "swr";

import { config } from "../App";
import { FileList } from "../interfaces";

export default function FileListComponent () {

    const { data, error } = useSWR<FileList>(`${config.apiRoot}/files`, url => fetch(url).then(response => response.json()));
    const files = useMemo(() => Object.keys(data||{}).map(key => <p>{(data||{})[key].filename}</p>), [data]);
    return (
        <div className='container mt-1 p-3 border'>
            {
                files.length > 0 ?
                files :
                <div className="container">
                    <h1>No files.</h1>
                </div>
            }
        </div>
    );
}