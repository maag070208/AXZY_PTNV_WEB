import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { authApi } from "../api/userApi";
import type { AuthMe, AuthUser } from "../model/types";
import i18n from "@shared/i18n";

interface State {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "ptnv_auth_v1";

const loadInitial = (): State => {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as State;
  } catch {
    return defaultState();
  }
};

const defaultState = (): State => ({
  token: null,
  user: null,
  loading: false,
  error: null,
});

const persist = (state: State) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (creds: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(creds.username, creds.password);
      return data;
    } catch (e: any) {
      // Reenviamos la causa serializable para que el componente de login
      // pueda distinguir ACCOUNT_DEACTIVATED vs INVALID_CREDENTIALS.
      return rejectWithValue({
        code: e?.code,
        message: e?.message,
        details: e?.details,
        status: e?.status,
      });
    }
  }
);

export const meThunk = createAsyncThunk("auth/me", async () => {
  const me = await authApi.me();
  // La interfaz sigue el idioma del sistema (sys_config.LANGUAGE).
  if (me.language && me.language !== i18n.language) void i18n.changeLanguage(me.language);
  return me;
});

const slice = createSlice({
  name: "auth",
  initialState: loadInitial(),
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      persist(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        persist(state);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? i18n.t("auth:login.errorAuth");
      })
      .addCase(meThunk.fulfilled, (state, action: PayloadAction<AuthMe>) => {
        state.user = action.payload;
        persist(state);
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;