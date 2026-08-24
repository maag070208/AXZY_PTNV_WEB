import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  emptyTICItem,
  type CartaResponsiva,
  type TICItem,
} from "./types";
import { cartasApi, type CartaInput } from "@core/api/cartas.api";

export interface CartasState {
  draft: CartaResponsiva;
  list: CartaResponsiva[];
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "cartas_responsivas_state_v1";

const loadInitial = (): CartasState => defaultState();

const defaultState = (): CartasState => ({
  draft: {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `crt_${Date.now()}`,
    consecutivo: "",
    fecha: new Date().toISOString(),
    numeroEmpleado: "",
    empresa: "Puerto Nuevo Hotel y Villas",
    departamento: "Departamento de Mantenimiento",
    deliveryBy: "Departamento de Mantenimiento",
    items: [emptyTICItem()],
    creadoEn: new Date().toISOString(),
  },
  list: [],
  loading: false,
  error: null,
});

const persist = (state: CartasState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
};

export const fetchCartas = createAsyncThunk<CartaResponsiva[], void>(
  "cartas/fetch",
  async () => {
    const res = await cartasApi.list();
    return res.data;
  }
);

export const saveCarta = createAsyncThunk(
  "cartas/save",
  async (_, { getState }) => {
    const draft = (getState() as any).cartas.draft as CartaResponsiva;
    const item = draft.items[0];
    if (!item) throw new Error("Sin item para guardar");

    const input: CartaInput = {
      consecutivo: draft.consecutivo,
      fecha: draft.fecha,
      numeroEmpleado: draft.numeroEmpleado,
      empresa: draft.empresa,
      departamento: draft.departamento,
      areaBoss: draft.areaBoss,
      deliveryBy: draft.deliveryBy,
      responsableId: draft.responsableId,
      encargadoId: draft.encargadoId,
      item: {
        descripcion: item.descripcion,
        marca: item.marca,
        modelo: item.modelo,
        numeroSerie: item.numeroSerie,
        nombreEquipo: item.nombreEquipo,
        controlActivos: item.controlActivos,
        area: item.area,
        deviceId: item.deviceId,
      },
    };

    if (draft.id && draft.consecutivo) {
      try {
        return await cartasApi.update(draft.id, input);
      } catch {
        return await cartasApi.create(input);
      }
    }
    return await cartasApi.create(input);
  }
);

export const deleteCartaThunk = createAsyncThunk(
  "cartas/delete",
  async (id: string) => {
    await cartasApi.remove(id);
    return id;
  }
);

export const returnCartaThunk = createAsyncThunk(
  "cartas/return",
  async (data: { id: string; returnedBy: string; returnCondition: string }) => {
    return cartasApi.return(data.id, {
      returnedBy: data.returnedBy,
      returnCondition: data.returnCondition,
    });
  }
);

export const undoReturnThunk = createAsyncThunk(
  "cartas/undoReturn",
  async (id: string) => {
    return cartasApi.undoReturn(id);
  }
);

const slice = createSlice({
  name: "cartas",
  initialState: loadInitial(),
  reducers: {
    setDraftField(
      state,
      action: PayloadAction<{ field: keyof CartaResponsiva; value: string | number }>
    ) {
      const { field, value } = action.payload;
      (state.draft as unknown as Record<string, string | number>)[field] = value;
      persist(state);
    },
    setItemField(
      state,
      action: PayloadAction<{
        id: string;
        field: keyof TICItem;
        value: string;
      }>
    ) {
      const { id, field, value } = action.payload;
      const item = state.draft.items.find((i) => i.id === id);
      if (item) {
        item[field] = value;
        persist(state);
      }
    },
    setConsecutivo(state, action: PayloadAction<string>) {
      state.draft.consecutivo = action.payload;
      persist(state);
    },
    resetDraft(state) {
      const fresh = defaultState();
      state.draft = fresh.draft;
      persist(state);
    },
    loadCartaIntoDraft(state, action: PayloadAction<string>) {
      const carta = state.list.find((c) => c.id === action.payload);
      if (carta) {
        state.draft = JSON.parse(JSON.stringify(carta));
        persist(state);
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartas.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCartas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Error al cargar cartas";
      })
      .addCase(saveCarta.fulfilled, (state, action) => {
        const saved = action.payload;
        const idx = state.list.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          state.list[idx] = saved;
        } else {
          state.list.unshift(saved);
        }
        state.draft.id = saved.id;
        state.draft.consecutivo = saved.consecutivo;
        state.draft.fecha = saved.fecha;
        persist(state);
      })
      .addCase(saveCarta.rejected, (state, action) => {
        state.error = action.error.message ?? "Error al guardar";
      })
      .addCase(deleteCartaThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
      })
      .addCase(returnCartaThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(undoReturnThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
      });
  },
});

export const {
  setDraftField,
  setItemField,
  setConsecutivo,
  resetDraft,
  loadCartaIntoDraft,
  clearError,
} = slice.actions;

export default slice.reducer;