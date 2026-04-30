import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import "./BookingHistory.css";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { IMAGE_URL } from "../../utils/constants";
const BookingStepper = ({ status }) => {
  const currentStatus = status?.toLowerCase();
  if (currentStatus === "cancelled" || currentStatus === "payment_failed") {
    return (
      <div className="booking-stepper cancelled">
        <div className="step-aborted">
          <span className="icon">
            <i className="fa-solid fa-circle-xmark"></i>
          </span>
          <span className="text">
            {currentStatus === "cancelled"
              ? "Đơn hàng đã bị hủy"
              : "Thanh toán thất bại / Quá hạn"}
          </span>
        </div>
      </div>
    );
  }
  const steps = [
    {
      id: "pending_payment",
      label: "1. Chờ thanh toán",
      icon: <i className="fa-solid fa-hourglass-half"></i>,
    },
    {
      id: "payment_verifying",
      label: "2. Đang xác minh",
      icon: <i className="fa-solid fa-magnifying-glass"></i>,
    },
    {
      id: "confirmed",
      label: "3. Đã thanh toán",
      icon: <i className="fa-solid fa-credit-card"></i>,
    },
    {
      id: "completed",
      label: "4. Hoàn thành",
      icon: <i className="fa-solid fa-flag-checkered"></i>,
    },
  ];
  let activeIndex = 0;
  if (currentStatus === "payment_verifying") activeIndex = 1;
  if (currentStatus === "paid" || currentStatus === "confirmed")
    activeIndex = 2;
  if (currentStatus === "completed") activeIndex = 3;
  return (
    <div className="booking-stepper">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step-item ${index <= activeIndex ? "active" : ""} ${index === activeIndex ? "current" : ""}`}
        >
          <div className="step-icon">
            {index < activeIndex ? (
              <i className="fa-solid fa-check"></i>
            ) : (
              step.icon
            )}
          </div>
          <div className="step-label">{step.label}</div>
          {index < steps.length - 1 && <div className="step-line"></div>}
        </div>
      ))}
    </div>
  );
};
export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBookingToPay, setSelectedBookingToPay] = useState(null);
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await axiosClient.get(`/bookings/user/${user._id}`);
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBookings();
  }, []);
  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = await Swal.fire({
      title: "Bạn chắc chắn muốn hủy?",
      text: "Đơn hàng sẽ bị hủy và vé sẽ được trả lại cho hệ thống.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      confirmButtonText: "Đồng ý hủy",
      cancelButtonText: "Đóng",
    });
    if (confirmCancel.isConfirmed) {
      try {
        const response = await axiosClient.put(`/bookings/cancel/${bookingId}`);
        Swal.fire(
          "Thành công",
          response.data.message || "Đã hủy đơn thành công!",
          "success",
        );
        await fetchBookings();
      } catch (error) {
        Swal.fire(
          "Lỗi",
          error.response?.data || "Không thể hủy đơn hàng này!",
          "error",
        );
      }
    }
  };
  const handlePayNow = (booking) => {
    setSelectedBookingToPay(booking);
    setShowQRModal(true);
  };
  const handleConfirmPayment = async () => {
    try {
      await axiosClient.put(
        `/bookings/${selectedBookingToPay._id}/confirm-payment`,
      );
      setShowQRModal(false);
      Swal.fire({
        icon: "success",
        title: "Đã gửi thông báo!",
        text: "Đối tác đang kiểm tra giao dịch và sẽ cập nhật trạng thái Đã thanh toán cho bạn trong ít phút.",
        confirmButtonColor: "#2ecc71",
      });
      fetchBookings();
    } catch (error) {
      Swal.fire("Lỗi", "Không thể gửi xác nhận, vui lòng thử lại!", "error");
    }
  };
  const handleViewDetails = (booking) => {
    const repName =
      booking.representative?.fullName || booking.customer?.fullname || "N/A";
    const repPhone =
      booking.representative?.phone ||
      booking.customer?.phone ||
      "Chưa cập nhật";
    const repCccd = booking.representative?.cccd || "Không có";
    const ticketsHtml =
      booking.tickets
        ?.map(
          (t) =>
            `<li class="swal-ticket-item">
                ${t.ticketType}: ${t.quantity} vé x ${(t.unitPrice || 0).toLocaleString()}đ = 
                <strong class="swal-ticket-price">${(t.quantity * (t.unitPrice || 0)).toLocaleString()}đ</strong>
            </li>`,
        )
        .join("") || "<li>Không có dữ liệu vé</li>";
    const passengersHtml =
      booking.passengers && booking.passengers.length > 0
        ? booking.passengers
            .map(
              (p, index) =>
                `<li class="swal-passenger-item">
                    <strong><i class="fa-solid fa-user"></i> Khách ${index + 2} (${p.passengerType}):</strong> 
                    ${p.fullName || '<i style="color:#95a5a6;">Chưa cập nhật tên</i>'} 
                    ${p.cccd_or_birthyear ? `<br/><span class="swal-passenger-info">↪ Thông tin: ${p.cccd_or_birthyear}</span>` : ""}
                </li>`,
            )
            .join("")
        : '<p style="color: #7f8c8d; font-style: italic; margin: 0;">Không có người đi cùng</p>';
    Swal.fire({
      title: "Chi tiết Đơn hàng",
      width: "600px",
      html: `
                <div class="swal-detail-container">
                    <h4 class="swal-detail-title">1. THÔNG TIN NGƯỜI ĐẠI DIỆN</h4>
                    <p class="swal-detail-text"><strong><i class="fa-solid fa-user-large"></i> Họ tên:</strong> <span class="swal-detail-highlight">${repName}</span></p>
                    <p class="swal-detail-text"><strong><i class="fa-solid fa-phone"></i> SĐT:</strong> ${repPhone} &nbsp; | &nbsp; <strong><i class="fa-solid fa-id-card"></i> CCCD:</strong> ${repCccd}</p>
                    <p class="swal-detail-subtext">
                        (Tài khoản đặt đơn: ${booking.customer?.fullname || "Khách vãng lai"})
                    </p>
                    <h4 class="swal-detail-title">2. DANH SÁCH HÀNH KHÁCH ĐI CÙNG</h4>
                    <ul class="swal-passenger-list">
                        ${passengersHtml}
                    </ul>
                    <h4 class="swal-detail-title">3. CHI TIẾT THANH TOÁN</h4>
                    <ul class="swal-ticket-list">
                        ${ticketsHtml}
                    </ul>
                    <div class="swal-payment-box">
                        <p class="swal-payment-total"><strong><i class="fa-solid fa-sack-dollar"></i> Tổng tiền:</strong> <span class="swal-payment-total-value">${(booking.totalprice || booking.totalPrice || 0).toLocaleString()} đ</span></p>
                        <p class="swal-payment-method"><strong><i class="fa-solid fa-credit-card"></i> Phương thức:</strong> <span class="swal-payment-method-value">Chuyển khoản</span></p>
                    </div>
                    <h4 class="swal-detail-title">4. GHI CHÚ</h4>
                    <p class="swal-note-box">
                        ${booking.note || booking.notes || "Khách không để lại ghi chú."}
                    </p>
                </div>
            `,
      confirmButtonText: "Đóng cửa sổ",
      confirmButtonColor: "#3498db",
    });
  };
  const renderStatus = (status) => {
    const currentStatus = status ? status.toLowerCase() : "";
    switch (currentStatus) {
      case "pending_payment":
        return (
          <span className="status-badge pending">
            <i className="fa-solid fa-hourglass-half"></i> Chờ thanh toán
          </span>
        );
      case "payment_verifying":
        return (
          <span className="status-badge verifying">
            <i className="fa-solid fa-magnifying-glass"></i> Đang xác minh
          </span>
        );
      case "paid":
      case "confirmed":
        return (
          <span className="status-badge paid">
            <i className="fa-solid fa-circle-check"></i> Đã thanh toán
          </span>
        );
      case "completed":
        return (
          <span className="status-badge completed">
            <i className="fa-solid fa-flag-checkered"></i> Hoàn thành
          </span>
        );
      case "payment_failed":
        return (
          <span className="status-badge failed">
            <i className="fa-solid fa-triangle-exclamation"></i> Lỗi / Quá hạn
          </span>
        );
      case "cancelled":
        return (
          <span className="status-badge cancelled">
            <i className="fa-solid fa-circle-xmark"></i> Đã hủy
          </span>
        );
      default:
        return <span className="status-badge default">{status}</span>;
    }
  };
  const handleReviewTour = async (booking) => {
    const { value: formValues } = await Swal.fire({
      title:
        '<i class="fa-solid fa-star" style="color: #f1c40f;"></i> Đánh giá chuyến đi',
      html: `
                <div class="swal-review-group">
                    <label class="swal-review-label">Mức độ hài lòng:</label>
                    <select id="swal-rating" class="swal2-input swal-review-select">
                        <option value="5">5 Sao (Tuyệt vời)</option>
                        <option value="4">4 Sao (Rất tốt)</option>
                        <option value="3">3 Sao (Hài lòng)</option>
                        <option value="2">2 Sao (Kém)</option>
                        <option value="1">1 Sao (Rất tệ)</option>
                    </select>
                    <label class="swal-review-label">Cảm nhận của bạn:</label>
                    <textarea id="swal-comment" class="swal2-textarea swal-review-textarea" placeholder="Chia sẻ trải nghiệm của bạn về hướng dẫn viên, lịch trình, dịch vụ..."></textarea>
                </div>
            `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Gửi Đánh Giá",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#f39c12",
      preConfirm: () => {
        const rating = document.getElementById("swal-rating").value;
        const comment = document.getElementById("swal-comment").value;
        if (!comment.trim()) {
          Swal.showValidationMessage("Vui lòng nhập cảm nhận của bạn!");
          return false;
        }
        return { rating, comment };
      },
    });
    if (formValues) {
      try {
        await axiosClient.post("/reviews", {
          tourId: booking.tour?._id || booking.tour,
          bookingId: booking._id,
          rating: Number(formValues.rating),
          comment: formValues.comment,
        });
        Swal.fire(
          "Cảm ơn bạn!",
          "Đánh giá của bạn đã được ghi nhận. Điểm đánh giá sẽ được cập nhật trên trang chủ.",
          "success",
        );
        fetchBookings();
      } catch (error) {
        Swal.fire(
          "Thông báo",
          error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!",
          "info",
        );
      }
    }
  };
  const handleViewReview = async (bookingId) => {
    try {
      const res = await axiosClient.get(`/reviews/booking/${bookingId}`);
      const review = res.data;
      const { value: action } = await Swal.fire({
        title: "Đánh giá của bạn",
        html: `
                    <div>
                        <div class="swal-review-stars">
                            ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}
                        </div>
                        <div class="swal-review-content">
                            "${review.comment}"
                        </div>
                    </div>
                `,
        showCancelButton: true,
        confirmButtonText: "Chỉnh sửa",
        cancelButtonText: "Đóng",
        confirmButtonColor: "#3498db",
      });
      if (action) {
        const { value: formValues } = await Swal.fire({
          title: "Chỉnh sửa đánh giá",
          html: `
                        <div class="swal-review-group">
                            <label class="swal-review-label">Mức độ hài lòng:</label>
                            <select id="edit-rating" class="swal2-input swal-review-select">
                                <option value="5" ${review.rating === 5 ? "selected" : ""}>5 Sao (Tuyệt vời)</option>
                                <option value="4" ${review.rating === 4 ? "selected" : ""}>4 Sao (Rất tốt)</option>
                                <option value="3" ${review.rating === 3 ? "selected" : ""}>3 Sao (Hài lòng)</option>
                                <option value="2" ${review.rating === 2 ? "selected" : ""}>2 Sao (Kém)</option>
                                <option value="1" ${review.rating === 1 ? "selected" : ""}>1 Sao (Rất tệ)</option>
                            </select>
                            <label class="swal-review-label">Cảm nhận mới:</label>
                            <textarea id="edit-comment" class="swal2-textarea swal-review-textarea">${review.comment}</textarea>
                        </div>
                    `,
          showCancelButton: true,
          confirmButtonText: "Lưu thay đổi",
          confirmButtonColor: "#27ae60",
          preConfirm: () => {
            return {
              rating: document.getElementById("edit-rating").value,
              comment: document.getElementById("edit-comment").value,
            };
          },
        });
        if (formValues) {
          try {
            await axiosClient.put(`/reviews/${review._id}`, formValues);
            Swal.fire(
              "Thành công!",
              "Đã cập nhật đánh giá của bạn.",
              "success",
            );
            fetchBookings();
          } catch (err) {
            Swal.fire("Lỗi", "Không thể cập nhật đánh giá", "error");
          }
        }
      }
    } catch (error) {
      Swal.fire("Lỗi", "Không thể lấy thông tin đánh giá!", "error");
    }
  };
  if (loading)
    return (
      <h2 style={{ textAlign: "center", marginTop: "100px" }}>
        Đang tải dữ liệu...
      </h2>
    );
  return (
    <div className="history-page">
      <h2 className="history-title">Lịch Sử Đặt Tour Của Bạn</h2>
      {bookings.length === 0 ? (
        <div className="booking-empty">
          <p>Bạn chưa đặt chuyến đi nào.</p>
          <Link to="/" className="btn-explore">
            Khám phá các tour ngay
          </Link>
        </div>
      ) : (
        bookings.map((item) => {
          const repName =
            item.representative?.fullName || item.customer?.fullname || "N/A";
          const repPhone =
            item.representative?.phone ||
            item.customer?.phone ||
            "Chưa cập nhật";
          const isBookedForOther =
            item.representative?.fullName &&
            user?.fullname &&
            item.representative.fullName.trim().toLowerCase() !==
              user.fullname.trim().toLowerCase();
          return (
            <div className="booking-card" key={item._id}>
              <BookingStepper status={item.status} />
              <div className="booking-card-body">
                <img
                  src={
                    item.tour?.images && item.tour.images.length > 0
                      ? `${IMAGE_URL}${item.tour.images[0]}`
                      : "https://via.placeholder.com/200"
                  }
                  alt="tour"
                  className="booking-thumbnail"
                />
                <div className="booking-info">
                  <div className="booking-header">
                    <div className="booking-header__split-1">
                      <h3 className="booking-tour-name">
                        {item.tour?.name || "Tour không tồn tại"}
                      </h3>
                      <div className="booking-meta">
                        <strong>Ngày đặt:</strong>{" "}
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}{" "}
                        <br />
                        <strong>Số lượng vé:</strong> {item.totalTickets} vé
                      </div>
                      <div className="booking-customer-box">
                        <div className="booking-customer-row">
                          <span className="booking-customer-label">
                            <i className="fa-solid fa-user"></i> Người đi:{" "}
                          </span>
                          <span className="booking-customer-value">
                            {repName}
                          </span>
                          {isBookedForOther && (
                            <span className="badge-proxy">Đặt hộ</span>
                          )}
                        </div>
                        <div>
                          <span className="booking-customer-label">
                            <i className="fa-solid fa-phone"></i> SĐT:{" "}
                          </span>
                          <span className="booking-customer-phone">
                            {repPhone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>{renderStatus(item.status)}</div>
                  </div>
                  <div className="booking-footer">
                    <div>
                      <span className="booking-total-label">
                        Tổng thanh toán:
                      </span>
                      <br />
                      <span className="booking-total-value">
                        {(
                          item.totalprice ||
                          item.totalPrice ||
                          0
                        ).toLocaleString("vi-VN")}
                        ₫
                      </span>
                    </div>
                    <div className="booking-actions">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="btn-booking btn-details"
                      >
                        <i className="fa-solid fa-eye"></i> Chi tiết
                      </button>
                      {(item.status?.toLowerCase() === "pending_payment" ||
                        item.status?.toLowerCase() === "payment_verifying") && (
                        <>
                          <button
                            onClick={() => handlePayNow(item)}
                            className="btn-booking btn-pay"
                          >
                            <i className="fa-solid fa-credit-card"></i> Thanh
                            Toán QR
                          </button>
                          <button
                            onClick={() => handleCancelBooking(item._id)}
                            className="btn-booking btn-cancel"
                          >
                            <i className="fa-solid fa-circle-xmark"></i> Hủy Đơn
                          </button>
                        </>
                      )}
                      {item.status?.toLowerCase() === "completed" &&
                        (item.isReviewed ? (
                          <button
                            onClick={() => handleViewReview(item._id)}
                            className="btn-booking btn-review-view"
                          >
                            <i className="fa-solid fa-eye"></i> Xem Đánh Giá
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReviewTour(item)}
                            className="btn-booking btn-review"
                          >
                            <i className="fa-solid fa-star"></i> Đánh Giá
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      {showQRModal && selectedBookingToPay && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-content">
            <h3 className="qr-modal-title">
              <i className="fa-solid fa-credit-card"></i> Chuyển Khoản Thanh
              Toán
            </h3>
            <p className="qr-modal-subtitle">
              Vui lòng quét mã QR dưới đây bằng ứng dụng ngân hàng của bạn.
            </p>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ChuyenKhoanTour"
              alt="QR"
              className="qr-image"
            />
            <div className="qr-info-box">
              <p>
                <strong>Mã đơn hàng:</strong>{" "}
                {selectedBookingToPay?._id?.substring(0, 8) || "N/A"}
              </p>
              <p>
                <strong>Số tiền:</strong>{" "}
                <span className="qr-info-price">
                  {(
                    selectedBookingToPay?.totalprice ||
                    selectedBookingToPay?.totalPrice ||
                    0
                  ).toLocaleString()}
                  ₫
                </span>
              </p>
              <p>
                <strong>Nội dung:</strong>{" "}
                {selectedBookingToPay?.representative?.phone ||
                  user?.phone ||
                  "KH"}{" "}
                DAT TOUR
              </p>
            </div>
            <div className="qr-actions">
              {selectedBookingToPay?.status?.toLowerCase() ===
                "pending_payment" && (
                <button
                  onClick={handleConfirmPayment}
                  className="btn-qr-confirm"
                >
                  <i className="fa-solid fa-circle-check"></i> TÔI ĐÃ CHUYỂN
                  KHOẢN XONG
                </button>
              )}
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-qr-close"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
