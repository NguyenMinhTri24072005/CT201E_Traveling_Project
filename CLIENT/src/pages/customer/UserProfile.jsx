import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css'; // 👉 Tái sử dụng CSS từ Profile chung

export default function UserProfile() {
    const { user, updateUser } = useAuth();
    
    const [formData, setFormData] = useState({
        fullname: user?.fullname || '',
        email: user?.email || '', 
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosClient.put('/auth/profile', {
                fullname: formData.fullname,
                phone: formData.phone,
                address: formData.address
            });
            
            updateUser(res.data.user || res.data);
            setMessage({ type: 'success', text: '✅ Cập nhật thông tin thành công!' });
            
        } catch (error) {
            setMessage({ type: 'error', text: '❌ Lỗi: ' + (error.response?.data || "Không thể cập nhật") });
        }
    };

    const alertStyle = {
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontWeight: '500',
        backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
        color: message.type === 'success' ? '#155724' : '#721c24'
    };

    return (
        <div className="profile-page">
            <div className="profile-container" style={{ maxWidth: '600px', flexDirection: 'column' }}>
                <div className="profile-content" style={{ padding: '40px' }}>
                    <div className="tab-pane fade-in">
                        <h2>Hồ Sơ Của Tôi</h2>
                        <p style={{ color: '#7f8c8d', marginBottom: '20px', marginTop: '-15px' }}>Quản lý thông tin cá nhân để bảo mật tài khoản</p>
                        
                        {message.text && <div style={alertStyle}>{message.text}</div>}

                        <form onSubmit={handleSubmit} className="profile-form" style={{ maxWidth: '100%' }}>
                            <div className="form-group">
                                <label>Email (Tài khoản)</label>
                                <input type="text" value={formData.email} disabled className="disabled-input" />
                            </div>
                            <div className="form-group">
                                <label>Họ và Tên</label>
                                <input 
                                    type="text" 
                                    value={formData.fullname} 
                                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input 
                                    type="text" 
                                    value={formData.phone} 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <textarea 
                                    rows="3"
                                    value={formData.address} 
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    style={{
                                        width: '100%', padding: '12px 15px', border: '1px solid #dcdde1',
                                        borderRadius: '8px', fontSize: '1rem', transition: 'all 0.3s',
                                        fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical'
                                    }}
                                />
                            </div>
                            <button type="submit" className="btn-save" style={{ width: '100%', background: '#e31837' }}>
                                LƯU THAY ĐỔI
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}