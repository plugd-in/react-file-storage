import React, { ChangeEvent, ChangeEventHandler, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { useSelector, useDispatch } from "react-redux";
import { AsyncThunkAction } from '@reduxjs/toolkit';
import useSWR, { mutate } from 'swr';

import FileList from './components/file-list.component';
import { useUser } from './store/account.store';
import FileUpload from './components/file-upload.component';
import CreateAccount from './components/create-account.component';


export const config = {
  apiRoot: "http://localhost:8080"
};

interface AppProps {

};
interface AppState {
  username: string;
  password: string;
};

function App (props: AppProps) {
  const [ state, setState ] = React.useState<AppState>({
    username: "",
    password: ""
  });



  const user = useUser();
  
  useEffect(() => {
    if ( user.loggedIn ) 
      mutate(`${config.apiRoot}/files`);
    user.validateSession();
  }, [user.loggedIn, user.username]);

  const handleChange = (which: number, event: ChangeEvent<HTMLInputElement>) => {
    setState(Object.assign({}, state, which ? {password: event.target.value} : {username: event.target.value}));
  }
  return (
    <div className='container'>
      <CreateAccount />
      <div className='container mt-1 border rounded p-3'>
        <input className='form-control mb-1' type="text" value={state.username} onChange={e => handleChange(0, e)}/>
        <input className='form-control mb-1' type="text" value={state.password} onChange={e => handleChange(1, e)}/>
        <input className='form-control btn btn-primary' type="button" value="Login" onClick={() => user.authenticateUser(state.username, state.password)}/>
        { user.loggedIn ? <p>{user.username}</p>:<></> }
      </div>
      <FileList />
      <FileUpload />
    </div>);
}

export default App;
