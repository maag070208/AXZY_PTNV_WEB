import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { authApi, type AuthUser } from "@core/api/auth.api";

interface State {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "cartas_auth_v1";

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
  async (creds: { username: string; password: string }) => {
    const data = await authApi.login(creds.username, creds.password);
    return data;
  }
);

export const meThunk = createAsyncThunk("auth/me", async () => {
  return authApi.me();
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
        state.error = action.error.message ?? "Error de autenticación";
      })
      .addCase(meThunk.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.user = action.payload;
        persist(state);
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;