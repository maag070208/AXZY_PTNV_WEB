import { configureStore } from "@reduxjs/toolkit";
import cartasReducer from "@entities/carta";
import authReducer, { logout } from "@entities/user";
import ticketsReducer from "@entities/ticket";
import notificationsReducer from "@entities/notification";
import { setSessionHooks } from "@shared/api/session";

export const store = configureStore({
  reducer: {
    cartas: cartasReducer,
    auth: authReducer,
    tickets: ticketsReducer,
    notifications: notificationsReducer,
  },
});

setSessionHooks(
  () => store.getState().auth.token,
  () => store.dispatch(logout())
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;