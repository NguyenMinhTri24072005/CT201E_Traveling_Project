import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Swal from 'sweetalert2';
import BookingTable from '../../components/admin/BookingTable';
import './AdminStyles.css';
import './AdminBookingManagement.css'; // 👉 Tái sử dụng CSS của Admin

export default function PartnerBookingManagement() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/bookings/partner');
            setBookings(res.data);
            setFilteredBookings(res.data);
            setLoading(false);
        } catch (error) { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        let result = bookings;
        if (statusFilter !== 'ALL') result = result.filter(b => b.status?.toLowerCase() === statusFilter.toLowerCase());
        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(b => b._id.toLowerCase().includes(lowerSearch) || (b.customer?.fullname || '').toLowerCase().includes(lowerSearch) || (b.customer?.phone || '').includes(lowerSearch) || (b.tour?.name || '').toLowerCase().includes(lowerSearch));
        }
        if (fromDate) result = result.filter(b => new Date(b.createdAt) >= new Date(fromDate));
        if (toDate) {
            const end = new Date(toDate); end.setHours(23, 59, 59, 999);
            result = result.filter(b => new Date(b.createdAt) <= end);
        }
        setFilteredBookings(result);
    }, [statusFilter, searchTerm, fromDate, toDate, bookings]);

    const handleExportCSV = () => {
        if (filteredBookings.length === 0) return Swal.fire('Thông báo', 'Không có dữ liệu!', 'info');
        const headers = ['Mã Đơn', 'Ngày Đặt', 'Tên Tour', 'Khách Hàng', 'SĐT', 'Tổng Tiền (VNĐ)', 'Trạng Thái'];
        const csvData = filteredBookings.map(b => [b._id, new Date(b.createdAt).toLocaleDateString('vi-VN'), `"${b.tour?.name || 'Tour đã xóa'}"`, `"${b.customer?.fullname || b.representative?.fullName || ''}"`, `"${b.customer?.phone || b.representative?.phone || ''}"`, b.totalPrice || b.totalprice || 0, b.status?.toUpperCase()]);
        const csvContent = "\uFEFF" + [headers, ...csvData].map(e => e.join(',')).join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        link.setAttribute('download', `Doanh_Thu_Partner_${new Date().getTime()}.csv`);
        document.body.appendChild(link); 
        link.click(); 
        document.body.removeChild(link);
    };

    // Dùng class thay cho style inline
    if (loading) return <h2 className="admin-loading-text">Đang tải...</h2>;

    return (
        <div className="admin-page fade-in">
            <div className="admin-header-container">
                <h2 className="admin-title">🛍️ Đơn Đặt Tour Của Tôi</h2>
                <button onClick={handleExportCSV} className="export-btn">📥 Xuất File</button>
            </div>

            <div className="filter-container">
                <div className="filter-item search">
                    <label className="filter-label">🔍 Tìm kiếm:</label>
                    <input type="text" className="filter-input" placeholder="Mã đơn, tên, SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-item">
                    <label className="filter-label">📅 Từ ngày:</label>
                    <input type="date" className="filter-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="filter-item">
                    <label className="filter-label">📅 Đến ngày:</label>
                    <input type="date" className="filter-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div className="filter-item">
                    <label className="filter-label">Trạng thái:</label>
                    <select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">Tất cả</option>
                        <option value="pending_payment">⏳ Chờ thanh toán</option>
                        <option value="payment_verifying">🔎 Đang xác minh</option>
                        <option value="paid">✅ Đã thanh toán</option>
                        <option value="completed">🏁 Hoàn thành</option>
                        <option value="cancelled">❌ Đã Hủy</option>
                    </select>
                </div>
            </div>

            <BookingTable bookings={filteredBookings} onRefresh={fetchBookings} />
        </div>
    );
}