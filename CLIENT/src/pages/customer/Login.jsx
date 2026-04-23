import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './Login.css';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth(); 

    const [formData, setFormData] = useState({
        username: '', 
        password: ''
    });
    const [errorMsg, setErrorMsg] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axiosClient.post('/auth/login', formData);
            const { accessToken, user } = response.data;
            localStorage.setItem('accessToken', accessToken);

            login(user);

            if (user.role === 'Admin' || user.role === 'Partner') {
                navigate('/admin'); 
            } else {
                navigate('/'); 
            }

        } catch (error) {
            if (error.response && error.response.data) {
                setErrorMsg(error.response.data.message || 'Đăng nhập thất bại!');
            } else {
                setErrorMsg('Lỗi kết nối đến máy chủ!');
            }
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Đăng Nhập</h2>

                {errorMsg && (
                    <div className="error-message">
                        {errorMsg}
                    </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email hoặc Số điện thoại</label>
                        <input
                            type="text"
                            name="username"
                            required
                            placeholder="Nhập email hoặc SĐT..."
                            value={formData.username}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="Nhập mật khẩu..."
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                    </div>

                    <button type="submit" className="btn-login">ĐĂNG NHẬP</button>
                </form>

                <div className="login-footer">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
}