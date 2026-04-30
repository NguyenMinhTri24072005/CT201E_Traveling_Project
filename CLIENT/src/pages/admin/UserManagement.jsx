import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Swal from "sweetalert2";
import "./AdminStyles.css";
import "./UserManagement.css";
import { IMAGE_URL } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get("/auth/users");
      setUsers(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi fetch users:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const handleCreateUser = async () => {
    const { value: formValues } = await Swal.fire({
      title:
        '<h3 class="swal-user-title"><i class="fa-solid fa-plus"></i> THÊM THÀNH VIÊN</h3>',
      html: `
                <div class="swal-form-container">
                    <div class="swal-form-group">
                        <label>Họ và tên</label>
                        <input id="swal-name" class="swal-form-input" placeholder="VD: Nguyễn Văn A">
                    </div>
                    <div class="swal-form-group">
                        <label>Email đăng nhập</label>
                        <input id="swal-email" type="email" class="swal-form-input" placeholder="example@gmail.com">
                    </div>
                    <div class="swal-form-group">
                        <label>Mật khẩu</label>
                        <input id="swal-pass" type="password" class="swal-form-input" placeholder="Nhập ít nhất 6 ký tự">
                    </div>
                    <div class="swal-form-group">
                        <label>Quyền hạn</label>
                        <select id="swal-role" class="swal-form-input">
                            <option value="Customer">Khách hàng (Customer)</option>
                            <option value="Partner">Đối tác (Partner)</option>
                            <option value="Admin">Quản trị viên (Admin)</option>
                        </select>
                    </div>
                </div>
            `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Tạo tài khoản",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2ecc71",
      preConfirm: () => {
        const fullname = document.getElementById("swal-name").value;
        const email = document.getElementById("swal-email").value;
        const password = document.getElementById("swal-pass").value;
        const role = document.getElementById("swal-role").value;
        if (!fullname || !email || !password) {
          Swal.showValidationMessage("Vui lòng nhập đầy đủ thông tin!");
        }
        return { fullname, email, password, role };
      },
    });
    if (formValues) {
      try {
        await axiosClient.post("/auth/users", formValues);
        Swal.fire("Thành công", "Đã tạo tài khoản mới!", "success");
        fetchUsers();
      } catch (err) {
        Swal.fire(
          "Lỗi",
          err.response?.data?.message || "Không thể tạo",
          "error",
        );
      }
    }
  };
  const handleEditUser = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: '<i class="fa-solid fa-pen-to-square"></i> Chỉnh Sửa Thành Viên',
      html:
        `<label class="swal-edit-label">Họ tên</label>` +
        `<input id="swal-edit-name" class="swal2-input swal-edit-input" value="${user.fullname || ""}">` +
        `<label class="swal-edit-label">Số điện thoại</label>` +
        `<input id="swal-edit-phone" class="swal2-input swal-edit-input" value="${user.phone || ""}">` +
        `<label class="swal-edit-label">Địa chỉ</label>` +
        `<input id="swal-edit-address" class="swal2-input swal-edit-input" value="${user.address || ""}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#3498db",
      confirmButtonText: "Lưu thay đổi",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        return {
          fullname: document.getElementById("swal-edit-name").value,
          phone: document.getElementById("swal-edit-phone").value,
          address: document.getElementById("swal-edit-address").value,
        };
      },
    });
    if (formValues) {
      try {
        await axiosClient.put(`/auth/users/${user._id}`, formValues);
        Swal.fire("Đã lưu", "Thông tin đã được cập nhật!", "success");
        fetchUsers();
      } catch (err) {
        Swal.fire("Lỗi", "Không thể cập nhật", "error");
      }
    }
  };
  const handleChangeRole = async (id, newRole) => {
    try {
      await axiosClient.put(`/auth/users/${id}`, { role: newRole });
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        icon: "success",
        title: `Đã cập nhật quyền: ${newRole}`,
      });
      fetchUsers();
    } catch (err) {
      Swal.fire("Lỗi", "Cập nhật quyền thất bại", "error");
    }
  };
  const handleToggleLock = async (user) => {
    if (user.role === "Admin")
      return Swal.fire("Lỗi", "Không thể khóa tài khoản Admin!", "error");
    const action = user.isLocked ? "Mở khóa" : "Khóa";
    const result = await Swal.fire({
      title: `Xác nhận ${action}?`,
      text: `Bạn có chắc chắn muốn ${action} người dùng này?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: user.isLocked ? "#2ecc71" : "#e74c3c",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await axiosClient.patch(`/auth/users/lock/${user._id}`);
        Swal.fire(
          "Thành công",
          `Đã ${action} tài khoản thành công!`,
          "success",
        );
        fetchUsers();
      } catch (err) {
        Swal.fire("Lỗi", "Thao tác thất bại", "error");
      }
    }
  };
  const handleDeleteUser = async (user) => {
    if (user.role === "Admin") {
      return Swal.fire("Lỗi", "Không được phép xóa Admin!", "error");
    }
    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: `Tài khoản ${user.fullname} sẽ bị xóa vĩnh viễn!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, xóa nó!",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await axiosClient.delete(`/auth/users/${user._id}`);
        Swal.fire("Đã xóa!", "Tài khoản đã bay màu khỏi hệ thống.", "success");
        fetchUsers();
      } catch (err) {
        Swal.fire("Lỗi", "Không thể xóa tài khoản này", "error");
      }
    }
  };
  const handleEditCommission = async (partner) => {
    const { value: rate } = await Swal.fire({
      title: "Cài đặt Hoa hồng Sàn",
      html: `
                <p class="swal-commission-text">Đang thiết lập cho đối tác: <strong>${partner.fullname}</strong></p>
                <div class="swal-commission-group">
                    <label>Tỷ lệ thu (%):</label>
                    <input type="number" id="swal-commission" class="swal2-input swal-commission-input" value="${partner.commissionRate ?? 10}" min="0" max="100">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Lưu cấu hình",
      confirmButtonColor: "#2d4271",
      preConfirm: () => {
        const val = document.getElementById("swal-commission").value;
        if (val < 0 || val > 100 || val === "") {
          Swal.showValidationMessage(
            "Tỷ lệ phải nằm trong khoảng từ 0 đến 100!",
          );
          return false;
        }
        return val;
      },
    });
    if (rate !== undefined) {
      try {
        await axiosClient.put(`/auth/users/${partner._id}/commission`, {
          commissionRate: Number(rate),
        });
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Đã cập nhật chiết khấu thành ${rate}%`,
          showConfirmButton: false,
          timer: 2000,
        });
        fetchUsers();
      } catch (error) {
        Swal.fire("Lỗi", "Không thể cập nhật chiết khấu", "error");
      }
    }
  };
  if (loading) return <p className="admin-loading-text">Đang tải dữ liệu...</p>;
  return (
    <div className="admin-page fade-in">
      <div className="user-management-header">
        <h2 className="admin-title user-management-title">
          <i className="fa-solid fa-users"></i> Quản Lý Thành Viên
        </h2>
        <button onClick={handleCreateUser} className="btn-add-user">
          <span>
            <i className="fa-solid fa-plus"></i>
          </span>{" "}
          Thêm Thành Viên Mới
        </button>
      </div>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Họ Tên</th>
              <th>Email & Liên hệ</th>
              <th>Quyền hạn (Role)</th>
              <th style={{ textAlign: "center" }}>Sàn Thu (%)</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "30px" }}
                >
                  Chưa có người dùng nào!
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u._id}
                  className={`user-row ${u.isLocked ? "locked" : ""}`}
                >
                  <td>
                    <div className="user-profile-cell">
                      <img
                        src={
                          u.avatar && !u.avatar.includes("default")
                            ? `${IMAGE_URL}${u.avatar}`
                            : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                        }
                        alt="avt"
                        className="user-avatar-img"
                      />
                      {u.fullname || (
                        <span className="user-fullname-empty">
                          Chưa cập nhật
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-contact-email">
                      <i className="fa-solid fa-envelope"></i> {u.email}
                    </div>
                    <div className="user-contact-phone">
                      <i className="fa-solid fa-phone"></i> {u.phone || "N/A"}
                    </div>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u._id, e.target.value)}
                      disabled={u.role === "Admin"}
                      className={`role-select ${u.role === "Admin" ? "role-admin" : u.role === "Partner" ? "role-partner" : "role-customer"}`}
                    >
                      <option value="Customer">Khách hàng</option>
                      <option value="Partner">Đối tác (Partner)</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="commission-cell">
                    {u.role === "Partner" ? (
                      <div className="commission-wrapper">
                        <strong className="commission-rate">
                          {u.commissionRate ?? 10}%
                        </strong>
                        <button
                          onClick={() => handleEditCommission(u)}
                          className="btn-edit-commission"
                          title="Chỉnh sửa chiết khấu"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      </div>
                    ) : (
                      <span className="commission-empty">-</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${u.isLocked ? "locked" : "active"}`}
                    >
                      {u.isLocked ? (
                        <>
                          <i className="fa-solid fa-ban"></i> Bị khóa
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-circle-check"></i> Hoạt động
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="btn-user-action btn-edit-user"
                        title="Sửa thông tin"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleToggleLock(u)}
                        className={`btn-user-action ${u.isLocked ? "btn-unlock-user" : "btn-lock-user"}`}
                        title={
                          u.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"
                        }
                        disabled={u.role === "Admin"}
                      >
                        {u.isLocked ? (
                          <i className="fa-solid fa-lock-open"></i>
                        ) : (
                          <i className="fa-solid fa-lock"></i>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="btn-user-action btn-delete-user"
                        title="Xóa vĩnh viễn"
                        disabled={u.role === "Admin"}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
