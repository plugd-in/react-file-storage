import { useState } from 'react';
import { config } from '../App';
import { ViewerProps } from '../interfaces';

interface FallbackViewerState {
    url: string;
}

export default function FallbackViewer (props: ViewerProps) {
    

    return (
        <a className='btn btn-primary' target='_blank' href={props.file instanceof Blob ? URL.createObjectURL(props.file) : `${config.apiRoot}/files/${props.file.id}`}/* download={props.file instanceof Blob ? null : props.file.filename}*/>Open/Download File</a>
    );
}