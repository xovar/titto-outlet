import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";




// 💻 POS Page (নতুন যুক্ত করা হলো)
import PosSystem from "./pages/POS/PosSystem"; // 👈 আপনার ফাইলের পাথ অনুযায়ী ঠিক করে নিন

// 🛍️ Order Pages
import OrderList from "./pages/orders/OrderList";
import OrderDetails from "./pages/orders/OrderDetails";

// Auth & LockScreen
import LockScreen from "./pages/lockscreen/LockScreen";
import PrivateRoute from "./pages/firebase/PrivateRoute";

export default function App() {
  return (
    <Routes>
      {/* 🔓 Public Route (Login/LockScreen) */}
      <Route path="/lock-screen" element={<LockScreen />} />

      {/* 🔒 Protected / Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* 💻 POS Route */}
          <Route path="pos" element={<PosSystem />} />

          {/* 🛒 Order Routes */}
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetails />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
