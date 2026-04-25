import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { IMAGE_URL } from '../../utils/constants'; // Đảm bảo đã import hằng số này
import './AdminStyles.css';
import './AddTour.css';

const DEPARTURE_LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Sapa', 'Đà Lạt'];
const TRANSPORT_METHODS = ['Ô tô', 'Máy bay', 'Tàu hỏa', 'Tàu cao tốc', 'Limousine', 'Tự túc phương tiện'];
const AMENITIES_LIST = [
    'Khách sạn 3-5 sao', 'Bao gồm vé máy bay', 'Bao ăn các bữa',
    'Bảo hiểm du lịch', 'Hướng dẫn viên bản địa', 'Xe đưa đón tận nơi',
    'Tặng kèm vé tham quan', 'Linh hoạt đổi lịch'
];

export default function AddTour() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        code: '',
        durationDays: 3,
        durationNights: 2,
        departureLocation: DEPARTURE_LOCATIONS[0],
        location: '', 
        category: ''
    });

    const [highlights, setHighlights] = useState([]);
    const [itinerary, setItinerary] = useState([{ day: '', meals: '', content: '' }]);
    const [itinFiles, setItinFiles] = useState({});
    const [departures, setDepartures] = useState([{
        date: '', returnDate: '', transport: TRANSPORT_METHODS[0],
        adultPrice: 0, childPrice: 0, babyPrice: 0, maxslots: 20, availableslots: 20
    }]);

    // 👉 FETCH DỮ LIỆU LOCATION VÀ CATEGORY KHI LOAD TRANG
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [locRes, catRes] = await Promise.all([
                    axiosClient.get('/locations'),
                    axiosClient.get('/categories')
                ]);
                setLocations(locRes.data);
                setCategories(catRes.data);
                
                // Gán giá trị mặc định cho select box nếu có dữ liệu
                if(locRes.data.length > 0) setBasicInfo(prev => ({...prev, location: locRes.data[0]._id}));
                if(catRes.data.length > 0) setBasicInfo(prev => ({...prev, category: catRes.data[0]._id}));
            } catch (error) {
                console.error("Lỗi tải danh mục:", error);
            }
        };
        fetchData();
    }, []);

    const handleItinImageChange = (index, file) => {
        setItinFiles(prev => ({ ...prev, [index]: file }));
    };

    const handleBasicChange = (e) => setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });

    const handleAmenityToggle = (amenity) => {
        if (highlights.includes(amenity)) {
            setHighlights(highlights.filter(item => item !== amenity));
        } else {
            setHighlights([...highlights, amenity]);
        }
    };

    const handleItineraryChange = (index, field, value) => {
        const newItin = [...itinerary]; newItin[index][field] = value; setItinerary(newItin);
    };
    const addItineraryDay = () => setItinerary([...itinerary, { day: '', meals: '', content: '' }]);

    const handleDepartureChange = (index, field, value) => {
        const newDep = [...departures];
        newDep[index][field] = value;
        if (field === 'maxslots') newDep[index]['availableslots'] = value;
        setDepartures(newDep);
    };

    const addDeparture = () => setDepartures([...departures, {
        date: '', returnDate: '', transport: TRANSPORT_METHODS[0],
        adultPrice: 0, childPrice: 0, babyPrice: 0, maxslots: 20, availableslots: 20
    }]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', basicInfo.name);
        formData.append('code', basicInfo.code);
        const formattedDuration = `${basicInfo.durationDays} Ngày ${basicInfo.durationNights} Đêm`;
        formData.append('duration', formattedDuration);
        formData.append('departureLocation', basicInfo.departureLocation);
        
        // 👉 GỬI LOCATION VÀ CATEGORY LÊN BACKEND
        formData.append('location', basicInfo.location);
        formData.append('category', basicInfo.category);
        
        // Fix lỗi thiếu commission nếu bạn dùng trường này
        if(basicInfo.commissionPerPerson) {
            formData.append('commissionPerPerson', basicInfo.commissionPerPerson);
        }

        // Upload ảnh Gallery chính
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => {
                formData.append('images', file);
            });
        }

        // 👉 ĐƯA LOGIC XỬ LÝ ẢNH LỊCH TRÌNH VÀO TRONG NÀY
        const imageMap = [];
        Object.keys(itinFiles).forEach(index => {
            formData.append('itineraryImages', itinFiles[index]);
            imageMap.push(index);
        });
        formData.append('itineraryImageMap', JSON.stringify(imageMap));

        formData.append('highlights', JSON.stringify(highlights));
        formData.append('itinerary', JSON.stringify(itinerary));
        formData.append('departures', JSON.stringify(departures));

        try {
            await axiosClient.post('/tours', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('🎉 Thêm Tour thành công!');
            navigate('/admin/tours');
        } catch (error) {
            alert('Lỗi khi thêm Tour: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page add-tour-container">
            <h2 className="admin-title">➕ Thêm Tour Mới</h2>

            <form onSubmit={handleSubmit} className="add-tour-form">

                {/* 1. THÔNG TIN CƠ BẢN */}
                <h3 className="section-title">1. Thông tin cơ bản</h3>
                <div className="form-grid-2">
                    <div className="form-group">
                        <label>Tên Tour</label>
                        <input required type="text" name="name" onChange={handleBasicChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label>Mã Tour (VD: SP-01)</label>
                        <input required type="text" name="code" onChange={handleBasicChange} className="form-input" />
                    </div>

                    {/* 👉 BỔ SUNG Ô CHỌN ĐIỂM ĐẾN VÀ DANH MỤC */}
                    <div className="form-group">
                        <label>Điểm đến (Location)</label>
                        <select name="location" value={basicInfo.location} onChange={handleBasicChange} className="form-input" required>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc._id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Danh mục (Category)</label>
                        <select name="category" value={basicInfo.category} onChange={handleBasicChange} className="form-input" required>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Thời lượng</label>
                        <div className="duration-group">
                            <select name="durationDays" value={basicInfo.durationDays} onChange={handleBasicChange} className="form-input">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => <option key={d} value={d}>{d} Ngày</option>)}
                            </select>
                            <select name="durationNights" value={basicInfo.durationNights} onChange={handleBasicChange} className="form-input">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Đêm</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nơi khởi hành</label>
                        <select name="departureLocation" value={basicInfo.departureLocation} onChange={handleBasicChange} className="form-input">
                            {DEPARTURE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Thư viện Ảnh Tour (Chọn nhiều):</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setImageFiles(Array.from(e.target.files))}
                        style={{ marginTop: '8px' }}
                    />
                    {imageFiles.length > 0 && <small style={{ display: 'block', color: 'green' }}>{imageFiles.length} ảnh đã được chọn.</small>}
                </div>

                {/* 2. TIỆN ÍCH */}
                <h3 className="section-title">2. Tiện ích & Điểm nhấn (Chọn nhiều)</h3>
                <div className="amenities-grid">
                    {AMENITIES_LIST.map((amenity, index) => (
                        <label key={index} className="amenity-checkbox">
                            <input
                                type="checkbox"
                                checked={highlights.includes(amenity)}
                                onChange={() => handleAmenityToggle(amenity)}
                            />
                            {amenity}
                        </label>
                    ))}
                </div>

                {/* 3. ĐỢT KHỞI HÀNH */}
                <h3 className="section-title">3. Các đợt khởi hành & Giá vé</h3>
                {departures.map((dep, index) => (
                    <div key={index} className="dynamic-block departure-block">
                        <strong className="block-header">Đợt {index + 1}:</strong>
                        <div className="form-grid-3">
                            <div className="form-group"><small>Ngày đi:</small><input type="date" value={dep.date} onChange={(e) => handleDepartureChange(index, 'date', e.target.value)} required className="form-input" /></div>
                            <div className="form-group"><small>Ngày về:</small><input type="date" value={dep.returnDate} onChange={(e) => handleDepartureChange(index, 'returnDate', e.target.value)} required className="form-input" /></div>
                            <div className="form-group">
                                <small>Phương tiện:</small>
                                <select value={dep.transport} onChange={(e) => handleDepartureChange(index, 'transport', e.target.value)} required className="form-input">
                                    {TRANSPORT_METHODS.map(trans => <option key={trans} value={trans}>{trans}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-grid-4">
                            <div className="form-group"><small>Giá NL (12t+):</small><input type="number" value={dep.adultPrice} onChange={(e) => handleDepartureChange(index, 'adultPrice', e.target.value)} required className="form-input" /></div>
                            <div className="form-group"><small>Giá TE (5-11t):</small><input type="number" value={dep.childPrice} onChange={(e) => handleDepartureChange(index, 'childPrice', e.target.value)} required className="form-input" /></div>
                            <div className="form-group"><small>Giá EB (Dưới 5t):</small><input type="number" value={dep.babyPrice} onChange={(e) => handleDepartureChange(index, 'babyPrice', e.target.value)} required className="form-input" /></div>
                            <div className="form-group"><small>Số chỗ tối đa:</small><input type="number" value={dep.maxslots} onChange={(e) => handleDepartureChange(index, 'maxslots', e.target.value)} required className="form-input" /></div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addDeparture} className="btn-add-item">+ Thêm đợt khởi hành</button>

                {/* 4. LỊCH TRÌNH */}
                <h3 className="section-title">4. Lịch trình chi tiết</h3>
                {itinerary.map((itin, index) => (
                    <div key={index} className="dynamic-block">
                        <div className="form-group">
                            <input type="text" placeholder="Tiêu đề (VD: Ngày 1 - Hà Nội - Sapa)" value={itin.day} onChange={(e) => handleItineraryChange(index, 'day', e.target.value)} className="form-input" style={{ marginBottom: '10px' }} required />
                        </div>
                        <div className="form-group">
                            <input type="text" placeholder="Bữa ăn (VD: Sáng, Trưa, Tối)" value={itin.meals} onChange={(e) => handleItineraryChange(index, 'meals', e.target.value)} className="form-input" style={{ marginBottom: '10px' }} />
                        </div>
                        <div className="form-group">
                            <textarea placeholder="Nội dung hoạt động chi tiết..." value={itin.content} onChange={(e) => handleItineraryChange(index, 'content', e.target.value)} className="form-input" required />
                        </div>
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#666' }}>Ảnh minh họa cho ngày này:</label>
                            <input
                                type="file"
                                onChange={(e) => handleItinImageChange(index, e.target.files[0])}
                                accept="image/*"
                                style={{ marginTop: '5px' }}
                            />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addItineraryDay} className="btn-add-item">+ Thêm Ngày Lịch Trình</button>

                <hr className="divider" />
                <button type="submit" disabled={loading} className="btn-submit-tour">
                    {loading ? '⏳ Đang lưu dữ liệu...' : '💾 LƯU TOUR MỚI'}
                </button>

            </form>
        </div>
    );
}