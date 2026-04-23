import React from 'react';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './TourCard.css';
import { IMAGE_URL } from '../../utils/constants';

export default function TourCard({ tour, layout = 'vertical' }) {
    // Lấy giá người lớn của ngày khởi hành đầu tiên làm giá hiển thị ngoài thẻ
    const displayImg = (tour.images && tour.images.length > 0)
        ? tour.images[0]
        : tour.image;

    const displayPrice = (tour.departures && tour.departures.length > 0 && tour.departures[0].adultPrice)
        ? tour.departures[0].adultPrice
        : 0;

    const BASE_URL = "http://localhost:3000";

    return (
        <Link to={`/tour/${tour._id}`} className={`tour-card ${layout}`}>
            <div className="tour-image-container">
                <img
                    src={`${IMAGE_URL}${displayImg}`}
                    alt={tour.name}
                    className="tour-image" /* 👉 Dùng class này để lấy lại hiệu ứng hover zoom ảnh */
                />
            </div>

            <div className="tour-content">
                <div className="tour-meta">
                    <span><FiClock /> {tour.duration}</span>
                    <span><FiMapPin /> Khởi hành: {tour.departureLocation}</span>
                </div>

                <h3 className="tour-name" title={tour.name}>{tour.name}</h3>

                {/* Khu vực Đánh giá sao đã được tách Class */}
                <div className="tour-rating">
                    <span className="tour-rating-star">★</span>
                    <span className="tour-rating-number">
                        {tour.averageRating > 0 ? tour.averageRating.toFixed(1) : 'Mới'}
                    </span>
                    {tour.totalReviews > 0 && (
                        <span className="tour-rating-count">({tour.totalReviews} đánh giá)</span>
                    )}
                </div>

                <div className="tour-price-box">
                    <div className="price-wrapper">
                        <span className="sale-price">
                            {displayPrice > 0 ? displayPrice.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
                        </span>
                    </div>
                    <button className="btn-book">Đặt ngay</button>
                </div>
            </div>
        </Link>
    );
}