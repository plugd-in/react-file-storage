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
        fileLoaded: false
    });

    const [{childFunction}, setFunction] = useState<{childFunction: (e: Event) => Promise<void>}>({childFunction: () => Promise.resolve()});
    const clickProxy = (original: Function | undefined) => {
        return (e: Event) => {
            console.log(childFunction);
            
            childFunction(e).then(() => {
                if (typeof original === "function") original(e)
            }).catch(err =>  console.error(err));
        };
    }

    const setChildFunction = (func: (e: Event) => Promise<void>) => {
        setFunction({childFunction: func});
    }

    const viewSelect = useMemo(() => {
        if (props.file === null) return null;
        if ( props.file.filename.endsWith('.txt')) {
            return <TextViewer setOnView={setChildFunction} file={props.file} />
        }
        return <FallbackViewer setOnView={setChildFunction} file={props.file}/>;
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
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}