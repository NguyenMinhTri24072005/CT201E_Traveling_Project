import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  FiDollarSign,
  FiMap,
  FiTrendingUp,
  FiFilter,
  FiShoppingBag,
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
export default function PartnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netIncome: 0,
    totalBookings: 0,
    totalTours: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);
  const [myTours, setMyTours] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    tourId: "All",
  });
  useEffect(() => {
    const fetchMyTours = async () => {
      if (user) {
        try {
          const res = await axiosClient.get(`/users/shop/${user._id}`);
          setMyTours(res.data.tours);
        } catch (error) {
          console.error("Lỗi lấy danh sách tour:", error);
        }
      }
    };
    fetchMyTours();
  }, [user]);
  const fetchPartnerStats = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.startDate) query.append("startDate", filters.startDate);
      if (filters.endDate) query.append("endDate", filters.endDate);
      if (filters.tourId !== "All") query.append("tourId", filters.tourId);
      const res = await axiosClient.get(
        `/bookings/partner/stats?${query.toString()}`,
      );
      setStats(res.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Partner:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPartnerStats();
  }, []);
  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchPartnerStats();
  };
  return (
    <div className="dashboard-page fade-in">
      <h2 className="dashboard-title">
        <i className="fa-solid fa-chart-line"></i> Bảng Điều Khiển Nhà Cung Cấp
      </h2>
      <form
        onSubmit={handleApplyFilter}
        className="dashboard-filter-bar filter-bar-partner"
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
          <label>Xem theo Tour:</label>
          <select
            className="dashboard-filter-input"
            value={filters.tourId}
            onChange={(e) => setFilters({ ...filters, tourId: e.target.value })}
          >
            <option value="All">Tất cả các Tour</option>
            {myTours.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-apply-filter btn-filter-partner">
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
                <h3>Tổng Doanh Thu Bán Vé</h3>
                <p>{stats.totalRevenue?.toLocaleString("vi-VN")}₫</p>
              </div>
            </div>
            <div className="card-net">
              <div className="stat-card">
                <div className="stat-icon">
                  <FiTrendingUp />
                </div>
                <div className="stat-info">
                  <h3>Thực Nhận (Sau chiết khấu)</h3>
                  <p>{stats.netIncome?.toLocaleString("vi-VN")}₫</p>
                </div>
              </div>
            </div>
            <div className="stat-card card-orders">
              <div className="stat-icon">
                <FiShoppingBag />
              </div>
              <div className="stat-info">
                <h3>Số Đơn Hàng Thành Công</h3>
                <p>{stats.totalBookings} Đơn</p>
              </div>
            </div>
            <div className="stat-card card-tours">
              <div className="stat-icon">
                <FiMap />
              </div>
              <div className="stat-info">
                <h3>Tổng Số Tour Đã Đăng</h3>
                <p>{stats.totalTours} Tour</p>
              </div>
            </div>
          </div>
          <div className="chart-section-wrapper">
            <h3 className="chart-section-title">
              <i className="fa-solid fa-chart-column"></i> Phân Tích Doanh Thu
              Theo Ngày
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
                      cursor={{ fill: "rgba(46, 204, 113, 0.05)" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Tổng Doanh Thu"
                      fill="#bdc3c7"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="netIncome"
                      name="Thực Nhận (Bỏ túi)"
                      fill="#2ecc71"
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
