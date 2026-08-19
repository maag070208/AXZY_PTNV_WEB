import { configureStore } from "@reduxjs/toolkit";
import cartasReducer from "./cartas/cartas.slice";
import authReducer from "./auth/auth.slice";

export const store = configureStore({
  reducer: {
    cartas: cartasReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;