import { useEffect, useState } from 'react'
import { ViewerProps } from '../interfaces'

interface TextViewerState {
    text: string;
}

interface TextViewerProps {
    file: Blob;
}

export default function TextViewer (props: TextViewerProps) {
    const [ state, setState ] = useState<TextViewerState>({
        text: ""
    });

    useEffect(() => {
        props.file.text().then(text => {
            setState({...state, text});
        }).catch(err => console.error(err));
    }, [props.file]);

    return (
        <textarea className='form-control' readOnly={true} value={state.text}></textarea>
    );
}