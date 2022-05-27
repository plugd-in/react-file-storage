import { configureStore, EnhancedStore, Store,  } from "@reduxjs/toolkit";
import nameReducer from '../features/name/nameSlice'

import accountReducer from '../features/account/accountSlice'

const store = configureStore({
    reducer: {
        name: nameReducer,
        account: accountReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware()
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export default store;