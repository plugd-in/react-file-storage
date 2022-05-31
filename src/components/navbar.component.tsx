import { BsFillPersonFill } from 'react-icons/bs'
import { useUser } from '../store/account.store';

interface NavbarProps {
    className?: string;
}

export default function Navbar (props: NavbarProps) {
    const user = useUser();

    

    return (
        <nav className={"navbar navbar-expand-lg bg-dark text-light " + (props.className || '')}>
            <div className="container-fluid">
                <span className="navbar-brand mb-0 h1" >File Storage</span>
                <a className="btn btn-outline-primary rounded-0" href="#">
                    <BsFillPersonFill size="1rem" className='align-middle'/> {user.username}
                </a>
            </div>
        </nav>
    );
}