import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";
import { IMAGE_URL } from "../../utils/constants";
import Swal from "sweetalert2";
import "./AdminStyles.css";
import "./AdminProfile.css";
import "./ShopSettings.css";
export default function ShopSettings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    shopDescription: "",
    shopPolicies: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [previewCover, setPreviewCover] = useState("");
  useEffect(() => {
    if (user) {
      setFormData({
        shopName: user.shopName || "",
        shopDescription: user.shopDescription || "",
        shopPolicies: user.shopPolicies || "",
      });
      if (user.coverImage) setPreviewCover(`${IMAGE_URL}${user.coverImage}`);
    }
  }, [user]);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setPreviewCover(URL.createObjectURL(file));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append("shopName", formData.shopName);
    data.append("shopDescription", formData.shopDescription);
    data.append("shopPolicies", formData.shopPolicies);
    if (coverFile) data.append("coverImage", coverFile);
    try {
      const res = await axiosClient.put("/users/shop/update", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        title: "Thành công",
        text: "Đã cập nhật giao diện Gian Hàng!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      if (updateUser) {
        updateUser(res.data.user);
      } else {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      Swal.fire("Lỗi", "Không thể cập nhật gian hàng", "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="admin-page fade-in shop-settings-container">
      <h2 className="admin-title">
        <i className="fa-solid fa-store"></i> Thiết Lập Gian Hàng
      </h2>
      <p className="shop-settings-subtitle">
        Gian hàng chuyên nghiệp sẽ giúp khách hàng tin tưởng và đặt Tour của bạn
        nhiều hơn.
      </p>
      <form onSubmit={handleSubmit} className="shop-settings-form">
        <div className="shop-form-group">
          <label className="shop-form-label">
            Ảnh Bìa Gian Hàng (Cover Image)
          </label>
          <div
            className="cover-upload-box"
            style={{
              backgroundImage: previewCover ? `url(${previewCover})` : "none",
            }}
          >
            {!previewCover && (
              <span className="cover-upload-placeholder">
                Bấm vào để tải ảnh lên (Tỉ lệ 16:9)
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cover-upload-input"
            />
          </div>
        </div>
        <div className="shop-form-group">
          <label className="shop-form-label">
            Tên Thương Hiệu (Hiển thị cho khách)
          </label>
          <input
            required
            type="text"
            value={formData.shopName}
            onChange={(e) =>
              setFormData({ ...formData, shopName: e.target.value })
            }
            placeholder="VD: Tây Bắc Adventure, Sapa Xanh Travel..."
            className="profile-input"
          />
        </div>
        <div className="shop-form-group">
          <label className="shop-form-label">
            Giới thiệu về bạn / Công ty của bạn
          </label>
          <textarea
            required
            rows="4"
            value={formData.shopDescription}
            onChange={(e) =>
              setFormData({ ...formData, shopDescription: e.target.value })
            }
            placeholder="Viết một đoạn giới thiệu hấp dẫn về kinh nghiệm tổ chức tour của bạn..."
            className="profile-input profile-textarea"
          />
        </div>
        <div className="shop-form-group">
          <label className="shop-form-label">
            Chính sách riêng của Gian hàng
          </label>
          <textarea
            rows="3"
            value={formData.shopPolicies}
            onChange={(e) =>
              setFormData({ ...formData, shopPolicies: e.target.value })
            }
            placeholder="VD: Không hoàn hủy trước 3 ngày, Hỗ trợ đón tận nơi..."
            className="profile-input profile-textarea"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-save-shop">
          {loading ? (
            "Đang lưu..."
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk"></i> LƯU THIẾT LẬP
            </>
          )}
        </button>
      </form>
    </div>
  );
}
