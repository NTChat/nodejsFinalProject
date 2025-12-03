import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthController } from '../controllers/AuthController';

function isAdminUser(u) {
  if (!u) return false;
  // chấp nhận nhiều kiểu schema
  if (typeof u.isAdmin === "boolean") return u.isAdmin;
  if (typeof u.role === "string") return u.role.toLowerCase() === "admin";
  if (Array.isArray(u.roles)) return u.roles.map(r => String(r).toLowerCase()).includes("admin");
  if (u.accountType && String(u.accountType).toLowerCase() === "admin") return true;
  return false;
}

export default function RequireAdmin({ children }) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    AuthController.checkAuth()(ctrl.signal)
      .then((json) => {
        const user = json?.user ?? json; // tuỳ API
        setAllowed(isAdminUser(user));
      })
      .catch((e) => {
        setAllowed(false);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center text-gray-600">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }
  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
