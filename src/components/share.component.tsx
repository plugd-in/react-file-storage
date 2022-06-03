import { cloneElement, ReactElement, useCallback, useEffect, useMemo, useState } from "react"
import useSWR, { mutate } from "swr";
import { config } from "../App";
import debounce from 'lodash/debounce';
import './share.component.css'
import { Account } from "../interfaces";
import { DebouncedFunc } from "lodash";

interface ShareProps {
    children: ReactElement;
    id: string;
}


export default function Share (props: ShareProps) {
    const [searchField, setSearchField] = useState<string>('');
    const [users, setUsers] = useState<string[]>([]);
    const clickProxy = (original: Function | undefined) => {
        return (e: Event) => {
            if (original) original(e);
        };
    }

    const button = useMemo(() => {
        return cloneElement(props.children, {
            ...props.children.props,
            "data-bs-toggle": "modal",
            "data-bs-target": `#share-${props.id}`,
            onClick: clickProxy(props.children.props.onClick)
        });
    }, [props.children]);

    const db = useMemo(() => {
        if ( db ) db.cancel();
        return debounce(searchField != '' ? () => {
            
            const url = new URL(`/account/search`, config.apiRoot);
            url.searchParams.append('q', searchField);
            fetch(url.href).then(res => res.status >= 200 && res.status < 300 ? res.json() : Promise.reject(new Error(res.statusText))).then((users: {username: string}[]) => {
                setUsers(users.map(user => user.username));
            })
        } : () => {}, 300);
    }, [searchField]);

    useEffect(() => {
        return () => db.cancel();
    }, [db]);

    useEffect(db, [searchField]);


    return (
        <>
            { button }
            <div className="modal fade" id={`share-${props.id}`} data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby={`share-${props.id}-label`} aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id={`share-${props.id}-label`}>Share</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="d-flex flex-column align-items-stretch">
                                <input value={searchField}
                                    className="form-control no-bottom-radius"
                                    type="text"
                                    onChange={(e) => setSearchField(e.target.value)}
                                />
                                <ul className="list-group no-top-radius">
                                    { users.map(username => <ul className="list-group-item">{ username }</ul>) }
                                </ul>
                            </div>
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