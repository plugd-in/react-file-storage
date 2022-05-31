import { ChangeEvent, useEffect, useState } from 'react';
import { config } from '../App';
import { useUser } from '../store/account.store';

interface CreateAccountProps {

}


interface CreateAccountState {
    username: string;
    password: string;
}

const fetchStatus = (response: Response) => {
    if ( response.status >= 200 && response.status < 300)
        return Promise.resolve(response);
    return Promise.reject(new Error(response.statusText));
}

export default function CreateAccount (props: CreateAccountProps) {
    const [ state, setState ] = useState<CreateAccountState>({
        username: "",
        password: ""
    });

    const user = useUser();
    
    const createUser = (...args: [string, string]) => user.createUser(...args).then(() => setState({
        username: "",
        password: ""
    }))

    useEffect(() => {
        if ( user.loggedIn == true ) {}
    }, [user.loggedIn]);

    const handleChange = (which: number, event: ChangeEvent<HTMLInputElement>) => {
        setState(Object.assign({}, state, which ? {password: event.target.value} : {username: event.target.value}));
    }
    return (
        <div className='container mt-1 border rounded p-3'>
          <input className='form-control mb-1' type="text" value={state.username} onChange={e => handleChange(0, e)}/>
          <input className='form-control mb-1' type="text" value={state.password} onChange={e => handleChange(1, e)}/>
          <input className='form-control btn btn-primary' type="button" value="Create Account" onClick={() => createUser(state.username, state.password)}/>
        </div>
    );
}