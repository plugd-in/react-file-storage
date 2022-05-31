import { useState } from 'react';
import { config } from '../App';
import { ViewerProps } from '../interfaces';

interface FallbackViewerState {
    url: string;
}

export default function FallbackViewer (props: ViewerProps) {
    const [state, setState] = useState<FallbackViewerState>({
        url: props.file instanceof Blob ? URL.createObjectURL(props.file) : `${config.apiRoot}/files/${props.file.id}`
    });
    

    return (
        <a className='btn btn-primary' href={state.url} download={props.file instanceof Blob ? null : props.file.filename}>Download File</a>
    );
}