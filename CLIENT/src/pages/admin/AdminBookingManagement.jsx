import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Swal from "sweetalert2";
import BookingTable from "../../components/admin/BookingTable";
import "./AdminStyles.css";
import "./AdminBookingManagement.css";
export default function AdminBookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  useEffect(() => {
    fetchBookings();
    fetchPartners();
  }, []);
  const fetchPartners = async () => {
    try {
      const res = await axiosClient.get("/auth/users");
      setPartners(res.data.filter((u) => u.role === "Partner"));
    } catch (error) {}
  };
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/bookings");
      setBookings(res.data);
      setFilteredBookings(res.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    let result = bookings;
    if (statusFilter !== "ALL")
      result = result.filter(
        (b) => b.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    if (selectedPartner !== "ALL")
      result = result.filter(
        (b) => (b.tour?.partner || b.tour?.createdBy) === selectedPartner,
      );
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b._id.toLowerCase().includes(lowerSearch) ||
          (b.customer?.fullname || "").toLowerCase().includes(lowerSearch) ||
          (b.customer?.phone || "").includes(lowerSearch) ||
          (b.tour?.name || "").toLowerCase().includes(lowerSearch),
      );
    }
    if (fromDate)
      result = result.filter(
        (b) => new Date(b.createdAt) >= new Date(fromDate),
      );
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((b) => new Date(b.createdAt) <= end);
    }
    setFilteredBookings(result);
  }, [statusFilter, selectedPartner, searchTerm, fromDate, toDate, bookings]);
  const handleExportCSV = () => {
    if (filteredBookings.length === 0)
      return Swal.fire("Thông báo", "Không có dữ liệu!", "info");
    const headers = [
      "Mã Đơn",
      "Ngày Đặt",
      "Tên Tour",
      "Khách Hàng",
      "SĐT",
      "Tổng Tiền (VNĐ)",
      "Trạng Thái",
    ];
    const csvData = filteredBookings.map((b) => [
      b._id,
      new Date(b.createdAt).toLocaleDateString("vi-VN"),
      `"${b.tour?.name || "Tour đã xóa"}"`,
      `"${b.customer?.fullname || b.representative?.fullName || ""}"`,
      `"${b.customer?.phone || b.representative?.phone || ""}"`,
      b.totalPrice || b.totalprice || 0,
      b.status?.toUpperCase(),
    ]);
    const csvContent =
      "\uFEFF" + [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
    );
    link.setAttribute("download", `Bao_Cao_Admin_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (loading) return <h2 className="admin-loading-text">Đang tải...</h2>;
  return (
    <div className="admin-page fade-in">
      <div className="admin-header-container">
        <h2 className="admin-title">
          <i className="fa-solid fa-crown"></i> Quản Lý Đơn Toàn Sàn
        </h2>
        <button onClick={handleExportCSV} className="export-btn">
          <i className="fa-solid fa-download"></i> Xuất File
        </button>
      </div>
      <div className="filter-container">
        <div className="filter-item search">
          <label className="filter-label">
            <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm:
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="Mã đơn, tên, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">
            <i className="fa-solid fa-calendar-days"></i> Từ ngày:
          </label>
          <input
            type="date"
            className="filter-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">
            <i className="fa-solid fa-calendar-days"></i> Đến ngày:
          </label>
          <input
            type="date"
            className="filter-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">Trạng thái:</label>
          <select
            className="filter-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="pending_payment">Chờ thanh toán</option>
            <option value="payment_verifying">Đang xác minh</option>
            <option value="paid">Đã thanh toán</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã Hủy</option>
          </select>
        </div>
        <div className="filter-item">
          <label className="filter-label partner-highlight">Đối tác:</label>
          <select
            className="filter-input partner-highlight"
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
          >
            <option value="ALL">Toàn bộ Sàn</option>
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullname}
              </option>
            ))}
          </select>
        </div>
      </div>
      <BookingTable bookings={filteredBookings} onRefresh={fetchBookings} />
    </div>
  );
}
