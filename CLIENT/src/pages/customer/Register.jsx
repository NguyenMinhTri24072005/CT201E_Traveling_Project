import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./Login.css";
export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Customer",
  });
  const [error, setError] = useState("");
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }
    try {
      await axiosClient.post("/auth/register", {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại!");
    }
  };
  return (
    <div className="login-page">
      <div className="login-container register">
        <h2>Đăng Ký Tài Khoản</h2>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          {}
          <div className="input-group role-selector">
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="Customer"
                checked={formData.role === "Customer"}
                onChange={handleChange}
                className="role-radio"
              />
              Khách du lịch
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="Partner"
                checked={formData.role === "Partner"}
                onChange={handleChange}
                className="role-radio"
              />
              Nhà cung cấp Tour
            </label>
          </div>
          <div className="input-group">
            <label>Họ và Tên</label>
            <input
              type="text"
              name="fullname"
              placeholder="Nhập họ và tên..."
              required
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Nhập địa chỉ email..."
              required
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              placeholder="Nhập số điện thoại..."
              required
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              placeholder="Tạo mật khẩu..."
              required
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu..."
              required
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-login">
            ĐĂNG KÝ
          </button>
        </form>
        <div className="login-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
