import { createAsyncThunk, createSlice, SliceCaseReducers } from "@reduxjs/toolkit";

export interface AccountState {
    uid: string | null;
    username: string | null;
    passwordHash: string | null;
    loggedIn: boolean;
}

export const authenticateUser = createAsyncThunk(
    'account/authenticateUser',
    async (action: {username: string, password: string}) => {
        return await fetch('http://localhost:8080/account/login', {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Origin": "*"
            },
            method: "POST",
            body: JSON.stringify({
                username: action.username,
                password: action.password
            }),
            mode: "cors"
        }).then((response) => {
            if ( response.status >= 200 && response.status < 300 ) {
                return response.json();
            } else return Promise.reject(new Error(response.statusText));
        }).then((userInfo: {
            username: string;
            passwordHash: string;
            uid: string;
        }) => {
            console.log("Mark 1:", userInfo);
            return {...userInfo, loggedIn: true};
        })
    }
);

export const accountSlice = createSlice<AccountState, SliceCaseReducers<AccountState>,'account'>({
    name: 'account',
    initialState: {
        loggedIn: false,
        passwordHash: null,
        uid: null,
        username: null
    },
    reducers: {
        
    },
    extraReducers: (builder) => {
        builder.addCase(authenticateUser.fulfilled, (state, action) => {
            console.log("Mark 2:", action.payload);
            Object.assign(state, action.payload);
        })
    }
});



export const {} = accountSlice.actions;

export default accountSlice.reducer;