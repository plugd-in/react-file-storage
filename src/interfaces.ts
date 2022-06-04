import React from 'react';

export interface Account {
    uid: string;
    username: string;
    passwordHash: string;
}

export interface FileObject {
    id: string;
    owner: string;
    filename: string;
}

export interface FileList {
    [id: string]: FileObject;
}

export interface ViewerProps {
    file: FileObject;
    setOnView: (func: (e: Event) => Promise<void>) => void;
}