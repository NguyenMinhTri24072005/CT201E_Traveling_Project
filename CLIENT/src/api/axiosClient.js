// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm Interceptor để TỰ ĐỘNG đính kèm Token vào Header
axiosClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        // Chuẩn token của Backend Node.js thường là Bearer [token]
        config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
});

export default axiosClient;