import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// Helper: Safe Response Array Extractor
const safeExtractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
};

// ── Category Async Thunks ───────────────────────────────────────────────────

// ১. সকল ক্যাটাগরি ফেচ করার জন্য
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/categories');
      return safeExtractArray(response.data);
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch categories'));
    }
  }
);

// ২. সিঙ্গেল ক্যাটাগরি ডিটেইলস ফেচ করার জন্য
export const fetchCategoryById = createAsyncThunk(
  'categories/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch category details'));
    }
  }
);

// ৩. নতুন ক্যাটাগরি এড করার জন্য
export const addCategory = createAsyncThunk(
  'categories/add',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/categories', categoryData);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to add category'));
    }
  }
);

// ৪. ক্যাটাগরি আপডেট করার জন্য
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, categoryData);
      const resData = response.data?.data || response.data;
      return { id, ...resData };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update category'));
    }
  }
);

// ৫. ক্যাটাগরি ডিলিট করার জন্য
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete category'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    selectedCategory: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch All ──────────────────────────────────────────
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Fetch By Id ────────────────────────────────────────
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Add Category ───────────────────────────────────────
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.push(action.payload);
        }
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Update Category ────────────────────────────────────
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (item) => String(item.id || item._id) === String(action.payload.id)
        );
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Delete Category ────────────────────────────────────
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (c) => String(c.id || c._id) !== String(action.payload)
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCategoryError, setSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;