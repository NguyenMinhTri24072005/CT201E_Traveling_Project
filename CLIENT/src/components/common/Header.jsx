import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { IMAGE_URL } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../api/axiosClient';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotif, setShowNotif] = useState(false);
    const notifRef = useRef(null);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await axiosClient.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error("Lỗi lấy thông báo:", error);
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotif(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notifRef]);

    const handleReadNotification = async (notif) => {
        try {
            if (!notif.isRead) {
                await axiosClient.put(`/notifications/${notif._id}/read`);
                fetchNotifications();
            }
            setShowNotif(false);
            if (notif.link) {
                navigate(notif.link);
            }
        } catch (error) {
            console.error("Lỗi đọc thông báo:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axiosClient.put('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error("Lỗi đánh dấu tất cả:", error);
        }
    };

    return (
        <header className="customer-header">
            {/* 1. LOGO */}
            <Link to="/" className="header-logo">
                Tây Bắc <span>Travel</span>
            </Link>

            {/* 2. MENU ĐIỀU HƯỚNG */}
            <nav className="header-nav">
                <Link to="/">Trang Chủ</Link>
                <Link to="/tours">Khám Phá</Link>
                <Link to="/about">Giới Thiệu</Link>
                <Link to="/contact">Liên Hệ</Link>
            </nav>

            {/* 3. KHU VỰC TÀI KHOẢN & THÔNG BÁO */}
            <div className="header-actions">
                {user ? (
                    <>
                        {/* NÚT CHAT */}
                        <button className="icon-btn" onClick={() => navigate('/chat')} title="Mở hộp thư">
                            💬
                        </button>

                        {/* QUẢ CHUÔNG THÔNG BÁO */}
                        <div ref={notifRef} className="notif-wrapper">
                            <button className="icon-btn notif-btn" onClick={() => setShowNotif(!showNotif)}>
                                🔔
                                {unreadCount > 0 && (
                                    <span className="notif-badge">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* DROPDOWN THÔNG BÁO */}
                            {showNotif && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <h4>Thông báo</h4>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="notif-read-all-btn">
                                                Đánh dấu đọc tất cả
                                            </button>
                                        )}
                                    </div>

                                    <div className="notif-list">
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">
                                                <div className="notif-empty-icon">📭</div>
                                                Bạn chưa có thông báo nào.
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif._id}
                                                    onClick={() => handleReadNotification(notif)}
                                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                                >
                                                    <div className="notif-item-icon">
                                                        {notif.type === 'system' ? '📢' : notif.type === 'booking' ? '🛒' : notif.type === 'tour' ? '🗺️' : '💬'}
                                                    </div>
                                                    <div className="notif-item-content">
                                                        <strong className="notif-item-title">{notif.title}</strong>
                                                        <span className="notif-item-message">{notif.message}</span>
                                                        <span className="notif-item-time">
                                                            {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    {!notif.isRead && <div className="notif-dot"></div>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TÀI KHOẢN DROP-DOWN */}
                        <div className="user-dropdown">
                            <div className="user-greeting">
                                {user.avatar && !user.avatar.includes('default') ? (
                                    <img src={`${IMAGE_URL}${user.avatar}`} alt="avatar" className="user-avatar" />
                                ) : (
                                    <span className="user-avatar-placeholder">👤</span>
                                )}
                                <span className="user-name">{user.fullname}</span>
                                <span className="user-chevron">▼</span>
                            </div>

                            <div className="dropdown-content">
                                {(user.role === 'Partner' || user.role === 'Admin') && (
                                    <Link to="/admin" className="admin-link">⚙️ Kênh Quản Lý</Link>
                                )}
                                <Link to="/profile">👤 Hồ sơ cá nhân</Link>
                                <Link to="/history">🕒 Lịch sử đặt Tour</Link>
                                <button onClick={handleLogout} className="logout-btn">🚪 Đăng xuất</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="login-btn">Đăng nhập</Link>
                        <Link to="/register" className="register-btn">Đăng ký</Link>
                    </>
                )}
            </div>
        </header>
    );
}