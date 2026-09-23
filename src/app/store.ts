import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "@entities/user";
import ticketsReducer from "@entities/ticket";
import notificationsReducer from "@entities/notification";
import toastReducer from "@app/toast/toast.slice";
import { setSessionHooks } from "@shared/api/session";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketsReducer,
    notifications: notificationsReducer,
    toast: toastReducer,
  },
});

setSessionHooks(
  () => store.getState().auth.token,
  () => store.dispatch(logout())
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
/** Alias compat con providers/componentes que esperan `AppState` como nombre. */
export type AppState = ReturnType<typeof store.getState>;