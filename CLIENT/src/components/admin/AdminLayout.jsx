import React, { useEffect } from "react";
import {
  Outlet,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { FiSend } from "react-icons/fi";
import "./AdminLayout.css";
export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const role = user?.role || "Customer";
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };
  useEffect(() => {
    if (!user || role === "Customer") {
      navigate("/", { replace: true });
    }
  }, [role, navigate, user]);
  if (!user || role === "Customer") return null;
  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>
            <Link to="/" className="brand-link">
              Tây Bắc Travel
            </Link>
          </h2>
          <p>{role === "Admin" ? "Hệ Thống Quản Trị" : "Kênh Nhà Cung Cấp"}</p>
        </div>
        <nav className="admin-nav">
          <Link
            to="/admin/profile"
            className={location.pathname.includes("/profile") ? "active" : ""}
          >
            👤 Hồ sơ của tôi
          </Link>
          <Link
            to="/admin"
            className={location.pathname === "/admin" ? "active" : ""}
          >
            📊 Tổng quan
          </Link>
          <Link
            to="/admin/bookings"
            className={location.pathname.includes("/bookings") ? "active" : ""}
          >
            🛍️ Quản lý Đơn hàng
          </Link>
          <Link
            to="/admin/tours"
            className={location.pathname.includes("/tours") ? "active" : ""}
          >
            🗺️ Quản lý Tour
          </Link>
          { }
          {role === "Admin" && (
            <>
              <Link
                to="/admin/users"
                className={location.pathname.includes("/users") ? "active" : ""}
              >
                👥 Quản lý Người dùng
              </Link>
              { }
              <Link
                to="/admin/locations"
                className={
                  location.pathname.includes("/locations") ? "active" : ""
                }
              >
                📍 Quản lý Điểm Đến
              </Link>
              { }
              <Link
                to="/admin/categories"
                className={
                  location.pathname.includes("/categories") ? "active" : ""
                }
              >
                🏷️ Quản lý Danh Mục
              </Link>
            </>
          )}
          {role === "Admin" && (
            <NavLink
              to="/admin/notifications"
              className={({ isActive }) =>
                isActive || location.pathname.includes("/notifications")
                  ? "active"
                  : ""
              }
            >
              <FiSend className="nav-icon" /> Thông báo & Phát thanh
            </NavLink>
          )}
          { }
          {role === "Partner" && (
            <NavLink
              to="/admin/shop-settings"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              🏪 Thiết lập Gian hàng
            </NavLink>
          )}
        </nav>
        <button className="btn-admin-logout" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>
      <main className="admin-main-content">
        <header className="admin-header">
          <h3>
            Xin chào,{" "}
            {user?.fullname || (role === "Admin" ? "Quản trị viên" : "Đối tác")}
            !
          </h3>
        </header>
        <div className="admin-content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
