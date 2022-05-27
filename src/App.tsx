import React, { ChangeEvent, ChangeEventHandler } from 'react';
import logo from './logo.svg';
import './App.css';
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from './app/store';
import { authenticateUser } from './features/account/accountSlice'
import { AsyncThunkAction } from '@reduxjs/toolkit';

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

  const name = useSelector((state: RootState) => state.name.name);
  const account = useSelector((state: RootState) => state.account);
  const dispatch: AppDispatch = useDispatch();
  const auth = (username: string, password: string) => dispatch(authenticateUser({username, password}));
  const handleChange = (which: number, event: ChangeEvent<HTMLInputElement>) => {
    setState(Object.assign({}, state, which ? {password: event.target.value} : {username: event.target.value}));
  }
  return (
  <div style={{display: 'flex', 'flexDirection': 'column', width: '400px'}}>
    <input type="text" value={state.username} onChange={e => handleChange(0, e)}/>
    <input type="text" value={state.password} onChange={e => handleChange(1, e)}/>
    <input type="button" onClick={e => auth(state.username, state.password)} value="Login"/>
    { account.loggedIn ? <p>Username: {account.username}</p>: <></> }
  </div>);
}

export default App;
