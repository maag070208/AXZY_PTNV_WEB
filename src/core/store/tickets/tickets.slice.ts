import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { ticketsApi, type Ticket, type TicketInput } from "@core/api/tickets.api";

export interface TicketsState {
  list: Ticket[];
  current: Ticket | null;
  loading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  list: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchTickets = createAsyncThunk<Ticket[], string | undefined>(
  "tickets/fetch",
  async (search) => {
    const res = await ticketsApi.list(search);
    return res.data;
  }
);

export const fetchTicketById = createAsyncThunk<Ticket, string>(
  "tickets/fetchOne",
  async (id) => {
    return ticketsApi.get(id);
  }
);

export const createTicketThunk = createAsyncThunk<Ticket, TicketInput>(
  "tickets/create",
  async (input) => {
    return ticketsApi.create(input);
  }
);

export const updateTicketThunk = createAsyncThunk<
  Ticket,
  {
    id: string;
    data: Partial<{
      titulo: string;
      descripcion: string;
      status: string;
      priority: string;
      asignadoAId: string | null;
      departmentId: string | null;
    }>;
  }
>(
  "tickets/update",
  async ({ id, data }) => {
    return ticketsApi.update(id, data);
  }
);

export const addCommentThunk = createAsyncThunk<
  { ticketId: string; comment: any },
  { ticketId: string; texto: string }
>(
  "tickets/addComment",
  async ({ ticketId, texto }) => {
    const comment = await ticketsApi.addComment(ticketId, texto);
    return { ticketId, comment };
  }
);

export const deleteTicketThunk = createAsyncThunk<string, string>(
  "tickets/delete",
  async (id) => {
    await ticketsApi.remove(id);
    return id;
  }
);

const slice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Error al cargar tickets";
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createTicketThunk.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateTicketThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.list.findIndex((t) => t.id === updated.id);
        if (idx >= 0) state.list[idx] = updated;
        if (state.current?.id === updated.id) state.current = updated;
      })
      .addCase(addCommentThunk.fulfilled, (state, action) => {
        const { ticketId, comment } = action.payload;
        const ticket = state.list.find((t) => t.id === ticketId);
        if (ticket) ticket.comments.push(comment);
        if (state.current?.id === ticketId) state.current!.comments.push(comment);
      })
      .addCase(deleteTicketThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload);
      });
  },
});

export const { clearCurrent, clearError } = slice.actions;
export default slice.reducer;
