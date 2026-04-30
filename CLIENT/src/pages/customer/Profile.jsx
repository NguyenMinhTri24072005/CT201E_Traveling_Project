import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Swal from "sweetalert2";
import { FiUser, FiLock, FiCamera } from "react-icons/fi";
import { IMAGE_URL } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
import "./Profile.css";
export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    fullname: "",
    phone: "",
    email: "",
    cccd: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get("/users/profile");
      setProfileData({
        fullname: res.data.fullname || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        cccd: res.data.cccd || "",
      });
      if (res.data.avatar && !res.data.avatar.includes("default")) {
        setAvatarPreview(res.data.avatar);
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi lấy profile:", error);
      setLoading(false);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("fullname", profileData.fullname);
    formData.append("phone", profileData.phone);
    formData.append("cccd", profileData.cccd);
    if (avatarFile) formData.append("avatar", avatarFile);
    try {
      const res = await axiosClient.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(res.data.user || res.data);
      Swal.fire("Thành công!", "Cập nhật hồ sơ thành công.", "success");
    } catch (error) {
      Swal.fire("Lỗi", error.response?.data || "Có lỗi xảy ra", "error");
    }
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp!", "error");
    }
    try {
      await axiosClient.put("/users/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      Swal.fire("Thành công!", "Đổi mật khẩu thành công.", "success");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      Swal.fire(
        "Thất bại",
        error.response?.data || "Sai mật khẩu cũ!",
        "error",
      );
    }
  };
  if (loading) return <h2 className="profile-loading">Đang tải hồ sơ...</h2>;
  return (
    <div className="profile-page">
      <div className="profile-container">
        {}
        <div className="profile-sidebar" id="test-sidebar">
          <div className="sidebar-avatar-section">
            <div className="avatar-wrapper">
              <img
                src={
                  avatarPreview
                    ? avatarPreview.startsWith("blob")
                      ? avatarPreview
                      : `${IMAGE_URL}${avatarPreview}`
                    : "https://via.placeholder.com/150"
                }
                alt="Avatar"
              />
              <label htmlFor="avatar-upload" className="upload-btn">
                <FiCamera />
              </label>
              <input
                type="file"
                id="avatar-upload"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <h3>{profileData.fullname}</h3>
            <p>{profileData.email}</p>
          </div>
          <ul className="profile-menu">
            <li
              className={activeTab === "info" ? "active" : ""}
              onClick={() => setActiveTab("info")}
            >
              <FiUser /> <span>Thông tin cá nhân</span>
            </li>
            <li
              className={activeTab === "password" ? "active" : ""}
              onClick={() => setActiveTab("password")}
            >
              <FiLock /> <span>Đổi mật khẩu</span>
            </li>
          </ul>
        </div>
        {}
        <div className="profile-content">
          {activeTab === "info" ? (
            <div className="tab-pane fade-in">
              <h2>Thông Tin Hồ Sơ</h2>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Email (Cố định)</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Họ và Tên</label>
                  <input
                    type="text"
                    value={profileData.fullname}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fullname: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CCCD</label>
                  <input
                    type="text"
                    value={profileData.cccd}
                    onChange={(e) =>
                      setProfileData({ ...profileData, cccd: e.target.value })
                    }
                  />
                </div>
                <button type="submit" className="btn-save">
                  LƯU THAY ĐỔI
                </button>
              </form>
            </div>
          ) : (
            <div className="tab-pane fade-in">
              <h2>Đổi Mật Khẩu</h2>
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label>Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={passwords.oldPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        oldPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn-save">
                  CẬP NHẬT
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
