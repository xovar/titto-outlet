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
      const { page = 1, limit = 10, status, channel } = queryParams;

      let url = `/orders?page=${page}&limit=${limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }
      if (channel && channel !== 'all') {
        url += `&channel=${channel}`;
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

// ⚡ Create Manual Order Thunk (website checkout — channel: 'online')
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

// ⚡ Create POS Sale Thunk (in-store checkout — channel: 'pos')
// আলাদা endpoint কারণ এখানে shipping ফিল্ড লাগে না, outlet সাথে সাথেই সেট
// হয়, আর stock/status/sold-count সব সাথে সাথেই আপডেট হয়ে যায় (ready-made
// 'delivered' — POS sale মানেই বিক্রি ওই মুহূর্তেই সম্পন্ন)।
export const createPosOrder = createAsyncThunk(
  'orders/createPos',
  async (posOrderData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/orders/pos', posOrderData);
      return response.data; // { message, orderId, totalAmount }
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to complete sale'));
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

// ⚡ Deliver Order with SKUs Thunk
// FIX: this used to PUT to `/orders/:id/deliver`, which doesn't exist as a
// route anywhere in orderRoutes.js — the request was 404-ing silently
// (falling through to app.js's catch-all 404 handler), so neither the
// status nor any SKU ever reached the backend. The backend's existing
// `/orders/:id/status` endpoint (updateOrderStatus) now accepts an optional
// `items` array of { id, sku } and validates + persists each SKU before
// deducting stock — so this just needs to hit that same endpoint.
export const deliverOrderWithSkus = createAsyncThunk(
  'orders/deliverWithSkus',
  async ({ orderId, status = 'delivered', items }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/status`, {
        status,
        items, // [{ id, sku }, ...] — validated server-side against variant_sizes
      });
      return { orderId, status, items, data: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to mark order as delivered'));
    }
  }
);

// ⚡ Update Order Outlet Thunk (HTTP Method: PUT)
export const updateOrderOutlet = createAsyncThunk(
  'orders/updateOutlet',
  async ({ id, outletId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}/outlet`, { outletId });
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
    // POS sale placement — আলাদা রাখা হয়েছে যাতে অন্য কোথাও (যেমন orders
    // লিস্ট পেজ) চলমান `loading` এর সাথে conflict না করে।
    placingOrder: false,
    lastPosOrder: null, // শেষ সফল POS sale এর { orderId, totalAmount } — রিসিট দেখাতে কাজে লাগবে
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearLastPosOrder: (state) => {
      state.lastPosOrder = null;
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

      // ── Create Order (online) ─────────────────────────────
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.loading = false;
        if (state.pagination) {
          state.pagination.total += 1;
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Create POS Sale ────────────────────────────────────
      .addCase(createPosOrder.pending, (state) => {
        state.placingOrder = true;
        state.error = null;
      })
      .addCase(createPosOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.lastPosOrder = {
          orderId: action.payload.orderId,
          totalAmount: action.payload.totalAmount,
        };
        if (state.pagination) {
          state.pagination.total += 1;
        }
      })
      .addCase(createPosOrder.rejected, (state, action) => {
        state.placingOrder = false;
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

        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index].status = status;
        }

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

      // ── Deliver Order with SKUs ────────────────────────────
      .addCase(deliverOrderWithSkus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(deliverOrderWithSkus.fulfilled, (state, action) => {
        state.updating = false;
        const { orderId, status, items: updatedItems } = action.payload;

        // Helper function for updating items SKU
        const applySkuUpdates = (order) => {
          if (!order || !order.items) return;
          order.status = status;
          order.items = order.items.map((item, idx) => {
            const match = updatedItems.find(
              (uItem) => uItem.id === item.id || uItem.id === item._id || uItem.id === idx
            );
            return match ? { ...item, sku: match.sku } : item;
          });
        };

        // ১. অর্ডারের লিস্টে আপডেট
        const index = state.items.findIndex((item) => item.id === orderId);
        if (index !== -1) {
          applySkuUpdates(state.items[index]);
        }

        // ২. সিলেক্টেড অর্ডারে আপডেট
        if (state.selectedOrder) {
          if (state.selectedOrder.id === orderId) {
            applySkuUpdates(state.selectedOrder);
          } else if (state.selectedOrder.data?.id === orderId) {
            applySkuUpdates(state.selectedOrder.data);
          }
        }
      })
      .addCase(deliverOrderWithSkus.rejected, (state, action) => {
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

        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index].outletId = outletId;
          state.items[index].outletName = outletName;
        }

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
        const authoritativePrice = response?.totalAmount;

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
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError, clearSelectedOrder, clearLastPosOrder } = orderSlice.actions;
export default orderSlice.reducer;