import React, { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import Swal from 'sweetalert2';
import './Contact.css';

export default function Contact() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Swal.fire({
            icon: 'success',
            title: 'Đã gửi lời nhắn!',
            text: 'Cảm ơn bạn đã liên hệ. Đội ngũ Tây Bắc Travel sẽ phản hồi qua email của bạn trong thời gian sớm nhất.',
            confirmButtonColor: '#2ecc71'
        });
        setFormData({ name: '', email: '', subject: '', message: '' }); 
    };

    return (
        <div className="contact-page">
            <div className="contact-header">
                <h1>Liên Hệ Với Chúng Tôi</h1>
                <p>Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn 24/7</p>
            </div>

            <div className="contact-container">
                {/* Cột trái: Thông tin liên hệ */}
                <div className="contact-info">
                    <h2>Thông Tin Liên Hệ</h2>
                    <p className="info-desc">Đừng ngần ngại ghé thăm văn phòng hoặc gọi điện cho chúng tôi để được tư vấn lộ trình tốt nhất.</p>
                    
                    <div className="info-item">
                        <div className="icon-box"><FiMapPin /></div>
                        <div>
                            <strong>Trụ sở chính:</strong>
                            <p>Số 123 Đường Điện Biên Phủ, Thị xã Sapa, Lào Cai</p>
                        </div>
                    </div>
                    
                    <div className="info-item">
                        <div className="icon-box"><FiPhone /></div>
                        <div>
                            <strong>Hotline (24/7):</strong>
                            <p>1900 8888 - 0987 654 321</p>
                        </div>
                    </div>
                    
                    <div className="info-item">
                        <div className="icon-box"><FiMail /></div>
                        <div>
                            <strong>Email:</strong>
                            <p>hotro@taybactravel.vn</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="icon-box"><FiClock /></div>
                        <div>
                            <strong>Giờ làm việc:</strong>
                            <p>Thứ 2 - Chủ Nhật: 07:00 - 21:00</p>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Form liên hệ (ĐÃ SỬA LỖI CẤU TRÚC THẺ FORM) */}
                <div className="contact-form-wrapper">
                    <h2>Gửi Lời Nhắn</h2>
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Họ và tên của bạn" required />
                        </div>
                        <div className="input-group">
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Địa chỉ Email" required />
                        </div>
                        <div className="input-group">
                            <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Tiêu đề" required />
                        </div>
                        <div className="input-group">
                            <textarea name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Nội dung cần tư vấn..." required></textarea>
                        </div>
                        <button type="submit" className="btn-submit-contact">GỬI LỜI NHẮN</button>
                    </form>
                </div>
            </div>

            {/* Google Map */}
            <div className="contact-map">
                <iframe 
                    title="Google Map Sapa"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118318.06830508524!2d103.74317855427192!3d22.331201944773826!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x36cd416cdd9c74ab%3A0xcda6580a56fc0fc3!2zU2EgUGEsIEzDoG8gQ2FpLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1714032123456!5m2!1svi!2s" 
                    width="100%" 
                    height="450" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                >
                </iframe>
            </div>
        </div>
    );
}