import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import dashboardReducer from './slices/dashboardSlice';
import orderReducer from "./slices/orderSlice";
import bannerReducer from "./slices/bannerSlice";
import outletReducer from "./slices/outletSlice";
import categoryReducer from "./slices/categorySlice";
import managerReducer from "./slices/managerSlice"; // 👈 New Import

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    products: productReducer,
    dashboard: dashboardReducer,
    orders: orderReducer,
    banners: bannerReducer,
    outlets: outletReducer,
    categories: categoryReducer,
    managers: managerReducer, // 👈 Added Manager Reducer
  },
});