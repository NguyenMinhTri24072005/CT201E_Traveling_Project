import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";
import TourCard from "../../components/common/TourCard.jsx";
import { IMAGE_URL } from "../../utils/constants.js";
import "./TourDetail.css";
export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendedTours, setRecommendedTours] = useState([]);
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [mainImg, setMainImg] = useState("");
  useEffect(() => {
    const fetchTourAndReviews = async () => {
      try {
        const [tourResponse, reviewResponse] = await Promise.all([
          axiosClient.get(`/tours/${id}`),
          axiosClient.get(`/reviews/tour/${id}`),
        ]);
        setTour(tourResponse.data);
        setReviews(reviewResponse.data);
        const recRes = await axiosClient.get(`/tours/${id}/recommendations`);
        setRecommendedTours(recRes.data);
        if (
          tourResponse.data.departures &&
          tourResponse.data.departures.length > 0
        ) {
          setSelectedDeparture(tourResponse.data.departures[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy chi tiết tour:", error);
        setLoading(false);
      }
    };
    fetchTourAndReviews();
  }, [id]);
  const handleDepartureChange = (e) => {
    const depId = e.target.value;
    const selected = tour.departures.find((d) => d._id === depId);
    setSelectedDeparture(selected);
  };
  const handleBookNow = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để đặt tour!");
      navigate("/login");
      return;
    }
    if (!selectedDeparture) {
      alert("Vui lòng chọn ngày khởi hành trước khi đặt!");
      return;
    }
    navigate("/checkout", {
      state: { tour: tour, selectedDate: selectedDeparture },
    });
  };
  if (loading)
    return (
      <h2 className="tour-loading-msg">
        <i className="fa-solid fa-spinner fa-spin"></i> Đang tải thông tin
        tour...
      </h2>
    );
  if (!tour)
    return (
      <h2 className="tour-error-msg">
        <i className="fa-solid fa-circle-xmark"></i> Không tìm thấy Tour!
      </h2>
    );
  const galleryImages =
    Array.isArray(tour.images) && tour.images.length > 0
      ? tour.images
      : tour.image
        ? [tour.image]
        : [];
  const displayImg = mainImg || galleryImages[0];
  return (
    <div className="tour-detail-page fade-in">
      <div className="tour-hero-section">
        <div className="tour-gallery-col">
          <div className="main-image-container">
            <img
              src={
                displayImg ? `${IMAGE_URL}${displayImg}` : "/placeholder.jpg"
              }
              alt={tour.name}
              className="tour-main-img"
            />
          </div>
          <div className="thumbnail-list">
            {galleryImages.length > 0 ? (
              galleryImages.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail-item ${displayImg === img ? "active" : ""}`}
                  onClick={() => setMainImg(img)}
                >
                  <img src={`${IMAGE_URL}${img}`} alt={`Thumbnail ${index}`} />
                </div>
              ))
            ) : (
              <div className="thumbnail-item empty">
                <img src="/placeholder.jpg" alt="No images" />
              </div>
            )}
          </div>
        </div>
        <div className="tour-booking-col">
          <h1 className="tour-title">{tour.name}</h1>
          <div className="tour-rating-box">
            <span className="tour-star-icon">★</span>
            <span className="tour-rating-score">
              {tour.averageRating > 0 ? tour.averageRating.toFixed(1) : "Mới"}
            </span>
            {tour.totalReviews > 0 && (
              <span className="tour-rating-count">
                ({tour.totalReviews} đánh giá)
              </span>
            )}
          </div>
          <div className="tour-meta-info">
            <span>
              <i className="fa-solid fa-clock"></i> {tour.duration}
            </span>
            <span>
              <i className="fa-solid fa-location-dot"></i> KH:{" "}
              {tour.departureLocation}
            </span>
            <span>
              <i className="fa-solid fa-tag"></i> Mã: {tour.code}
            </span>
          </div>
          <hr className="tour-divider" />
          <h3 className="booking-section-title">
            <i className="fa-solid fa-calendar-days"></i> Chọn ngày khởi hành:
          </h3>
          {tour.departures && tour.departures.length > 0 ? (
            <div>
              <select
                value={selectedDeparture?._id || ""}
                onChange={handleDepartureChange}
                className="departure-select"
              >
                {tour.departures.map((dep) => (
                  <option
                    key={dep._id}
                    value={dep._id}
                    disabled={dep.availableslots <= 0}
                  >
                    {dep.date} (Về: {dep.returnDate}) -{" "}
                    {dep.availableslots <= 0
                      ? "HẾT CHỖ"
                      : `Còn ${dep.availableslots} chỗ`}
                  </option>
                ))}
              </select>
              {selectedDeparture && (
                <div className="departure-details-box">
                  <p className="departure-transport">
                    <i className="fa-solid fa-car"></i> Phương tiện:{" "}
                    <strong>{selectedDeparture.transport}</strong>
                  </p>
                  <div className="price-row main-price">
                    <span>Giá Người lớn:</span>
                    <strong className="price-highlight">
                      {selectedDeparture.adultPrice?.toLocaleString("vi-VN")}₫
                    </strong>
                  </div>
                  <div className="price-sub-row">
                    <span>Trẻ em (5-11t):</span>
                    <span>
                      {selectedDeparture.childPrice?.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <div className="price-sub-row">
                    <span>Em bé ({"<"}5t):</span>
                    <span>
                      {selectedDeparture.babyPrice?.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p
              style={{
                color: "red",
                fontStyle: "italic",
                marginBottom: "20px",
              }}
            >
              Tour hiện chưa có lịch khởi hành.
            </p>
          )}
          <button
            onClick={handleBookNow}
            disabled={
              !selectedDeparture || selectedDeparture.availableslots <= 0
            }
            className={`btn-book-now ${!selectedDeparture || selectedDeparture.availableslots <= 0 ? "disabled" : "active"}`}
          >
            {!selectedDeparture || selectedDeparture.availableslots <= 0
              ? "HẾT CHỖ"
              : "ĐẶT TOUR NGAY"}
          </button>
          <div className="provider-info-box">
            <p className="provider-label">Đơn vị tổ chức:</p>
            <div className="provider-content">
              <div className="provider-icon">
                <i className="fa-solid fa-shop"></i>
              </div>
              <div>
                <h4 className="provider-name">Truy cập để xem hồ sơ</h4>
                <button
                  onClick={() =>
                    navigate(
                      `/shop/${typeof tour.createdBy === "object" ? tour.createdBy._id : tour.createdBy}`,
                    )
                  }
                  className="btn-view-shop"
                >
                  Xem Gian Hàng &gt;&gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tour-content-section">
        <div className="tour-content-left">
          <div className="content-block">
            <h2 className="content-title">
              <i className="fa-solid fa-star"></i> Điểm nhấn hành trình
            </h2>
            <ul className="highlights-list">
              {tour.highlights &&
                tour.highlights.map((hl, index) => <li key={index}>{hl}</li>)}
            </ul>
          </div>
          <div className="content-block">
            <h2 className="content-title">
              <i className="fa-solid fa-map-location-dot"></i> Lịch trình chi
              tiết
            </h2>
            {tour.itinerary &&
              tour.itinerary.map((day, index) => (
                <div key={index} className="itinerary-day-box-v2">
                  <div className="itinerary-left">
                    <h3 className="itinerary-day-title">{day.day}</h3>
                    {day.meals && (
                      <p className="itinerary-meals">
                        <i className="fa-solid fa-utensils"></i> Bữa ăn:{" "}
                        {day.meals}
                      </p>
                    )}
                    <p className="itinerary-desc">{day.content}</p>
                  </div>
                  {}
                  {day.image && (
                    <div className="itinerary-right-img">
                      <img src={`${IMAGE_URL}${day.image}`} alt={day.day} />
                    </div>
                  )}
                </div>
              ))}
          </div>
          <div className="reviews-section">
            <h2 className="reviews-title">
              <i className="fa-regular fa-comments"></i> Đánh giá từ Khách hàng
              ({tour.totalReviews || 0})
            </h2>
            {reviews.length === 0 ? (
              <div className="reviews-empty">
                <span className="reviews-empty-icon">
                  <i className="fa-solid fa-umbrella-beach"></i>
                </span>
                <strong>Chưa có đánh giá nào.</strong> <br /> Hãy là những người
                đầu tiên trải nghiệm và chia sẻ cảm nhận về chuyến đi này nhé!
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-avatar-box">
                      <img
                        src={
                          review.user?.avatar &&
                          !review.user.avatar.includes("default")
                            ? `${IMAGE_URL}${review.user.avatar}`
                            : "https://via.placeholder.com/60"
                        }
                        alt="avatar"
                        className="review-avatar"
                      />
                    </div>
                    <div className="review-content">
                      <div className="review-header">
                        <strong className="reviewer-name">
                          {review.user?.fullname || "Khách hàng"}
                        </strong>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <div className="review-stars">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </div>
                      <p className="review-text">"{review.comment}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {recommendedTours.length > 0 && (
            <div className="recommendation-section">
              <h2 className="recommendation-title">
                <i className="fa-solid fa-star"></i> Bạn Có Thể Quan Tâm
              </h2>
              <p className="recommendation-desc">
                Dựa trên sự quan tâm của bạn, Tây Bắc Travel gợi ý những hành
                trình tuyệt vời sau:
              </p>
              <div className="recommendation-grid">
                {recommendedTours.map((recTour) => (
                  <TourCard key={recTour._id} tour={recTour} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
