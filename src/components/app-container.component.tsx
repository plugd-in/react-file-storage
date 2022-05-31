import { Component, FunctionComponent, PropsWithChildren, ReactNode, Children, isValidElement, useMemo} from "react";
import Navbar from "./navbar.component";

interface AppContainerProps {
    children: ReactNode | null;
}

export default function AppContainer (props: AppContainerProps) {
    const [ navbar, children ] = useMemo(() => {
        const nb: ReturnType<typeof Navbar>[] = [];
        const realChildren: ReactNode[] = [];
        Children.toArray(props.children).forEach(child => {
            if ( isValidElement(child) && child.type === Navbar )
                nb.push(child);
            else realChildren.push(child);
        });
        return [nb, realChildren];
    }, [props.children]);
    return (
        <div className="container-fluid px-0">
            { navbar }
            <div className="container">
                { children }
            </div>
        </div>
    );
}