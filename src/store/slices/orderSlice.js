import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// ── Order Thunks ────────────────────────────────────────────────────────────

// ⚡ Fetch All Orders (সাপোর্টস পেজিনেশন এবং ফিল্টারিং)
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = typeof params === 'string' ? { status: params } : params;
      const { page = 1, limit = 10, status } = queryParams;

      let url = `/orders?page=${page}&limit=${limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      const response = await axiosInstance.get(url);
      return response.data; // রেসপন্স: { data: [...], pagination: {...} }
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch orders'));
    }
  }
);

// ⚡ Single Order Fetch Thunk
export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch order details'));
    }
  }
);

// ⚡ Create Manual Order Thunk
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to create order'));
    }
  }
);

// ⚡ Update Order Status Thunk (HTTP Method: PUT)
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}/status`, { status });
      return { id, status, data: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update order status'));
    }
  }
);

// ⚡ Update Order Outlet Thunk (HTTP Method: PUT)
// Mirrors updateOrderStatus — a small, single-field control on the Order
// Details page, separate from the full updateOrder edit form.
export const updateOrderOutlet = createAsyncThunk(
  'orders/updateOutlet',
  async ({ id, outletId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}/outlet`, { outletId });
      // Backend returns { message, id, outletId, outletName }
      return { id, outletId, outletName: response.data?.outletName, data: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update order outlet'));
    }
  }
);

// ⚡ Update Entire Order Thunk
export const updateOrder = createAsyncThunk(
  'orders/update',
  async ({ id, ...orderData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}`, orderData);
      // NOTE: response.data is the backend's authoritative result
      // (it recalculates price from DB, not from client input).
      return { id, updatedData: orderData, response: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update order details'));
    }
  }
);

// ⚡ Delete Order Thunk
export const deleteOrder = createAsyncThunk(
  'orders/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/orders/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete order'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    selectedOrder: null,
    loading: false,
    updating: false,
    deleting: false,
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch All Orders ──────────────────────────────────
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Fetch Order By ID ─────────────────────────────────
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Create Order ──────────────────────────────────────
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Backend only returns { orderId, message, totalAmount } here, not the
        // full order object, so we can't safely splice a complete order into
        // `items`. Bump the total so pagination stays roughly in sync, but the
        // list itself should be refreshed via fetchOrders after this resolves.
        if (state.pagination) {
          state.pagination.total += 1;
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Update Order Status ───────────────────────────────
      .addCase(updateOrderStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updating = false;
        const { id, status } = action.payload;

        // List item update
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index].status = status;
        }

        // Selected order update (সেফ চেক)
        if (state.selectedOrder) {
          if (state.selectedOrder.id === id) {
            state.selectedOrder.status = status;
          } else if (state.selectedOrder.data?.id === id) {
            state.selectedOrder.data.status = status;
          }
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Update Order Outlet ───────────────────────────────
      .addCase(updateOrderOutlet.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrderOutlet.fulfilled, (state, action) => {
        state.updating = false;
        const { id, outletId, outletName } = action.payload;

        // List item update
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index].outletId = outletId;
          state.items[index].outletName = outletName;
        }

        // Selected order update (সেফ চেক)
        if (state.selectedOrder) {
          if (state.selectedOrder.id === id) {
            state.selectedOrder.outletId = outletId;
            state.selectedOrder.outletName = outletName;
          } else if (state.selectedOrder.data?.id === id) {
            state.selectedOrder.data.outletId = outletId;
            state.selectedOrder.data.outletName = outletName;
          }
        }
      })
      .addCase(updateOrderOutlet.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Update Full Order ─────────────────────────────────
      .addCase(updateOrder.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.updating = false;
        const { id, updatedData, response } = action.payload;

        // FIX: use the backend's authoritative totalAmount (calculated from
        // DB prices) instead of recomputing from client-submitted item
        // prices. Recomputing client-side let a manipulated item.price slip
        // back into the UI even though the server had already recalculated
        // the real total.
        const authoritativePrice = response?.totalAmount;

        // ১. অর্ডারের লিস্টে সিঙ্ক
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updatedData,
            price:
              authoritativePrice !== undefined
                ? authoritativePrice
                : state.items[index].price,
          };
        }

        // ২. সিলেক্টেড অর্ডারে তথ্য সিঙ্ক
        if (state.selectedOrder) {
          const merged = {
            ...updatedData,
            ...(authoritativePrice !== undefined ? { price: authoritativePrice } : {}),
          };
          if (state.selectedOrder.id === id) {
            state.selectedOrder = { ...state.selectedOrder, ...merged };
          } else if (state.selectedOrder.data?.id === id) {
            state.selectedOrder.data = { ...state.selectedOrder.data, ...merged };
          }
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Delete Order ──────────────────────────────────────
      .addCase(deleteOrder.pending, (state) => {
        // FIX: previously missing — UI had no way to show a delete-in-flight state.
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((item) => item.id !== action.payload);

        if (state.pagination && state.pagination.total > 0) {
          state.pagination.total -= 1;
        }

        if (state.selectedOrder?.id === action.payload || state.selectedOrder?.data?.id === action.payload) {
          state.selectedOrder = null;
        }
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        // FIX: previously missing — a failed delete request never reset
        // `deleting`/surfaced an error to the UI.
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError, clearSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;