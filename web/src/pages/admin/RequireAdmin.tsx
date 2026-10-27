import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/store";

// Sends visitors without a session to the login page, then back where they were
export default function RequireAdmin() {
  const token = useAuth((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
