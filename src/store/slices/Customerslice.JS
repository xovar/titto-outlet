import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// ── Customer Thunks ─────────────────────────────────────────────────────────

// ⚡ Fetch All Customers (সাপোর্টস পেজিনেশন এবং সার্চ)
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = typeof params === 'string' ? { search: params } : params;
      const { page = 1, limit = 20, search } = queryParams;

      let url = `/customers?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await axiosInstance.get(url);
      return response.data; // রেসপন্স: { data: [...], pagination: {...} }
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch customers'));
    }
  }
);

// ⚡ Single Customer Fetch Thunk (order history সহ)
export const fetchCustomerById = createAsyncThunk(
  'customers/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch customer details'));
    }
  }
);

// ⚡ Search Customer By Phone Thunk (POS "Add Customer" ফ্লো)
// রেসপন্স: { found: boolean, customer: {...} | null } — 404 না, তাই
// rejectWithValue শুধু আসল network/server error এর জন্য ব্যবহার হয়, "না
// পাওয়া" একটা normal fulfilled state (found: false)।
export const searchCustomerByPhone = createAsyncThunk(
  'customers/searchByPhone',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/customers/search?phone=${encodeURIComponent(phone)}`);
      return response.data; // { found, customer }
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to search customer'));
    }
  }
);

// ⚡ Create Customer Thunk
export const createCustomer = createAsyncThunk(
  'customers/create',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/customers', customerData);
      return response.data; // { message, customer }
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to create customer'));
    }
  }
);

// ⚡ Update Customer Thunk
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, ...customerData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/customers/${id}`, customerData);
      return { id, updatedData: customerData, response: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update customer'));
    }
  }
);

// ⚡ Delete Customer Thunk
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/customers/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete customer'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    items: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
    selectedCustomer: null,
    // POS "Add Customer" মোডালের জন্য আলাদা state — মূল customers list-এর
    // সাথে না মিশিয়ে রাখা হয়েছে, যাতে সার্চ করার সময় বাকি লিস্ট/UI
    // অপ্রয়োজনীয়ভাবে re-render না হয়।
    searchResult: {
      found: null, // null = কোনো সার্চ হয়নি এখনো
      customer: null,
    },
    loading: false,
    searching: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  },
  reducers: {
    clearCustomerError: (state) => {
      state.error = null;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    clearSearchResult: (state) => {
      state.searchResult = { found: null, customer: null };
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch All Customers ───────────────────────────────
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Fetch Customer By ID ──────────────────────────────
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Search Customer By Phone ──────────────────────────
      .addCase(searchCustomerByPhone.pending, (state) => {
        state.searching = true;
        state.error = null;
      })
      .addCase(searchCustomerByPhone.fulfilled, (state, action) => {
        state.searching = false;
        state.searchResult = {
          found: action.payload.found,
          customer: action.payload.customer,
        };
      })
      .addCase(searchCustomerByPhone.rejected, (state, action) => {
        state.searching = false;
        state.error = action.payload;
        state.searchResult = { found: null, customer: null };
      })

      // ── Create Customer ───────────────────────────────────
      .addCase(createCustomer.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.creating = false;
        const newCustomer = action.payload.customer;
        if (newCustomer) {
          state.items.unshift(newCustomer);
          state.pagination.total += 1;
          // সদ্য তৈরি হওয়া কাস্টমারকেই "খুঁজে পাওয়া গেছে" হিসেবে সেট করে
          // দেওয়া হচ্ছে, যাতে POS মোডাল সাথে সাথে সিলেক্ট করতে পারে।
          state.searchResult = { found: true, customer: newCustomer };
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      // ── Update Customer ───────────────────────────────────
      .addCase(updateCustomer.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.updating = false;
        const { id, response } = action.payload;
        const updatedCustomer = response?.customer;

        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1 && updatedCustomer) {
          state.items[index] = updatedCustomer;
        }

        if (state.selectedCustomer?.id === id && updatedCustomer) {
          state.selectedCustomer = { ...state.selectedCustomer, ...updatedCustomer };
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Delete Customer ───────────────────────────────────
      .addCase(deleteCustomer.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((item) => item.id !== action.payload);

        if (state.pagination && state.pagination.total > 0) {
          state.pagination.total -= 1;
        }

        if (state.selectedCustomer?.id === action.payload) {
          state.selectedCustomer = null;
        }
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearCustomerError, clearSelectedCustomer, clearSearchResult } = customerSlice.actions;
export default customerSlice.reducer;