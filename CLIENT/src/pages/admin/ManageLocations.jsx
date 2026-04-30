import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import "./AdminStyles.css";
import "./ManageLocations.css";

export default function ManageLocations() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ name: "", imgLink: "" });
  const [editId, setEditId] = useState(null);
  const fetchLocations = async () => {
    const res = await axiosClient.get("/locations");
    setLocations(res.data);
  };
  useEffect(() => {
    fetchLocations();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axiosClient.put(`/locations/${editId}`, formData);
        alert("Cập nhật thành công!");
      } else {
        await axiosClient.post("/locations", formData);
        alert("Thêm mới thành công!");
      }
      setFormData({ name: "", imgLink: "" });
      setEditId(null);
      fetchLocations();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };
  const handleEdit = (loc) => {
    setFormData({ name: loc.name, imgLink: loc.imgLink || "" });
    setEditId(loc._id);
  };
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa điểm đến này? Các tour thuộc điểm đến này có thể bị lỗi hiển thị.",
      )
    ) {
      await axiosClient.delete(`/locations/${id}`);
      fetchLocations();
    }
  };
  return (
    <div className="admin-page">
      <h2 className="admin-title">
        <i className="fa-solid fa-location-dot"></i> Quản lý Điểm Đến (Location)
      </h2>
      <form
        onSubmit={handleSubmit}
        className="admin-form location-form-container"
      >
        <div className="form-group">
          <label>Tên điểm đến (VD: Sapa)</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
          />
        </div>
        <div className="form-group location-form-group">
          <label>Link ảnh nền (Tùy chọn)</label>
          <input
            type="text"
            value={formData.imgLink}
            onChange={(e) =>
              setFormData({ ...formData, imgLink: e.target.value })
            }
            className="form-input"
          />
        </div>
        <button type="submit" className="btn-submit-tour btn-submit-location">
          {editId ? (
            <>
              <i className="fa-solid fa-floppy-disk"></i> LƯU CẬP NHẬT
            </>
          ) : (
            <>
              <i className="fa-solid fa-plus"></i> THÊM MỚI
            </>
          )}
        </button>
        {editId && (
          <button
            type="button"
            className="btn-cancel-location"
            onClick={() => {
              setEditId(null);
              setFormData({ name: "", imgLink: "" });
            }}
          >
            Hủy
          </button>
        )}
      </form>
      <table className="admin-table location-table">
        <thead>
          <tr>
            <th>Tên Điểm Đến</th>
            <th>Link Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc._id}>
              <td>
                <b>{loc.name}</b>
              </td>
              <td>{loc.imgLink ? "Có ảnh" : "Không có"}</td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => handleEdit(loc)}
                    className="btn-edit-location"
                  >
                    <i className="fa-solid fa-pen-to-square"></i> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(loc._id)}
                    className="btn-delete-location"
                  >
                    <i className="fa-solid fa-trash-can"></i> Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
