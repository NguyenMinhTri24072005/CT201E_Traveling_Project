import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import {
  FiDollarSign,
  FiUsers,
  FiMap,
  FiTrendingUp,
  FiFilter,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./Dashboard.css";
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalSystemRevenue: 0,
    totalAdminProfit: 0,
    totalUsers: 0,
    totalTours: 0,
    successfulBookings: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    partnerId: "All",
  });
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await axiosClient.get("/auth/users");
        const partnerList = res.data.filter((u) => u.role === "Partner");
        setPartners(partnerList);
      } catch (error) {
        console.error("Lỗi lấy danh sách đối tác:", error);
      }
    };
    fetchPartners();
  }, []);
  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.startDate) query.append("startDate", filters.startDate);
      if (filters.endDate) query.append("endDate", filters.endDate);
      if (filters.partnerId !== "All")
        query.append("partnerId", filters.partnerId);
      const res = await axiosClient.get(
        `/bookings/admin/stats?${query.toString()}`,
      );
      setStats(res.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Admin:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAdminStats();
  }, []);
  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchAdminStats();
  };
  return (
    <div className="dashboard-page fade-in">
      <h2 className="dashboard-title">
        <i className="fa-solid fa-crown"></i> Bảng Điều Khiển Quản Trị Sàn
      </h2>
      <form
        onSubmit={handleApplyFilter}
        className="dashboard-filter-bar filter-bar-admin"
      >
        <div className="dashboard-filter-group">
          <label>Từ ngày:</label>
          <input
            type="date"
            className="dashboard-filter-input"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
        </div>
        <div className="dashboard-filter-group">
          <label>Đến ngày:</label>
          <input
            type="date"
            className="dashboard-filter-input"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div>
        <div className="dashboard-filter-group large">
          <label>Đối tác (Partner):</label>
          <select
            className="dashboard-filter-input"
            value={filters.partnerId}
            onChange={(e) =>
              setFilters({ ...filters, partnerId: e.target.value })
            }
          >
            <option value="All">Tất cả đối tác</option>
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.shopName || p.fullname}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-apply-filter btn-filter-admin">
          <FiFilter /> Áp dụng
        </button>
      </form>
      {loading ? (
        <h3 className="dashboard-loading">
          <i className="fa-solid fa-spinner fa-spin"></i> Đang tính toán dữ
          liệu...
        </h3>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card card-revenue">
              <div className="stat-icon">
                <FiDollarSign />
              </div>
              <div className="stat-info">
                <h3>Tổng Giao Dịch Sàn</h3>
                <p>{stats.totalSystemRevenue?.toLocaleString("vi-VN")}₫</p>
              </div>
            </div>
            <div className="card-admin-profit">
              <div className="stat-card">
                <div className="stat-icon">
                  <FiTrendingUp />
                </div>
                <div className="stat-info">
                  <h3>Lợi Nhuận Sàn (Hoa hồng)</h3>
                  <p>{stats.totalAdminProfit?.toLocaleString("vi-VN")}₫</p>
                </div>
              </div>
            </div>
            <div className="stat-card card-orders">
              <div className="stat-icon">
                <FiUsers />
              </div>
              <div className="stat-info">
                <h3>Tổng Thành Viên</h3>
                <p>{stats.totalUsers} User</p>
              </div>
            </div>
            <div className="stat-card card-tours">
              <div className="stat-icon">
                <FiMap />
              </div>
              <div className="stat-info">
                <h3>Tổng Tour Hệ Thống</h3>
                <p>{stats.totalTours} Tour</p>
              </div>
            </div>
          </div>
          <div className="chart-section-wrapper">
            <h3 className="chart-section-title">
              <i className="fa-solid fa-chart-column"></i> Biểu Đồ Biến Động
              Dòng Tiền & Lợi Nhuận
            </h3>
            {stats.chartData.length === 0 ? (
              <p className="chart-empty">
                Không có dữ liệu giao dịch trong khoảng thời gian này.
              </p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={stats.chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eee"
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `${value >= 1000000 ? value / 1000000 + "M" : value}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => `${value.toLocaleString()} ₫`}
                      cursor={{ fill: "rgba(52, 73, 94, 0.05)" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Tổng Giao Dịch"
                      fill="#bdc3c7"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="profit"
                      name="Lợi Nhuận Sàn"
                      fill="#e31837"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
