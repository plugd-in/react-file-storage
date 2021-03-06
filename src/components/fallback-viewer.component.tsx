import { useState } from 'react';
import { config } from '../App';
import { ViewerProps } from '../interfaces';

interface FallbackViewerState {
    url: string;
}

export default function FallbackViewer(props: ViewerProps) {


    return (
        <a  className='btn btn-primary'
            target='_blank'
            href={`${config.apiRoot}/files/${props.file.id}`}
        >Open/Download File</a>
    );
}