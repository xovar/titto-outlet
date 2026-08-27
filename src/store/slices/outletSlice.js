import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// ── Outlet Thunks ───────────────────────────────────────────────────────────

// ⚡ Fetch All Outlets
export const fetchOutlets = createAsyncThunk(
  'outlets/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/outlets');
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch outlets'));
    }
  }
);

// ⚡ Create New Outlet
export const createOutlet = createAsyncThunk(
  'outlets/create',
  async (outletData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/outlets', outletData);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to create outlet'));
    }
  }
);

// ⚡ Update Outlet
export const updateOutlet = createAsyncThunk(
  'outlets/update',
  async ({ id, ...outletData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/outlets/${id}`, outletData);
      return { id, updatedData: outletData, response: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update outlet'));
    }
  }
);

// ⚡ Delete Outlet
export const deleteOutlet = createAsyncThunk(
  'outlets/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/outlets/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete outlet'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const outletSlice = createSlice({
  name: 'outlets',
  initialState: {
    items: [],
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {
    clearOutletError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch Outlets ─────────────────────────────────────
      .addCase(fetchOutlets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutlets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchOutlets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Create Outlet ─────────────────────────────────────
      .addCase(createOutlet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOutlet.fulfilled, (state, action) => {
        state.loading = false;
        
        // ব্যাকএন্ড থেকে আসা { outlet_id, outlet_name } রিড করে স্টেট অবজেক্টে অবজেক্ট আকারে যোগ করা
        const newOutlet = action.payload.outlet_id 
          ? { outlet_id: action.payload.outlet_id, outlet_name: action.payload.outlet_name }
          : action.payload;

        state.items.unshift(newOutlet);
      })
      .addCase(createOutlet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Update Outlet ─────────────────────────────────────
      .addCase(updateOutlet.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOutlet.fulfilled, (state, action) => {
        state.updating = false;
        const { id, updatedData } = action.payload;

        const index = state.items.findIndex(
          (item) => String(item.outlet_id) === String(id)
        );

        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedData };
        }
      })
      .addCase(updateOutlet.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Delete Outlet ─────────────────────────────────────
      .addCase(deleteOutlet.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteOutlet.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => String(item.outlet_id) !== String(action.payload)
        );
      })
      .addCase(deleteOutlet.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearOutletError } = outletSlice.actions;
export default outletSlice.reducer;