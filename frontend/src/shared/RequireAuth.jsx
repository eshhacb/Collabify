import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const isAuthenticated = () => {
  try {
    return Boolean(document.cookie.includes("token=") || localStorage.getItem("token"));
  } catch {
    return false;
  }
};

export default function RequireAuth() {
  const location = useLocation();
  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}