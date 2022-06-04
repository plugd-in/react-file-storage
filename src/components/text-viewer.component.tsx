import { useEffect, useState } from 'react'
import { config } from '../App';
import { ViewerProps } from '../interfaces'

interface TextViewerState {
    text: string;
}


export default function TextViewer (props: ViewerProps) {
    const [ text, setText ] = useState<string>("");

    const [doStartLoading, setStartLoading] = useState<boolean>(false); 

    useEffect(() => {
        props.setOnView(() => {
            setStartLoading(true);
            return Promise.resolve();
        }
    )}, []);

    useEffect(() => {
        if (doStartLoading) fetch(`${config.apiRoot}/files/${props.file.id}`).then(
            res => res.status >= 200 && res.status < 300 ?
            res.text() : Promise.reject(res.statusText)
        ).then(setText).catch(console.error);
    }, [props.file, doStartLoading]);

    return (
        <textarea className='form-control' readOnly={true} value={text}></textarea>
    );
}