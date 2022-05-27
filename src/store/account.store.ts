import create, { useStore } from 'zustand';
import { Account } from '../interfaces';
import { config } from '../App';

interface AccountState {
    uid: string;
    username: string;
    passwordHash: string;
    loggedIn: boolean;
    authenticateUser: (username: string, password: string) => void;
}

const useAccount = create<AccountState>(set => ({
    username: "",
    passwordHash: "",
    uid: "",
    loggedIn: false,
    authenticateUser: async (username: string, password: string) => {
        const newState = await fetch(`${config.apiRoot}/account/login`, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Origin": "*"
            },
            mode: "cors",
            method: "POST",
            body: JSON.stringify({username, password})
        }).then(response => {
            if ( response.status >= 200 && response.status < 300)
                return Promise.resolve(response.json())
            return Promise.reject(new Error(response.statusText));
        }).then((userInfo: Account) => {
            return {...userInfo, loggedIn: true}
        });
        set(newState);
    }
}));

export const useUser = () => useAccount(state => state);