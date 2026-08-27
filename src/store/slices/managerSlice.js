import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

const user = JSON.parse(localStorage.getItem("admin_user"));

console.log(user);

// ── Manager Thunks ──────────────────────────────────────────────────────────

// ⚡ Fetch All Managers
export const fetchManagers = createAsyncThunk(
  'managers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/users/managers');
      // API response structure handle
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch managers'));
    }
  }
);

// ⚡ Create New Manager
export const createManager = createAsyncThunk(
  'managers/create',
  async (managerData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/users/manager', managerData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to create manager'));
    }
  }
);

// ⚡ Update Manager (Name, Outlet, etc.)
export const updateManager = createAsyncThunk(
  'managers/update',
  async ({ id, ...managerData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/users/manager/${id}`, managerData);
      return { id, updatedData: managerData, response: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update manager'));
    }
  }
);

// ⚡ Delete Manager
export const deleteManager = createAsyncThunk(
  'managers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/users/manager/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete manager'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const managerSlice = createSlice({
  name: 'managers',
  initialState: {
    items: [],
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {
    clearManagerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch Managers ─────────────────────────────────────
      .addCase(fetchManagers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchManagers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Create Manager ─────────────────────────────────────
      .addCase(createManager.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManager.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createManager.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Update Manager ─────────────────────────────────────
      .addCase(updateManager.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateManager.fulfilled, (state, action) => {
        state.updating = false;
        const { id, updatedData } = action.payload;

        const index = state.items.findIndex(
          (item) => String(item.id) === String(id)
        );

        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedData };
        }
      })
      .addCase(updateManager.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Delete Manager ─────────────────────────────────────
      .addCase(deleteManager.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteManager.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => String(item.id) !== String(action.payload)
        );
      })
      .addCase(deleteManager.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearManagerError } = managerSlice.actions;
export default managerSlice.reducer;