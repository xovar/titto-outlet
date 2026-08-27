import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// ── Banner Thunks ──────────────────────────────────────────────────────────

// ⚡ Get All Banners
export const fetchBanners = createAsyncThunk(
  'banners/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/banners');
      const resData = response.data;
      
      // ব্যাকএন্ড ডাটা অ্যারে কিনা নিশ্চিত করা
      if (Array.isArray(resData)) return resData;
      if (Array.isArray(resData?.data)) return resData.data;
      if (Array.isArray(resData?.banners)) return resData.banners;

      return [];
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch banners'));
    }
  }
);

// ⚡ Single Banner Fetch Thunk
export const fetchBannerById = createAsyncThunk(
  'banners/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/banners/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch banner details'));
    }
  }
);

// ⚡ Add / Create New Banner
export const addBanner = createAsyncThunk(
  'banners/add',
  async (bannerData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/banners', bannerData);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to add banner'));
    }
  }
);

// 🟢 Alias: AddBanner.jsx-এ createBanner নামে ইম্পোর্ট করলেও যেন কাজ করে
export const createBanner = addBanner;

// ⚡ Update Banner
export const updateBanner = createAsyncThunk(
  'banners/update',
  async ({ id, bannerData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/banners/${id}`, bannerData);
      const resData = response.data?.data || response.data;
      return { id, ...(typeof resData === 'object' ? resData : {}) };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update banner'));
    }
  }
);

// ⚡ Delete Banner
export const deleteBanner = createAsyncThunk(
  'banners/delete',
  async (bannerId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/banners/${bannerId}`);
      return bannerId;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete banner'));
    }
  }
);

// ⚡ Toggle Banner Active/Inactive Status
export const toggleBannerStatus = createAsyncThunk(
  'banners/toggleStatus',
  async ({ id, is_active }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/banners/${id}/status`, { is_active });
      return { id, is_active, ...response.data?.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update banner status'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const bannerSlice = createSlice({
  name: 'banners',
  initialState: {
    items: [],
    selectedBanner: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearBannerError: (state) => {
      state.error = null;
    },
    clearSelectedBanner: (state) => {
      state.selectedBanner = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch All Banners ─────────────────────────────────
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Fetch Single Banner ──────────────────────────────
      .addCase(fetchBannerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBannerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBanner = action.payload;
      })
      .addCase(fetchBannerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Add / Create Banner ──────────────────────────────
      .addCase(addBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBanner.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(addBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Update Banner ─────────────────────────────────────
      .addCase(updateBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.loading = false;
        const targetId = action.payload.id || action.payload._id;
        const index = state.items.findIndex(
          (item) => String(item.id || item._id) === String(targetId)
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Delete Banner ─────────────────────────────────────
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => String(item.id || item._id) !== String(action.payload)
        );
      })

      // ── Toggle Banner Status ──────────────────────────────
      .addCase(toggleBannerStatus.fulfilled, (state, action) => {
        const targetId = action.payload.id || action.payload._id;
        const index = state.items.findIndex(
          (item) => String(item.id || item._id) === String(targetId)
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      });
  },
});

export const { clearBannerError, clearSelectedBanner } = bannerSlice.actions;
export default bannerSlice.reducer;