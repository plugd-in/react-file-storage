import { ChangeEvent, useState } from "react";
import { useUser } from "../store/account.store";

interface LoginState {
    username: string;
    password: string;
}

export default function LoginComponent () {
    const [state, setState] = useState<LoginState>({
        username: "",
        password: ""
    });

    const user = useUser();

    const handleChange = (which: number, event: ChangeEvent<HTMLInputElement>) => {
        setState(Object.assign({}, state, which ? {password: event.target.value} : {username: event.target.value}));
    }

    return (
        <div className='container mt-1 border rounded p-3'>
            <h4>Login</h4>
            <input className='form-control mb-1' type="text" value={state.username} onChange={e => handleChange(0, e)}/>
            <input className='form-control mb-1' type="text" value={state.password} onChange={e => handleChange(1, e)}/>
            <input className='form-control btn btn-primary' type="button" value="Login" onClick={() => user.authenticateUser(state.username, state.password)}/>
            { user.loggedIn ? <p>{user.username}</p>:<></> }
        </div>
    );
}