import create, { useStore } from 'zustand';
import { Account } from '../interfaces';
import { config } from '../App';

interface AccountState {
    uid: string;
    username: string;
    passwordHash: string;
    loggedIn: boolean;
    authenticateUser: (username: string, password: string) => void;
    validateSession: () => Promise<void>;
    createUser: (username: string, password: string) => Promise<void>;
}

const fetchStatus = (response: Response) => {
    if ( response.status >= 200 && response.status < 300)
        return Promise.resolve(response.json().catch(() => null));
    else return Promise.reject(new Error(response.statusText));
}

const useAccount = create<AccountState>((set, get) => ({
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
        }).then(fetchStatus).then((userInfo: Account) => {
            return {...userInfo, loggedIn: true}
        });
        set(newState);
    },
    // Fetch the logged in user, if the user is logged in.
    validateSession: () => {
        return fetch(`${config.apiRoot}/account`, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Origin": "*"
            },
            mode: "cors"
        }).then(fetchStatus).then((userInfo: Account) => {
            set({...userInfo, loggedIn: true});
        });
    }, 
    createUser: function (username: string, password: string) {
        return fetch(`${config.apiRoot}/account`, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "post",
            body: JSON.stringify({username, password})
        }).then(fetchStatus).then(this.validateSession);
    }
}));

export const useUser = () => useAccount(state => state);