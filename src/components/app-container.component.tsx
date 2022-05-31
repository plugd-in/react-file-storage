import { Component, FunctionComponent, PropsWithChildren, ReactNode, Children, isValidElement, useMemo, cloneElement} from "react";
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
                nb.push(cloneElement(child, {...child.props, className: "fixed-top"}));
            else realChildren.push(child);
        });
        return [nb, realChildren];
    }, [props.children]);
    return (
        <div className={"container-fluid px-0 " + (navbar.length > 0 ? "pt-5" : '')}>
            { navbar }
            <div className="pt-2 container">
                { children }
            </div>
        </div>
    );
}