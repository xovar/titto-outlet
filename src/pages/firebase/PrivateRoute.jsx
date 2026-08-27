// src/routes/PrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../config/AuthContext";

export default function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // ইউজার লগইন করা থাকলে Child Route দেখাবে, না থাকলে Login পেজে পাঠিয়ে দেবে
  return user ? <Outlet /> : <Navigate to="/lock-screen" replace />;
}