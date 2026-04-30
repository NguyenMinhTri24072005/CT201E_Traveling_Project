import React from "react";
import { FiTarget, FiHeart, FiShield } from "react-icons/fi";
import "./About.css";
export default function About() {
  return (
    <div className="about-page">
      {}
      <div className="about-hero">
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <h1>Về Tây Bắc Travel</h1>
          <p>
            Hành trình kết nối những tâm hồn yêu thiên nhiên và văn hóa bản địa
          </p>
        </div>
      </div>
      <div className="about-container">
        {}
        <section className="about-story">
          <div className="story-text">
            <h2>Câu Chuyện Của Chúng Tôi</h2>
            <p>
              Được thành lập từ năm 2026, <strong>Tây Bắc Travel</strong> ra đời
              với sứ mệnh mang đến cho du khách những trải nghiệm chân thực nhất
              về vùng núi rừng thiêng liêng của Tổ quốc.
            </p>
            <p>
              Chúng tôi không chỉ tổ chức các tour du lịch đơn thuần, mà còn
              mong muốn tạo ra những hành trình kết nối. Nơi bạn được hòa mình
              vào những thửa ruộng bậc thang chín vàng ở Mù Cang Chải, chinh
              phục đỉnh đèo Mã Pí Lèng huyền thoại, và quây quần bên bếp lửa
              cùng đồng bào dân tộc thiểu số.
            </p>
          </div>
          <div className="story-image">
            <img src="../../../../public/r6.jpg" alt="Ruộng bậc thang" />
          </div>
        </section>
        {}
        <section className="about-values">
          <h2 className="text-center">Tại Sao Chọn Tây Bắc Travel?</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <FiTarget />
              </div>
              <h3>Lịch Trình Độc Bản</h3>
              <p>
                Mỗi chuyến đi đều được thiết kế riêng biệt, tối ưu hóa trải
                nghiệm và tránh xa sự xô bồ của du lịch đại trà.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <FiHeart />
              </div>
              <h3>Tận Tâm Phục Vụ</h3>
              <p>
                Đội ngũ hướng dẫn viên là người bản địa, hiểu rõ từng nhành cây
                ngọn cỏ và luôn phục vụ bằng cả trái tim.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <FiShield />
              </div>
              <h3>An Toàn Hàng Đầu</h3>
              <p>
                Chúng tôi trang bị đầy đủ bảo hiểm du lịch, phương tiện chất
                lượng cao để bạn an tâm chinh phục mọi cung đường.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
