import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { IMAGE_URL } from '../../utils/constants';
import './AdminStyles.css';
import './AddTour.css';

const DEPARTURE_LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Sapa', 'Đà Lạt'];
const TRANSPORT_METHODS = ['Ô tô', 'Máy bay', 'Tàu hỏa', 'Tàu cao tốc', 'Limousine', 'Tự túc phương tiện'];
const AMENITIES_LIST = [
    'Khách sạn 3-5 sao', 'Bao gồm vé máy bay', 'Bao ăn các bữa',
    'Bảo hiểm du lịch', 'Hướng dẫn viên bản địa', 'Xe đưa đón tận nơi',
    'Tặng kèm vé tham quan', 'Linh hoạt đổi lịch'
];

export default function EditTour() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    // State lưu trữ file ảnh lịch trình mới chọn
    const [itinFiles, setItinFiles] = useState({});
    
    const [basicInfo, setBasicInfo] = useState({
        name: '', code: '', durationDays: 3, durationNights: 2,
        departureLocation: DEPARTURE_LOCATIONS[0]
    });

    const [currentImages, setCurrentImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [itinerary, setItinerary] = useState([]);
    const [departures, setDepartures] = useState([]);

    useEffect(() => {
        const fetchTour = async () => {
            try {
                const response = await axiosClient.get(`/tours/${id}`);
                const data = response.data;

                let dDays = 3, dNights = 2;
                if (data.duration) {
                    const match = data.duration.match(/(\d+)\s*Ngày\s*(\d+)\s*Đêm/i);
                    if (match) {
                        dDays = Number(match[1]);
                        dNights = Number(match[2]);
                    }
                }

                setBasicInfo({
                    name: data.name || '',
                    code: data.code || '',
                    durationDays: dDays,
                    durationNights: dNights,
                    departureLocation: data.departureLocation || DEPARTURE_LOCATIONS[0]
                });

                if (data.images && data.images.length > 0) {
                    setCurrentImages(data.images);
                } else if (data.image) {
                    setCurrentImages([data.image]);
                }

                setHighlights(data.highlights || []);
                setItinerary(data.itinerary && data.itinerary.length > 0 ? data.itinerary : [{ day: '', meals: '', content: '' }]);

                let formattedDepartures = [];
                if (data.departures && data.departures.length > 0) {
                    formattedDepartures = data.departures.map(dep => {
                        const formatDateForInput = (dateString) => {
                            if (!dateString) return '';
                            if (dateString.includes('/')) {
                                const [day, month, year] = dateString.split('/');
                                return `${year}-${month}-${day}`;
                            }
                            return dateString;
                        };
                        return {
                            ...dep,
                            date: formatDateForInput(dep.date),
                            returnDate: formatDateForInput(dep.returnDate)
                        };
                    });
                } else {
                    formattedDepartures = [{
                        date: '', returnDate: '', transport: 'Ô tô',
                        adultPrice: 0, childPrice: 0, babyPrice: 0, maxslots: 20, availableslots: 20
                    }];
                }

                setDepartures(formattedDepartures);
                setFetching(false);
            } catch (error) {
                console.error("Lỗi lấy thông tin tour:", error);
                alert("Không thể tải thông tin tour!");
                navigate('/admin/tours');
            }
        };
        fetchTour();
    }, [id, navigate]);

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
    const removeItineraryDay = (index) => setItinerary(itinerary.filter((_, i) => i !== index));

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
    const removeDeparture = (index) => setDepartures(departures.filter((_, i) => i !== index));

    // Hàm xử lý chọn ảnh cho từng ngày lịch trình
    const handleItinImageChange = (index, file) => {
        setItinFiles(prev => ({ ...prev, [index]: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', basicInfo.name);
        formData.append('code', basicInfo.code);
        formData.append('duration', `${basicInfo.durationDays} Ngày ${basicInfo.durationNights} Đêm`);
        formData.append('departureLocation', basicInfo.departureLocation);

        // Upload ảnh Gallery
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => formData.append('images', file));
        }

        formData.append('highlights', JSON.stringify(highlights));
        formData.append('itinerary', JSON.stringify(itinerary));
        formData.append('departures', JSON.stringify(departures));

        // 👉 Xử lý ảnh lịch trình bên trong handleSubmit
        const imageMap = [];
        Object.keys(itinFiles).forEach(index => {
            formData.append('itineraryImages', itinFiles[index]);
            imageMap.push(index);
        });
        formData.append('itineraryImageMap', JSON.stringify(imageMap));

        try {
            await axiosClient.put(`/tours/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('🎉 Cập nhật Tour thành công!');
            navigate('/admin/tours');
        } catch (error) {
            alert('Lỗi cập nhật: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#2c3e50' }}>⏳ Đang tải dữ liệu Tour...</h2>;

    return (
        <div className="admin-page add-tour-container">
            <h2 className="admin-title">✏️ Cập Nhật Tour</h2>

            <form onSubmit={handleSubmit} className="add-tour-form">

                <h3 className="section-title">1. Thông tin cơ bản</h3>
                <div className="form-grid-2">
                    <div className="form-group">
                        <label>Tên Tour</label>
                        <input required type="text" name="name" value={basicInfo.name} onChange={handleBasicChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label>Mã Tour</label>
                        <input required type="text" name="code" value={basicInfo.code} onChange={handleBasicChange} className="form-input" />
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

                <div className="current-image-preview">
                    <label>Thư viện Ảnh hiện tại:</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {currentImages.map((img, idx) => (
                            <img key={idx} src={`${IMAGE_URL}${img}`} alt={`Tour img ${idx}`} style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} />
                        ))}
                    </div>
                    <br />
                    <small>Chọn các ảnh khác nếu muốn THAY THẾ toàn bộ ảnh cũ:</small><br />
                    <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files))} style={{ marginTop: '8px' }} />
                    {imageFiles.length > 0 && <small style={{ display: 'block', color: 'green' }}>{imageFiles.length} ảnh mới sẽ ghi đè ảnh cũ.</small>}
                </div>

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

                <h3 className="section-title">3. Các đợt khởi hành & Giá vé</h3>
                {departures.map((dep, index) => (
                    <div key={index} className="dynamic-block departure-block">
                        <div className="departure-header">
                            <strong>Đợt {index + 1}:</strong>
                            {departures.length > 1 && (
                                <button type="button" onClick={() => removeDeparture(index)} className="btn-remove-item">Xóa đợt này</button>
                            )}
                        </div>
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
                            <div className="form-group"><small>Giá EB ({'<'}5t):</small><input type="number" value={dep.babyPrice} onChange={(e) => handleDepartureChange(index, 'babyPrice', e.target.value)} required className="form-input" /></div>
                            <div className="form-group"><small>Số chỗ tối đa:</small><input type="number" value={dep.maxslots} onChange={(e) => handleDepartureChange(index, 'maxslots', e.target.value)} required className="form-input" /></div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addDeparture} className="btn-add-item">+ Thêm đợt khởi hành</button>

                <h3 className="section-title">4. Lịch trình chi tiết</h3>
                {itinerary.map((itin, index) => (
                    <div key={index} className="dynamic-block">
                        <div className="itinerary-day-input">
                            <input type="text" placeholder="Tiêu đề (VD: Ngày 1 - Hà Nội - Sapa)" value={itin.day} onChange={(e) => handleItineraryChange(index, 'day', e.target.value)} className="form-input" required />
                            {itinerary.length > 1 && (
                                <button type="button" onClick={() => removeItineraryDay(index)} className="btn-remove-item">Xóa</button>
                            )}
                        </div>
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                            <input type="text" placeholder="Bữa ăn (VD: Sáng, Trưa, Tối)" value={itin.meals} onChange={(e) => handleItineraryChange(index, 'meals', e.target.value)} className="form-input" />
                        </div>
                        <div className="form-group">
                            <textarea placeholder="Nội dung hoạt động chi tiết..." value={itin.content} onChange={(e) => handleItineraryChange(index, 'content', e.target.value)} className="form-input" required />
                        </div>
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#666' }}>Ảnh minh họa cho ngày này:</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                                {itin.image && (
                                    <img src={`${IMAGE_URL}${itin.image}`} alt="Itinerary" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                )}
                                <input
                                    type="file"
                                    onChange={(e) => handleItinImageChange(index, e.target.files[0])}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addItineraryDay} className="btn-add-item">+ Thêm Ngày Lịch Trình</button>

                <hr className="divider" />
                <button type="submit" disabled={loading} className="btn-update-tour">
                    {loading ? '⏳ Đang lưu thay đổi...' : '💾 CẬP NHẬT TOUR'}
                </button>

            </form>
        </div>
    );
}