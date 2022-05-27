import { createAsyncThunk, createSlice, SliceCaseReducers } from "@reduxjs/toolkit";

export interface NameState {
    name: string;
}


export const nameSlice = createSlice<NameState, SliceCaseReducers<NameState>,'name'>({
    name: 'name',
    initialState: {
        name: ""
    },
    reducers: {
        setName: (state: NameState, action) => {
            console.log({...state});
            state.name = action.payload;
        }
    }
});



export const { setName } = nameSlice.actions;

export default nameSlice.reducer;