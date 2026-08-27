import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axiosInstance from '../../api/axiosInstance'; // 🔇 API Import আপাতত বন্ধ

// 🔇 Muted Async Thunk: API Call না করে ডামি ডাটা পাঠাবে
export const fetchDashboardData = createAsyncThunk('dashboard/fetchData', async (_, { rejectWithValue }) => {
  try {
    // ----------------------------------------------------
    // 🧪 API Call আপাতত Mute রাখা হলো:
    // const response = await axiosInstance.get('/dashboard');
    // return response.data;
    // ----------------------------------------------------

    // 🟢 Fake/Dummy Response (যাতে ফ্রন্টএন্ড এ এরর না আসে)
    return {
      stats: {
        totalOrders: 0,
        totalSales: 0,
        totalProducts: 0,
        totalCustomers: 0,
      },
      salesChart: [],
      recentOrders: [],
    };
  } catch (error) {
    return rejectWithValue('Dashboard data is currently muted');
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: {
      totalOrders: 0,
      totalSales: 0,
      totalProducts: 0,
      totalCustomers: 0,
    },
    salesChart: [],
    recentOrders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = false; // 🔇 Loading ও বন্ধ রাখা হয়েছে
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.salesChart = action.payload.salesChart;
        state.recentOrders = action.payload.recentOrders;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;