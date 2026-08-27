import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// Helper: Response Extractor for Arrays
const safeExtractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.outlets)) return data.outlets;
  return [];
};

// ── Product Thunks ──────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/products');
    return safeExtractArray(response.data);
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch products'));
  }
});

export const fetchProductById = createAsyncThunk('products/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch product details'));
  }
});

export const addProduct = createAsyncThunk(
  'products/add',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      const resData = response.data?.data || response.data;

      const isFormData = productData instanceof FormData;
      const plainData = isFormData ? Object.fromEntries(productData.entries()) : productData;

      const newId = resData?.productId || resData?.id;
      return {
        id: newId,
        ...plainData,
        viewed: 0,
        sold: 0,
      };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to add product'));
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      await axiosInstance.put(`/products/${id}`, productData);
      
      const isFormData = productData instanceof FormData;
      const plainData = isFormData ? Object.fromEntries(productData.entries()) : productData;

      return { id, ...plainData };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update product'));
    }
  }
);

export const deleteProduct = createAsyncThunk('products/delete', async (productId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/products/${productId}`);
    return productId;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete product'));
  }
});

// ── Category Thunks ─────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/categories');
    return safeExtractArray(response.data);
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch categories'));
  }
});

export const addCategory = createAsyncThunk('products/addCategory', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/categories', data);
    return response.data?.data || response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add category'));
  }
});

export const deleteCategory = createAsyncThunk('products/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/categories/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete category'));
  }
});

// ── Brand Thunks ────────────────────────────────────────────────────────────

export const fetchBrands = createAsyncThunk('products/fetchBrands', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/brands');
    return safeExtractArray(response.data);
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch brands'));
  }
});

export const addBrand = createAsyncThunk('products/addBrand', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/brands', data);
    return response.data?.data || response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add brand'));
  }
});

export const deleteBrand = createAsyncThunk('products/deleteBrand', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/brands/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete brand'));
  }
});

// ── Color Thunks ────────────────────────────────────────────────────────────

export const fetchColors = createAsyncThunk('products/fetchColors', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/colors');
    return safeExtractArray(response.data);
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch colors'));
  }
});

export const addColor = createAsyncThunk('products/addColor', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/colors', data);
    return response.data?.data || response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add color'));
  }
});

export const deleteColor = createAsyncThunk('products/deleteColor', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/colors/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete color'));
  }
});

// ── Outlet Thunks (⚡ New) ─────────────────────────────────────────────────

export const fetchOutlets = createAsyncThunk('products/fetchOutlets', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/outlets');
    return safeExtractArray(response.data);
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch outlets'));
  }
});

export const addOutlet = createAsyncThunk('products/addOutlet', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/outlets', data);
    return response.data?.data || response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add outlet'));
  }
});

export const deleteOutlet = createAsyncThunk('products/deleteOutlet', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/outlets/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete outlet'));
  }
});

// ── Slice Definition ────────────────────────────────────────────────────────

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    selectedProduct: null,
    categories: [],
    brands: [],
    colors: [],
    outlets: [], // ⚡ Added Outlets State

    loading: {
      products: false,
      categories: false,
      brands: false,
      colors: false,
      outlets: false,
    },
    error: {
      products: null,
      categories: null,
      brands: null,
      colors: null,
      outlets: null,
    },
  },
  reducers: {
    clearError: (state, action) => {
      const target = action.payload;
      if (state.error[target] !== undefined) {
        state.error[target] = null;
      } else {
        state.error = { products: null, categories: null, brands: null, colors: null, outlets: null };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Products ──────────────────────────────────────────
      .addCase(fetchProducts.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.products = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading.products = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      .addCase(addProduct.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading.products = false;
        if (action.payload) state.items.unshift(action.payload);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading.products = false;
        const index = state.items.findIndex((item) => String(item.id) === String(action.payload.id));
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => String(item.id) !== String(action.payload));
      })

      // ── Categories ────────────────────────────────────────
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        state.error.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error.categories = action.payload;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        if (action.payload) state.categories.push(action.payload);
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => String(c.id || c._id) !== String(action.payload)
        );
      })

      // ── Brands ────────────────────────────────────────────
      .addCase(fetchBrands.pending, (state) => {
        state.loading.brands = true;
        state.error.brands = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading.brands = false;
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading.brands = false;
        state.error.brands = action.payload;
      })
      .addCase(addBrand.fulfilled, (state, action) => {
        if (action.payload) state.brands.push(action.payload);
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.brands = state.brands.filter(
          (b) => String(b.id || b._id) !== String(action.payload)
        );
      })

      // ── Colors ────────────────────────────────────────────
      .addCase(fetchColors.pending, (state) => {
        state.loading.colors = true;
        state.error.colors = null;
      })
      .addCase(fetchColors.fulfilled, (state, action) => {
        state.loading.colors = false;
        state.colors = action.payload;
      })
      .addCase(fetchColors.rejected, (state, action) => {
        state.loading.colors = false;
        state.error.colors = action.payload;
      })
      .addCase(addColor.fulfilled, (state, action) => {
        if (action.payload) state.colors.push(action.payload);
      })
      .addCase(deleteColor.fulfilled, (state, action) => {
        state.colors = state.colors.filter(
          (c) => String(c.id || c._id) !== String(action.payload)
        );
      })

      // ── Outlets ───────────────────────────────────────────
      .addCase(fetchOutlets.pending, (state) => {
        state.loading.outlets = true;
        state.error.outlets = null;
      })
      .addCase(fetchOutlets.fulfilled, (state, action) => {
        state.loading.outlets = false;
        state.outlets = action.payload;
      })
      .addCase(fetchOutlets.rejected, (state, action) => {
        state.loading.outlets = false;
        state.error.outlets = action.payload;
      })
      .addCase(addOutlet.fulfilled, (state, action) => {
        if (action.payload) state.outlets.push(action.payload);
      })
      .addCase(deleteOutlet.fulfilled, (state, action) => {
        state.outlets = state.outlets.filter(
          (o) => String(o.id || o._id) !== String(action.payload)
        );
      });
  },
});

export const { clearError } = productSlice.actions;
export default productSlice.reducer;