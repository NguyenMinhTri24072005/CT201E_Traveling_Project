import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import './AdminStyles.css';
import './AdminProfile.css';

export default function AdminProfile() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [formData, setFormData] = useState({
        fullname: user?.fullname || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosClient.put('/auth/profile', formData);
            alert("✅ Cập nhật hồ sơ thành công!");
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <h2 className="admin-title">👤 Hồ Sơ Cá Nhân</h2>
            <form onSubmit={handleSubmit} className="table-container admin-profile-form">
                
                <div className="profile-form-group">
                    <label>Email (Không thể sửa):</label>
                    <input 
                        type="text" 
                        value={user?.email || ''} 
                        disabled 
                        className="profile-input" 
                    />
                </div>
                
                <div className="profile-form-group">
                    <label>Họ và Tên:</label>
                    <input 
                        type="text" 
                        name="fullname" 
                        value={formData.fullname} 
                        onChange={handleChange} 
                        required 
                        className="profile-input" 
                    />
                </div>
                
                <div className="profile-form-group">
                    <label>Số điện thoại:</label>
                    <input 
                        type="text" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="profile-input" 
                    />
                </div>
                
                <div className="profile-form-group">
                    <label>Địa chỉ:</label>
                    <textarea 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        className="profile-input profile-textarea" 
                    />
                </div>
                
                <button type="submit" disabled={loading} className="btn-save-profile">
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                
            </form>
        </div>
    );
}