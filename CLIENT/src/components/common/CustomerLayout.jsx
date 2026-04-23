import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function CustomerLayout() {
    return (
        <>
            <div className="customer-layout">
                <Header></Header>

                <main style={{ minHeight: '80vh' }}>
                    {/* Nơi nội dung các trang (Home, Detail...) sẽ hiển thị */}
                    <Outlet/>
                </main>

                <footer style={{ background: '#2d4271', color: 'white', padding: '40px 5%', textAlign: 'center' }}>
                    <p>© 2026 TÂY BẮC TRAVEL - Đồ án Niên luận</p>
                </footer>
            </div>
        </>
    )
}
