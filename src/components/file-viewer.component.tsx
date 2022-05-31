import { Component, ComponentClass, createElement, FunctionComponent, useMemo } from "react";
import { cloneElement, ReactElement, ReactHTMLElement, useState } from "react";
import { render } from "react-dom";
import { JsxElement } from "typescript";
import { config } from "../App";
import { FileObject } from "../interfaces";
import FallbackViewer from "./fallback-viewer.component";
import TextViewer from "./text-viewer.component";

interface FileViewerProps {
    children: ReactElement;
    file: FileObject;
}

interface FileViewerState {
    cType: string | null;
    file: Blob | FileObject | null;
    fileLoaded: boolean;
}


const fetchStatus = (response: Response) => {
    if ( response.status >= 200 && response.status < 300)
        return Promise.resolve(response);
    return Promise.reject(new Error(response.statusText));
}

export default function FileViewer(props: FileViewerProps) {
    const [state, setState] = useState<FileViewerState>({
        cType: null,
        file: null,
        fileLoaded: false
    });

    const load = () => {
        return fetch(`${config.apiRoot}/files/${props.file.id}`).then(fetchStatus).then(response => {
            console.log(response);
            console.log(response.headers.get("Content-Type"));
            return response.blob().then(blob => {
                if ( blob.type == "text/plain")
                    setState({file: blob, cType: blob.type, fileLoaded: true});
                else setState({file: props.file, cType: blob.type, fileLoaded: true});
            });
        });
    };

    const clickProxy = (original: Function | undefined) => {
        return (e: Event) => {
            load().then(() => {
                if (original) original(e);
            }).catch((err) => {
                if (original) original(e);
            });
        };
    }

    const viewSelect = useMemo(() => {
        if ( !state.fileLoaded ) return null;
        switch (state.cType) {
            // @ts-ignore
            case 'text/plain':
                if (state.file && state.file instanceof Blob) return <TextViewer file={state.file} />

            default:
                return state.file ? <FallbackViewer file={state.file}/> : null;
        }
    }, [state]);

    return (
        <>
            {cloneElement(props.children, { ...props.children.props, "data-bs-toggle": "modal", "data-bs-target": `#modal-${props.file.id}`, onClick: clickProxy(props.children.props["onClick"])})}
            <div className="modal fade" id={`modal-${props.file.id}`} data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby={`modal-${props.file.id}-label`} aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id={`modal-${props.file.id}-label`}>{ props.file.filename }</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            { viewSelect }
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary">Understood</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}