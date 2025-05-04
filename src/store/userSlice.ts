"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  username: string | null;
  email: string | null;
  id: number | null;
}

const initialState: UserState = {
  username: null,
  email: null,
  id: null
};

export const userSlice = createSlice({
    
  name: "user",
  initialState,

  reducers: {

    setUser: (state, action: PayloadAction<{ username: string; email: string; id: number }>) => {
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.id = action.payload.id;
    },

    clearUser: (state) => {
      state.username = null;
      state.email = null;
      state.id = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
