import { Component, FunctionComponent, PropsWithChildren, ReactNode } from "react";

interface AppContainerProps {
    children: ReactNode | null;
}

export default function AppContainer (props: AppContainerProps) {
    return (
        <div className="container">
            { props.children }
        </div>
    );
}