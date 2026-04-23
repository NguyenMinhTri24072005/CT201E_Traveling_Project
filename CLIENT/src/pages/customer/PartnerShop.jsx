import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import TourCard from '../../components/common/TourCard';
import { IMAGE_URL } from '../../utils/constants';
import './PartnerShop.css'; 

export default function PartnerShop() {
    const { id } = useParams();
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const res = await axiosClient.get(`/users/shop/${id}`);
                setShopData(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi lấy gian hàng:", error);
                setLoading(false);
            }
        };
        fetchShop();
    }, [id]);

    if (loading) return <h2 style={{ textAlign: 'center', marginTop: '100px', color: '#2d4271' }}>Đang tải gian hàng...</h2>;
    if (!shopData || !shopData.partner) return <h2 style={{ textAlign: 'center', marginTop: '100px', color: '#e74c3c' }}>Gian hàng không tồn tại!</h2>;

    const { partner, tours } = shopData;

    return (
        <div className="shopee-shop-wrapper fade-in">
            
            {/* 1. KHU VỰC HEADER (BANNER & INFO) */}
            <div className="shopee-header-container">
                <div 
                    className="shopee-header-card"
                    style={{ backgroundImage: partner.coverImage ? `url(${IMAGE_URL}${partner.coverImage})` : 'url(https://images.unsplash.com/photo-1506744626753-eda8151a7471?auto=format&fit=crop&w=1200&q=80)' }}
                >
                    <div className="shopee-header-overlay"></div>
                    
                    <div className="shopee-header-content">
                        <div className="shopee-header-left">
                            <img 
                                src={partner.avatar && !partner.avatar.includes('default') ? `${IMAGE_URL}${partner.avatar}` : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} 
                                alt="avatar" 
                                className="shopee-avatar"
                            />
                            <div>
                                <h1 className="shopee-shop-name">
                                    {partner.shopName || partner.fullname} 
                                    {partner.isTrusted && <span className="badge-trusted">Uy tín</span>}
                                </h1>
                                <p className="shopee-organizer-name">👤 Tổ chức bởi: {partner.fullname}</p>
                            </div>
                        </div>

                        <div className="shopee-header-right">
                            <div className="shopee-stat-item">
                                <span className="stat-label">🛍️ Sản phẩm Tour:</span>
                                <span className="stat-value highlight">{tours.length}</span>
                            </div>
                            <div className="shopee-stat-item">
                                <span className="stat-label">⭐ Đánh giá:</span>
                                <span className="stat-value">4.9 / 5.0</span>
                            </div>
                            <div className="shopee-stat-item">
                                <span className="stat-label">✉️ Tỷ lệ phản hồi:</span>
                                <span className="stat-value">98%</span>
                            </div>
                            <div className="shopee-stat-item">
                                <span className="stat-label">🤝 Tham gia:</span>
                                <span className="stat-value">Gần đây</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KHU VỰC NỘI DUNG (BODY) */}
            <div className="shopee-body-container">
                
                {/* CỘT TRÁI: GIỚI THIỆU (Rộng cố định 250px) */}
                <div className="shopee-sidebar">
                    <h3 className="shopee-section-title">Về Chúng Tôi</h3>
                    <p className="shopee-description">
                        {partner.shopDescription || "Đơn vị này chưa cập nhật thông tin giới thiệu. Hệ thống Tây Bắc Travel đảm bảo 100% đối tác đã được xác thực an toàn."}
                    </p>

                    {partner.shopPolicies && (
                        <div className="shopee-policies">
                            <h3 className="shopee-section-title" style={{border: 'none', padding: 0, marginBottom: '8px', color: '#d35400', fontSize: '1rem'}}>
                                🛡️ Chính Sách
                            </h3>
                            <p>{partner.shopPolicies}</p>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: DANH SÁCH TOUR (Tự động co giãn) */}
                <div className="shopee-main-content">
                    <div className="shopee-tours-header">
                        TẤT CẢ SẢN PHẨM TOUR
                    </div>
                    
                    {tours.length === 0 ? (
                        <div className="shopee-empty-msg">
                            Gian hàng này hiện chưa có Tour nào mở bán.
                        </div>
                    ) : (
                        <div className="shopee-tours-grid">
                            {tours.map(tour => (
                                <TourCard key={tour._id} tour={tour} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}