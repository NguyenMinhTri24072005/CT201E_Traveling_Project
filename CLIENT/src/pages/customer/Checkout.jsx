import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './Checkout.css';
import Swal from 'sweetalert2';

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();

    const [showQRModal, setShowQRModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const tour = location.state?.tour;
    const selectedDate = location.state?.selectedDate;

    const [formData, setFormData] = useState({
        fullName: '', phone: '', email: '', cccd: '', 
        adults: 1, children: 0, babies: 0, notes: ''
    });

    const [passengers, setPassengers] = useState([]);

    useEffect(() => {
        const numAdults = Number(formData.adults || 0);
        const numChildren = Number(formData.children || 0);
        const numBabies = Number(formData.babies || 0);

        const newPassengers = [];
        const adultsToFill = numAdults > 0 ? numAdults - 1 : 0;

        for (let i = 0; i < adultsToFill; i++) newPassengers.push({ passengerType: 'Người lớn', fullName: '', cccd_or_birthyear: '' });
        for (let i = 0; i < numChildren; i++) newPassengers.push({ passengerType: 'Trẻ em', fullName: '', cccd_or_birthyear: '' });
        for (let i = 0; i < numBabies; i++) newPassengers.push({ passengerType: 'Em bé', fullName: '', cccd_or_birthyear: '' });

        setPassengers(newPassengers);
    }, [formData.adults, formData.children, formData.babies]);

    if (!tour || !selectedDate) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>Vui lòng chọn tour trước khi thanh toán!</h2>
                <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: '#e31837', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Quay lại trang chủ</button>
            </div>
        );
    }

    const adultPrice = Number(selectedDate?.adultPrice || 0);
    const childPrice = Number(selectedDate?.childPrice || 0);
    const infantPrice = Number(selectedDate?.babyPrice || 0);

    const numAdults = Number(formData.adults || 0);
    const numChildren = Number(formData.children || 0);
    const numInfants = Number(formData.babies || 0);

    const totalPrice = (numAdults * adultPrice) + (numChildren * childPrice) + (numInfants * infantPrice);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePassengerChange = (index, field, value) => {
        const updated = [...passengers];
        updated[index][field] = value;
        setPassengers(updated);
    };

    const executeBooking = async (actionType = 'paid_now') => {
        setIsProcessing(true);
        const ticketsArray = [];
        if (numAdults > 0) ticketsArray.push({ ticketType: "Người lớn", quantity: numAdults, unitPrice: adultPrice });
        if (numChildren > 0) ticketsArray.push({ ticketType: "Trẻ em", quantity: numChildren, unitPrice: childPrice });
        if (numInfants > 0) ticketsArray.push({ ticketType: "Em bé", quantity: numInfants, unitPrice: infantPrice });

        const bookingData = {
            tourId: tour._id,
            departureId: selectedDate._id,
            tickets: ticketsArray,
            representative: {
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                cccd: formData.cccd
            },
            passengers: passengers,
            paymentMethod: 'BANK_TRANSFER',
            notes: formData.notes,
            isPaidNow: actionType === 'paid_now'
        };

        try {
            await axiosClient.post('/bookings', bookingData);
            setShowQRModal(false);

            if (actionType === 'paid_now') {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã gửi yêu cầu!',
                    text: 'Hệ thống đang chờ đối tác xác nhận số tiền. Bạn có thể theo dõi trong Lịch sử đơn hàng.',
                    confirmButtonColor: '#2ecc71'
                }).then(() => navigate('/history'));
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Đã giữ chỗ thành công!',
                    text: 'Vui lòng thanh toán trong vòng 30 phút tại mục Lịch sử đặt Tour. Quá hạn đơn sẽ tự động hủy.',
                    confirmButtonColor: '#3498db'
                }).then(() => navigate('/history'));
            }

        } catch (error) {
            setShowQRModal(false);
            Swal.fire('Lỗi', error.response?.data?.message || "Vui lòng thử lại sau.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowQRModal(true);
    };

    return (
        <div className="checkout-container">

            <div className="checkout-form-section">
                <h2 className="checkout-section-title">THÔNG TIN ĐẶT TOUR</h2>

                <form onSubmit={handleSubmit}>

                    <h3 className="checkout-step-title">1. SỐ LƯỢNG HÀNH KHÁCH</h3>
                    <div className="passenger-count-group">
                        <div className="passenger-count-item">
                            <label className="passenger-label">
                                Người lớn ({'>='}12t) <br />
                                <span className="passenger-price-highlight">{adultPrice.toLocaleString()}₫</span>
                            </label>
                            <input type="number" name="adults" min="1" value={formData.adults} onChange={handleInputChange} className="checkout-input" />
                        </div>
                        
                        {childPrice > 0 && (
                            <div className="passenger-count-item">
                                <label className="passenger-label">
                                    Trẻ em (5-11t) <br />
                                    <span className="passenger-price-highlight">{childPrice.toLocaleString()}₫</span>
                                </label>
                                <input type="number" name="children" min="0" value={formData.children} onChange={handleInputChange} className="checkout-input" />
                            </div>
                        )}

                        {infantPrice > 0 && (
                            <div className="passenger-count-item">
                                <label className="passenger-label">
                                    Em bé ({'<'}5t) <br />
                                    <span className="passenger-price-highlight">{infantPrice.toLocaleString()}₫</span>
                                </label>
                                <input type="number" name="babies" min="0" value={formData.babies} onChange={handleInputChange} className="checkout-input" />
                            </div>
                        )}
                    </div>

                    <h3 className="checkout-step-title">2. THÔNG TIN NGƯỜI ĐẠI DIỆN (Bắt buộc)</h3>
                    <div className="info-box required">
                        <div className="info-grid">
                            <div><label className="passenger-label">Họ và Tên *</label><input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className="checkout-input" /></div>
                            <div><label className="passenger-label">Số CCCD *</label><input type="text" name="cccd" required value={formData.cccd} onChange={handleInputChange} className="checkout-input" /></div>
                            <div><label className="passenger-label">Số điện thoại *</label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="checkout-input" /></div>
                            <div><label className="passenger-label">Email *</label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="checkout-input" /></div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <label className="passenger-label">Ghi chú thêm</label>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="checkout-input checkout-textarea" />
                        </div>
                    </div>

                    {passengers.length > 0 && (
                        <>
                            <h3 className="checkout-step-title">3. THÔNG TIN NGƯỜI ĐI CÙNG (Không bắt buộc)</h3>
                            <p className="info-note">Bạn có thể bổ sung thông tin hành khách sau khi đặt tour.</p>
                            {passengers.map((p, index) => (
                                <div key={index} className="info-box optional">
                                    <strong className="optional-passenger-title">Hành khách {index + 2} ({p.passengerType})</strong>
                                    <div className="optional-passenger-grid">
                                        <div className="optional-passenger-input">
                                            <input type="text" placeholder="Họ và Tên (Tùy chọn)" value={p.fullName} onChange={(e) => handlePassengerChange(index, 'fullName', e.target.value)} className="checkout-input" />
                                        </div>
                                        <div className="optional-passenger-input">
                                            <input type="text" placeholder={p.passengerType === 'Người lớn' ? "Số CCCD (Tùy chọn)" : "Năm sinh (Tùy chọn)"} value={p.cccd_or_birthyear} onChange={(e) => handlePassengerChange(index, 'cccd_or_birthyear', e.target.value)} className="checkout-input" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    <h3 className="checkout-step-title">4. PHƯƠNG THỨC THANH TOÁN</h3>
                    <div className="payment-method-box">
                        <div className="payment-method-icon">📱</div>
                        <div>
                            <strong className="payment-method-title">Chuyển khoản / Quét mã QR (Bắt buộc)</strong>
                            <p className="payment-method-desc">Vui lòng chuẩn bị sẵn ứng dụng ngân hàng. Hệ thống sẽ giữ chỗ ngay khi bạn hoàn tất đặt đơn.</p>
                        </div>
                    </div>

                    <button type="submit" className="btn-submit-booking">
                        XÁC NHẬN TẠO ĐƠN
                    </button>
                </form>
            </div>

            {/* CỘT PHẢI: TÓM TẮT BILL */}
            <div className="checkout-summary-section">
                <h3 className="summary-title">TÓM TẮT CHUYẾN ĐI</h3>
                <h4 className="summary-tour-name">{tour.name}</h4>
                <p className="summary-detail"><strong>Khởi hành:</strong> {selectedDate.date}</p>
                <p className="summary-detail"><strong>Thời gian:</strong> {tour.duration}</p>

                <div className="summary-calc-box">
                    {numAdults > 0 && <div className="summary-calc-row"><span>Người lớn x {numAdults}</span><span>{(numAdults * adultPrice).toLocaleString()}₫</span></div>}
                    {numChildren > 0 && <div className="summary-calc-row"><span>Trẻ em x {numChildren}</span><span>{(numChildren * childPrice).toLocaleString()}₫</span></div>}
                    {numInfants > 0 && <div className="summary-calc-row"><span>Em bé x {numInfants}</span><span>{(numInfants * infantPrice).toLocaleString()}₫</span></div>}

                    <div className="summary-total-row">
                        <span>Tổng cộng:</span>
                        <span className="summary-total-price">{totalPrice.toLocaleString('vi-VN')}₫</span>
                    </div>
                </div>
            </div>

            {/* MODAL QR MỚI */}
            {showQRModal && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal">
                        <h3 className="modal-qr-title">💳 Chuyển Khoản Thanh Toán</h3>
                        
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ChuyenKhoanTour" alt="QR" className="qr-img" />
                        
                        <div className="qr-payment-details">
                            <p><strong>Ngân hàng:</strong> Vietcombank</p>
                            <p><strong>Chủ TK:</strong> TAY BAC TRAVEL</p>
                            <p><strong>Số tiền:</strong> <span className="qr-price-highlight">{totalPrice.toLocaleString()}₫</span></p>
                            <p><strong>Nội dung:</strong> {formData.phone} DAT TOUR</p>
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                onClick={() => executeBooking('paid_now')} 
                                disabled={isProcessing}
                                className="btn-qr-action btn-paid-now"
                            >
                                {isProcessing ? "Đang xử lý..." : "✅ TÔI ĐÃ CHUYỂN KHOẢN XONG"}
                            </button>

                            <button 
                                onClick={() => executeBooking('pay_later')} 
                                disabled={isProcessing}
                                className="btn-qr-action btn-pay-later"
                            >
                                ⏳ GIỮ CHỖ & THANH TOÁN SAU
                            </button>
                            
                            <button 
                                onClick={() => setShowQRModal(false)} 
                                className="btn-qr-cancel"
                            >
                                Hủy đặt tour
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}