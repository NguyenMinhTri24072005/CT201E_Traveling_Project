import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Swal from "sweetalert2";
import "../../pages/admin/AdminStyles.css";
import "./BookingTable.css";

export default function BookingTable({ bookings, onRefresh }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => {
    setCurrentPage(1);
  }, [bookings]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = bookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axiosClient.put(`/bookings/${bookingId}/status`, {
        status: newStatus,
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Đã cập nhật!",
        showConfirmButton: false,
        timer: 1500,
      });
      onRefresh();
    } catch (error) {
      Swal.fire("Lỗi", "Không thể cập nhật trạng thái", "error");
    }
  };
  const handleDeleteBooking = async (bookingId) => {
    const result = await Swal.fire({
      title: "Xóa vĩnh viễn?",
      text: "Đơn hàng này đã bị hủy. Bạn có chắc chắn muốn dọn dẹp?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e31837",
      cancelButtonColor: "#95a5a6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await axiosClient.delete(`/bookings/${bookingId}`);
        Swal.fire("Đã xóa!", "Đơn hàng đã được dọn dẹp.", "success");
        onRefresh();
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa đơn hàng này", "error");
      }
    }
  };
  const handleViewDetails = (booking) => {
    let ticketsHtml = "";
    if (booking.tickets && booking.tickets.length > 0) {
      ticketsHtml = `
                <div class="swal-ticket-container">
                    <div class="swal-section-title"><i class="fa-solid fa-ticket"></i> Chi tiết các loại vé:</div>
                    <ul class="swal-list">
                        ${booking.tickets
          .map(
            (t) => `
                            <li class="swal-list-item">
                                <span>${t.ticketType} <strong class="swal-qty-highlight">(x${t.quantity})</strong></span>
                                <strong>${(t.unitPrice * t.quantity).toLocaleString("vi-VN")}₫</strong>
                            </li>
                        `,
          )
          .join("")}
                    </ul>
                </div>
            `;
    }
    let passengersHtml = "";
    if (booking.passengers && booking.passengers.length > 0) {
      passengersHtml = `
                <div class="swal-passenger-container">
                    <div class="swal-passenger-title"><i class="fa-solid fa-users"></i> Danh sách người đi cùng:</div>
                    <ul class="swal-passenger-list">
                        ${booking.passengers
          .map(
            (p) => `
                            <li class="swal-passenger-item">
                                <i class="fa-solid fa-user"></i> <strong>${p.fullName}</strong> - <span class="swal-passenger-type">${p.passengerType}</span> 
                                <br/> <span class="swal-passenger-subinfo">(CCCD/Năm sinh: ${p.cccd_or_birthyear || "N/A"})</span>
                            </li>
                        `,
          )
          .join("")}
                    </ul>
                </div>
            `;
    }
    const commRate =
      booking.tour?.partner?.commissionRate ||
      booking.tour?.createdBy?.commissionRate ||
      10;
    const gross = booking.totalPrice || booking.totalprice || 0;
    const commAmount =
      booking.adminCommission !== undefined
        ? booking.adminCommission
        : gross * (commRate / 100);
    const net =
      booking.partnerRevenue !== undefined
        ? booking.partnerRevenue
        : gross - commAmount;
    Swal.fire({
      title: `Chi tiết đơn #${booking._id.substring(0, 6).toUpperCase()}`,
      html: `
                <div class="swal-detail-body">
                    <p class="swal-contact-info"><i class="fa-solid fa-clock"></i> <strong>Ngày tạo đơn:</strong> ${new Date(booking.createdAt).toLocaleString("vi-VN")}</p>
                    <hr class="swal-divider" />
                    <p class="swal-contact-name"><strong><i class="fa-solid fa-user"></i> Người đặt:</strong> ${booking.representative?.fullName || booking.customer?.fullname || "Không rõ"}</p>
                    <p class="swal-contact-info"><i class="fa-solid fa-phone"></i> <strong>SĐT liên hệ:</strong> ${booking.representative?.phone || booking.customer?.phone || "N/A"}</p>
                    <p class="swal-contact-info"><i class="fa-solid fa-envelope"></i> <strong>Email:</strong> ${booking.representative?.email || booking.customer?.email || "N/A"}</p>
                    ${ticketsHtml}
                    ${passengersHtml}
                    <div class="swal-finance-container">
                        <div class="swal-finance-row">
                            <span><i class="fa-solid fa-sack-dollar"></i> Doanh thu gộp (Khách trả):</span>
                            <strong>${gross.toLocaleString("vi-VN")}₫</strong>
                        </div>
                        <div class="swal-finance-row swal-finance-discount">
                            <span><i class="fa-solid fa-minus"></i> Chiết khấu Sàn (${commRate}%):</span>
                            <strong>-${commAmount.toLocaleString("vi-VN")}₫</strong>
                        </div>
                        <div class="swal-finance-row swal-finance-net">
                            <span><i class="fa-solid fa-money-bill-wave"></i> Lợi nhuận Partner thực nhận:</span>
                            <span>${net.toLocaleString("vi-VN")}₫</span>
                        </div>
                    </div>
                </div>
            `,
      icon: "info",
      width: "600px",
      confirmButtonColor: "#2d4271",
      confirmButtonText: "Đóng",
    });
  };
  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Tên Tour</th>
              <th>Khách Hàng</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table-cell">
                  Không có dữ liệu!
                </td>
              </tr>
            ) : (
              currentItems.map((b) => (
                <tr key={b._id}>
                  <td className="id-cell">
                    #{b._id.substring(0, 6).toUpperCase()}
                  </td>
                  <td>
                    <span className="tour-name-highlight">
                      {b.tour?.name || "Tour đã xóa"}
                    </span>
                    <br />
                    <span className="tour-date-sub">
                      Đặt: {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </td>
                  <td>
                    <div className="customer-name">
                      {b.customer?.fullname ||
                        b.representative?.fullName ||
                        "Khách vãng lai"}
                    </div>
                    <div className="customer-phone">
                      <i className="fa-solid fa-phone"></i>{" "}
                      {b.customer?.phone || b.representative?.phone || "N/A"}
                    </div>
                  </td>
                  <td className="price-cell">
                    {(b.totalPrice || b.totalprice || 0).toLocaleString(
                      "vi-VN",
                    )}
                    ₫
                  </td>
                  <td>
                    <span
                      className={`status-badge ${b.status?.toLowerCase().includes("cancel") ? "cancelled" : b.status?.toLowerCase().includes("paid") || b.status?.toLowerCase() === "completed" ? "paid" : "pending"}`}
                    >
                      {b.status?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      <select
                        value={b.status}
                        onChange={(e) =>
                          handleStatusChange(b._id, e.target.value)
                        }
                        className="filter-input status-select"
                      >
                        <option value="pending_payment">Chờ thanh toán</option>
                        <option value="payment_verifying">Đang xác minh</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Hủy đơn</option>
                      </select>
                      <button
                        onClick={() => handleViewDetails(b)}
                        className="btn-action btn-view"
                        title="Xem chi tiết đơn hàng"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {b.status?.toLowerCase().includes("cancel") && (
                        <button
                          onClick={() => handleDeleteBooking(b._id)}
                          className="btn-action btn-delete"
                          title="Xóa vĩnh viễn"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ◀ Trước
          </button>
          <span className="page-current">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="page-btn"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Sau ▶
          </button>
        </div>
      )}
    </>
  );
}
