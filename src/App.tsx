import React, { ChangeEvent, ChangeEventHandler, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { useSelector, useDispatch } from "react-redux";
import { AsyncThunkAction } from '@reduxjs/toolkit';

import { useUser } from './store/account.store';

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
    user.validateSession();
  }, [user.loggedIn]);

  const handleChange = (which: number, event: ChangeEvent<HTMLInputElement>) => {
    setState(Object.assign({}, state, which ? {password: event.target.value} : {username: event.target.value}));
  }
  return (
  <div style={{display: 'flex', 'flexDirection': 'column', width: '400px'}}>
    <input type="text" value={state.username} onChange={e => handleChange(0, e)}/>
    <input type="text" value={state.password} onChange={e => handleChange(1, e)}/>
    <input type="button" value="Login" onClick={() => user.authenticateUser(state.username, state.password)}/>
    { user.loggedIn ? <p>{user.username}</p>:<></> }
  </div>);
}

export default App;
