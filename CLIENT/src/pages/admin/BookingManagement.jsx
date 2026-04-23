import React from 'react';
import AdminBookingManagement from './AdminBookingManagement';
import PartnerBookingManagement from './PartnerBookingManagement';

export default function BookingManagement() {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!user) {
        return <h2 style={{ padding: '20px' }}>Vui lòng đăng nhập!</h2>;
    }

    if (user.role === 'Admin') {
        return <AdminBookingManagement />;
    } 
    
    if (user.role === 'Partner') {
        return <PartnerBookingManagement />;
    } 
    
    return <h2>Bạn không có quyền truy cập trang này.</h2>;
}