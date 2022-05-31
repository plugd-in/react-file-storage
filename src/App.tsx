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
import LoginComponent from './components/login.component';
import AppContainer from './components/app-container.component';


export const config = {
  apiRoot: "http://localhost:8080"
};


interface AppProps {

};

function App (props: AppProps) {

  const user = useUser();
  
  useEffect(() => {
    if ( user.loggedIn ) 
      mutate(`${config.apiRoot}/files`);
    user.validateSession();
  }, [user.loggedIn, user.username]);

  if ( !user.loggedIn ) return (
    <AppContainer>
      <CreateAccount />
      <LoginComponent />
    </AppContainer>
  );
  return (
    <AppContainer>
      <FileList />
      <FileUpload />
    </AppContainer>
  );
}

export default App;
