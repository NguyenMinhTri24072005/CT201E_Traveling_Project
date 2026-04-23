import React from 'react';
import SuperAdminDashboard from './SuperAdminDashboard';
import PartnerDashboard from './PartnerDashboard';
import './Dashboard.css'

export default function Dashboard() {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!user) {
        return <h2 className="dashboard-alert">Vui lòng đăng nhập!</h2>;
    }

    if (user.role === 'Admin') {
        return <SuperAdminDashboard />;
    } 
    
    if (user.role === 'Partner') {
        return <PartnerDashboard />;
    } 
    
    return <h2 className="dashboard-alert">Bạn không có quyền truy cập trang này.</h2>;
}