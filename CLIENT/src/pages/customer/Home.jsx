import React, { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiCalendar, FiDollarSign, FiShield, FiHeart, FiHeadphones, FiCheckCircle } from 'react-icons/fi';
import TourCard from '../../components/common/TourCard';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import './Home.css';

import sapaImg from '../../assets/images/home-images/sapa.png';
import haGiangImg from '../../assets/images/home-images/ha-giang.webp';
import mocChauImg from '../../assets/images/home-images/moc-chau.webp';
import muCangChaiImg from '../../assets/images/home-images/mu-cang-chai.jpg'; 

export default function Home() {
    const [tours, setTours] = useState([]);
    const [destination, setDestination] = useState(""); 
    const [priceRange, setPriceRange] = useState("");   
    const [startDate, setStartDate] = useState("");     

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const response = await axiosClient.get('/tours?limit=8'); 
                setTours(response.data.tours); 
            } catch (error) {
                console.error("Lỗi tải danh sách tour:", error);
            }
        };
        fetchTours();
    }, []);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        if (destination) params.append("search", destination);
        if (priceRange) params.append("price", priceRange);
        if (startDate) params.append("date", startDate);
        navigate(`/tours?${params.toString()}`);
    };

    const handleQuickSearch = (place) => {
        navigate(`/tours?search=${place}`);
    };

    const topDestinations = [
        { name: "Sapa", img: sapaImg },
        { name: "Hà Giang", img: haGiangImg },
        { name: "Mộc Châu", img: mocChauImg },
        { name: "Mù Cang Chải", img: muCangChaiImg }
    ];

    return (
        <div className="home-page fade-in">
            {/* ================= HERO BANNER ================= */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">Khám Phá Tây Bắc Hùng Vĩ</h1>
                    <p className="hero-subtitle">Hành trình trọn vẹn - Trải nghiệm vô giá cùng hàng trăm đối tác uy tín</p>

                    <form className="search-box" onSubmit={handleSearch}>
                        <div className="search-item">
                            <label><FiMapPin className="search-icon"/> Bạn muốn đi đâu?</label>
                            <input
                                type="text"
                                list="location-options" 
                                placeholder="VD: Sapa, Hà Giang..."
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                            <datalist id="location-options">
                                <option value="Sapa" />
                                <option value="Hà Giang" />
                                <option value="Mộc Châu" />
                                <option value="Mù Cang Chải" />
                                <option value="Điện Biên" />
                            </datalist>
                        </div>

                        <div className="search-item">
                            <label><FiCalendar className="search-icon"/> Khởi hành</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="search-item">
                            <label><FiDollarSign className="search-icon"/> Mức giá</label>
                            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                                <option value="">Tất cả mức giá</option>
                                <option value="low">Dưới 5 triệu</option>
                                <option value="mid">5 - 10 triệu</option>
                                <option value="high">Trên 10 triệu</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-search-main">
                            <FiSearch size={22} /> Tìm Kiếm
                        </button>
                    </form>
                </div>
            </section>

            {/* ================= ĐỊA ĐIỂM NỔI BẬT ================= */}
            <section className="destinations-section container">
                <div className="section-header">
                    <h2>🔥 Điểm Đến Hot Nhất</h2>
                    <p>Những tọa độ không thể bỏ lỡ trong tháng này</p>
                </div>
                <div className="destinations-grid">
                    {topDestinations.map((dest, index) => (
                        <div className="destination-card" key={index} onClick={() => handleQuickSearch(dest.name)}>
                            <img src={dest.img} alt={dest.name} loading="lazy" />
                            <div className="dest-overlay">
                                <h3>{dest.name}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= VÌ SAO CHỌN CHÚNG TÔI ================= */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Vì Sao Chọn Tây Bắc Travel?</h2>
                        <p>Sàn giao dịch du lịch hàng đầu dành riêng cho vùng núi phía Bắc</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feat-icon"><FiShield /></div>
                            <h3>Thanh Toán An Toàn</h3>
                            <p>Hệ thống bảo mật giao dịch tuyệt đối, giữ tiền an toàn cho đến khi hoàn thành Tour.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feat-icon"><FiHeart /></div>
                            <h3>Giá Cả Cạnh Tranh</h3>
                            <p>So sánh giá từ hàng trăm Đối tác du lịch để chọn ra mức giá rẻ nhất cho bạn.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feat-icon"><FiCheckCircle /></div>
                            <h3>Đối Tác Uy Tín</h3>
                            <p>100% Đối tác trên sàn đều được xác minh danh tính và giấy phép kinh doanh.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feat-icon"><FiHeadphones /></div>
                            <h3>Hỗ Trợ 24/7</h3>
                            <p>Đội ngũ Admin luôn túc trực để hỗ trợ giải quyết mọi khiếu nại của khách hàng.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= TOUR NỔI BẬT ================= */}
            <section className="tours-section container">
                <div className="section-header">
                    <h2>🎒 Tour Đang Mở Bán</h2>
                    <p>Khám phá các gói Tour được yêu thích nhất từ các Đối tác của chúng tôi</p>
                </div>
                <div className="tours-grid">
                    {tours.map((tour) => (
                        <TourCard key={tour._id} tour={tour} layout="vertical" />
                    ))}
                    {tours.length === 0 && (
                        <div className="no-tour-msg">
                            Đang tải danh sách Tour hoặc hệ thống chưa có Tour nào mở bán...
                        </div>
                    )}
                </div>
                {tours.length > 0 && (
                    <div className="btn-view-all-wrapper">
                        <button className="btn-view-all" onClick={() => navigate('/tours')}>
                            Xem Tất Cả Tour &rarr;
                        </button>
                    </div>
                )}
            </section>

            {/* ================= CALL TO ACTION (PARTNER) ================= */}
            <section className="cta-section">
                <div className="cta-overlay"></div>
                <div className="cta-content container">
                    <h2>Bạn là Đơn vị Tổ chức Tour?</h2>
                    <p>Tham gia bán hàng trên Tây Bắc Travel để tiếp cận hàng ngàn khách du lịch mỗi ngày với mức chiết khấu cực kỳ ưu đãi!</p>
                    <button className="btn-cta" onClick={() => navigate('/register')}>
                        Mở Gian Hàng Ngay Hôm Nay
                    </button>
                </div>
            </section>
        </div>
    );
}