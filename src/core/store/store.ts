import { configureStore } from "@reduxjs/toolkit";
import cartasReducer from "./cartas/cartas.slice";
import authReducer from "./auth/auth.slice";
import ticketsReducer from "./tickets/tickets.slice";
import notificationsReducer from "./notifications/notifications.slice";

export const store = configureStore({
  reducer: {
    cartas: cartasReducer,
    auth: authReducer,
    tickets: ticketsReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;