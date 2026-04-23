import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Swal from 'sweetalert2';
import './AdminStyles.css';
import './TourManagement.css'; 
import { IMAGE_URL } from "../../utils/constants";
import { useAuth } from '../../contexts/AuthContext';

export default function TourManagement() {
    const [tours, setTours] = useState([]);
    const [filteredTours, setFilteredTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [partnerFilter, setPartnerFilter] = useState('ALL');
    const [partners, setPartners] = useState([]);

    const [selectedTours, setSelectedTours] = useState([]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const tourRes = await axiosClient.get('/tours/admin/all?limit=2000');
            const allTours = Array.isArray(tourRes.data.tours) ? tourRes.data.tours : [];

            if (user?.role === 'Admin') {
                const userRes = await axiosClient.get('/auth/users');
                setPartners(userRes.data.filter(u => u.role === 'Partner'));
            }

            if (user?.role === 'Partner') {
                const myTours = allTours.filter(t => {
                    const creatorId = t.createdBy?._id || t.createdBy;
                    return creatorId === user?._id;
                });
                setTours(myTours);
            } else {
                setTours(allTours);
            }
            setLoading(false);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAllData();
    }, [user]);

    useEffect(() => {
        let result = tours;
        if (statusFilter !== 'ALL') {
            result = result.filter(t => t.status === statusFilter);
        }
        if (partnerFilter !== 'ALL') {
            result = result.filter(t => {
                const creatorId = t.createdBy?._id || t.createdBy;
                return creatorId === partnerFilter;
            });
        }
        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(lowerSearch) ||
                t.code.toLowerCase().includes(lowerSearch) ||
                (t.destination || '').toLowerCase().includes(lowerSearch)
            );
        }
        setFilteredTours(result);
        setSelectedTours([]);
    }, [searchTerm, statusFilter, partnerFilter, tours]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredTours.map(t => t._id);
            setSelectedTours(allIds);
        } else {
            setSelectedTours([]);
        }
    };

    const handleSelectOne = (e, tourId) => {
        if (e.target.checked) {
            setSelectedTours([...selectedTours, tourId]);
        } else {
            setSelectedTours(selectedTours.filter(id => id !== tourId));
        }
    };

    const processBulkAction = async (targetStatus, actionName, confirmColor) => {
        if (selectedTours.length === 0) return Swal.fire('Thông báo', 'Vui lòng chọn ít nhất 1 Tour!', 'info');

        const confirm = await Swal.fire({
            title: `${actionName} ${selectedTours.length} Tour?`,
            text: targetStatus === 'Approved'
                ? "Các Tour này sẽ lập tức hiển thị trên trang chủ."
                : "Các Tour này sẽ bị gỡ khỏi trang chủ và đánh dấu là Bị từ chối.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            confirmButtonText: `Đồng ý ${actionName}`
        });

        if (confirm.isConfirmed) {
            try {
                await axiosClient.put('/tours/admin/bulk-status', { tourIds: selectedTours, status: targetStatus });
                Swal.fire('Thành công!', `Đã ${actionName.toLowerCase()} ${selectedTours.length} Tour.`, 'success');
                setSelectedTours([]);
                fetchAllData();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể thực hiện thao tác hàng loạt', 'error');
            }
        }
    };

    const handleDelete = (e, tourId) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!tourId) return;

        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e31837',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Vâng, xóa nó!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosClient.delete(`/tours/${tourId.trim()}`);
                    Swal.fire('Đã xóa!', response.data.message || 'Tour đã được loại bỏ.', 'success');
                    fetchAllData();
                } catch (error) {
                    Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể xóa tour này.', 'error');
                }
            }
        });
    };

    const handleApproveTour = async (tourId, newStatus) => {
        let reason = '';
        if (newStatus === 'Rejected') {
            const { value: text } = await Swal.fire({
                title: 'Lý do từ chối',
                input: 'textarea',
                inputPlaceholder: 'Nhập lý do từ chối để Partner sửa lại...',
                showCancelButton: true,
                confirmButtonColor: '#e31837',
                confirmButtonText: 'Xác nhận Từ chối'
            });
            if (!text) return;
            reason = text;
        } else {
            const confirm = await Swal.fire({
                title: 'Duyệt Tour này?',
                text: 'Tour này sẽ lập tức hiển thị trên trang chủ.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#27ae60',
                confirmButtonText: '✅ Phê duyệt'
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            await axiosClient.put(`/tours/${tourId}/status`, { status: newStatus, rejectReason: reason });
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Đã ${newStatus === 'Approved' ? 'Duyệt' : 'Từ chối'}!`, showConfirmButton: false, timer: 1500 });
            fetchAllData();
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể thay đổi trạng thái', 'error');
        }
    };

    const handleViewTourDetails = (tour) => {
        // 1. Hàm đổi ảnh chính (Giữ nguyên)
        window.changeSwalImage = (url) => {
            const mainPreview = document.getElementById('swal-main-preview');
            if (mainPreview) {
                mainPreview.src = url;
            }
        };

        // 2. Xử lý ảnh bìa khởi tạo
        const displayCover = (tour.images && tour.images.length > 0)
            ? tour.images[0]
            : (tour.image && !tour.image.includes('default') ? tour.image : null);

        const initialImage = displayCover ? IMAGE_URL + displayCover : 'https://via.placeholder.com/800x400';

        // 3. TẠO HTML CHO ĐIỂM NHẤN (HIGHLIGHTS) - Hiển thị dạng Badge
        let highlightsHtml = '';
        if (tour.highlights && tour.highlights.length > 0) {
            highlightsHtml = `
                <div style="margin-bottom: 20px; text-align: left;">
                    <span style="font-weight: bold; color: #2d4271; display: block; margin-bottom: 8px;">🌟 Điểm nổi bật & Tiện ích:</span>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${tour.highlights.map(h => `
                            <span style="background: #e8f4fd; color: #2b6cb0; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; border: 1px solid #bee3f8; font-weight: 500;">
                                ${h}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        let galleryHtml = '';
        if (tour.images && tour.images.length > 0) {
            galleryHtml = `
                <div class="swal-gallery-section" style="margin-bottom: 25px; text-align: left;">
                    <span style="font-weight: bold; color: #2d4271; display: block; margin-bottom: 10px;">🖼️ Thư viện ảnh (${tour.images.length}):</span>
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
                        ${tour.images.map(img => `
                            <div style="width: 80px; height: 60px; flex-shrink: 0; overflow: hidden; border-radius: 4px; border: 2px solid #eee; cursor: pointer;">
                                <img src="${IMAGE_URL}${img}" style="width: 100%; height: 100%; object-fit: cover;" 
                                    onclick="changeSwalImage('${IMAGE_URL}${img}')" />
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        let departuresHtml = '';
        if (tour.departures && tour.departures.length > 0) {
            departuresHtml = `
                <div class="swal-departure-section" style="margin-bottom: 25px; text-align: left;">
                    <span style="font-weight: bold; color: #2d4271; display: block; margin-bottom: 10px;">💰 Bảng giá & Lịch khởi hành:</span>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: center;">
                            <thead>
                                <tr style="background: #f7fafc; color: #4a5568;">
                                    <th style="padding: 10px; border: 1px solid #edf2f7;">Ngày đi</th>
                                    <th style="padding: 10px; border: 1px solid #edf2f7;">Người lớn</th>
                                    <th style="padding: 10px; border: 1px solid #edf2f7;">Trẻ em</th>
                                    <th style="padding: 10px; border: 1px solid #edf2f7;">Em bé</th>
                                    <th style="padding: 10px; border: 1px solid #edf2f7;">Trống</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tour.departures.map(dep => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">${new Date(dep.date).toLocaleDateString('vi-VN')}</td>
                                        <td style="padding: 8px; border: 1px solid #edf2f7; color: #e31837; font-weight: bold;">${(dep.adultPrice || 0).toLocaleString()}₫</td>
                                        <td style="padding: 8px; border: 1px solid #edf2f7;">${(dep.childPrice || 0).toLocaleString()}₫</td>
                                        <td style="padding: 8px; border: 1px solid #edf2f7;">${(dep.babyPrice || 0).toLocaleString()}₫</td>
                                        <td style="padding: 8px; border: 1px solid #edf2f7;">
                                            <span style="color: ${dep.availableslots > 0 ? '#38a169' : '#e53e3e'}">${dep.availableslots}/${dep.maxslots}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        const statusText = tour.status === 'Approved' ? '✅ Đã Duyệt' : tour.status === 'Rejected' ? '❌ Bị Từ Chối' : '⏳ Đang Chờ Duyệt';

        Swal.fire({
            html: `
                <div class="swal-tour-detail-monitor" style="max-height: 85vh; overflow-y: auto; padding-right: 10px; text-align: left;">
                    
                    <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 20px; background: #000;">
                        <img id="swal-main-preview" src="${initialImage}" 
                            style="width: 100%; height: 380px; object-fit: contain; display: block;" />
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px; color: #fff;">
                            <h2 style="margin: 0; font-size: 1.4rem;">${tour.name}</h2>
                            <span style="font-size: 0.85rem; opacity: 0.9;">Mã tour: ${tour.code} | ${statusText}</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                        <div>
                            <div style="font-size: 0.75rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Người đăng tour</div>
                            <div style="font-weight: bold; color: #2d3748;">${tour.createdBy?.fullname || 'N/A'}</div>
                            <div style="font-size: 0.8rem; color: #4a5568;">${tour.createdBy?.email || ''}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Danh mục & Vị trí</div>
                            <div style="font-weight: bold; color: #2d3748;">${tour.category?.name || 'Chưa phân loại'}</div>
                            <div style="font-size: 0.8rem; color: #4a5568;">📍 ${tour.departureLocation} ➜ ${tour.destination || ''}</div>
                        </div>
                    </div>

                    ${galleryHtml}
                    
                    <div style="background: #fffaf0; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #feebc8; display: flex; justify-content: space-around; text-align: center;">
                        <div><small style="color: #7b341e;">Thời lượng</small><br/><b>⏱️ ${tour.duration}</b></div>
                        <div><small style="color: #7b341e;">Đánh giá</small><br/><b>⭐ ${tour.averageRating || 0}/5</b></div>
                    </div>

                    ${highlightsHtml}
                    ${departuresHtml}

                    <span style="font-weight: bold; color: #2d4271; display: block; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px;">🗺️ Chi tiết lịch trình & Ảnh ngày:</span>
                    <div class="swal-itinerary-content">
                        ${tour.itinerary.map((item, index) => `
                            <div style="display: flex; gap: 15px; margin-bottom: 15px; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #f0f0f0;">
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #dd6b20; margin-bottom: 4px;">Ngày ${item.day || index + 1}</div>
                                    <p style="font-size: 0.85rem; color: #4a5568; margin: 0; line-height: 1.5;">${item.content}</p>
                                </div>
                                ${item.image ? `
                                    <div style="width: 120px; height: 80px; flex-shrink: 0; cursor: pointer;">
                                        <img src="${IMAGE_URL}${item.image}" 
                                            style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" 
                                            onclick="changeSwalImage('${IMAGE_URL}${item.image}')" />
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonColor: '#2d4271',
            confirmButtonText: 'Đóng báo cáo giám sát',
            width: '900px',
            didClose: () => {
                delete window.changeSwalImage;
            }
        });
    };

    if (loading) return <p style={{ padding: '20px', color: '#2d4271', fontWeight: 'bold' }}>Đang tải dữ liệu Tour...</p>;

    const isAllSelected = filteredTours.length > 0 && selectedTours.length === filteredTours.length;

    return (
        <div className="admin-page fade-in">
            <div className="tour-management-header">
                <h2 className="admin-title tour-management-title">
                    {user?.role === 'Admin' ? '👑 Kiểm Duyệt Tour Toàn Sàn' : '🗺️ Quản Lý Tour Của Tôi'}
                </h2>

                <div style={{ display: 'flex', gap: '15px' }}>
                    {user?.role === 'Admin' && selectedTours.length > 0 && (
                        <div className="bulk-action-bar">
                            <span className="bulk-action-text">Đã chọn: {selectedTours.length}</span>
                            <button onClick={() => processBulkAction('Approved', 'Duyệt', '#27ae60')} className="btn-bulk btn-bulk-approve">
                                ✅ Phê duyệt
                            </button>
                            <button onClick={() => processBulkAction('Rejected', 'Từ chối', '#e31837')} className="btn-bulk btn-bulk-reject">
                                ❌ Gỡ / Từ chối
                            </button>
                        </div>
                    )}

                    {user?.role === 'Partner' && (
                        <Link to="/admin/tours/add" className="login-btn" style={{ background: '#e31837', color: 'white', alignSelf: 'center' }}>
                            ➕ Thêm Tour Mới
                        </Link>
                    )}
                </div>
            </div>

            <div className="filter-container">
                <div className="filter-item search">
                    <label className="filter-label">🔍 Tìm kiếm:</label>
                    <input type="text" className="filter-input" placeholder="Tên, mã tour..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-item">
                    <label className="filter-label">Trạng thái:</label>
                    <select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">Tất cả</option>
                        <option value="Pending">⏳ Chờ duyệt</option>
                        <option value="Approved">✅ Đã duyệt</option>
                        <option value="Rejected">❌ Bị từ chối</option>
                    </select>
                </div>
                {user?.role === 'Admin' && (
                    <div className="filter-item">
                        <label className="filter-label" style={{ color: '#8e44ad' }}>Lọc theo Đối tác:</label>
                        <select className="filter-input" value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)}>
                            <option value="ALL">🌟 Tất cả đối tác</option>
                            {partners.map(p => <option key={p._id} value={p._id}>{p.fullname}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {user?.role === 'Admin' && (
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input type="checkbox" onChange={handleSelectAll} checked={isAllSelected && filteredTours.length > 0} className="tour-checkbox" title="Chọn tất cả Tour hiển thị" />
                                </th>
                            )}
                            <th>Hình Ảnh</th>
                            <th>Mã Tour</th>
                            <th>Tên Tour</th>
                            {user?.role === 'Admin' && <th>Đối Tác Đăng</th>}
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTours.length === 0 ? (
                            <tr><td colSpan={user?.role === 'Admin' ? 7 : 6} style={{ textAlign: 'center', padding: '30px' }}>Không có Tour nào khớp với bộ lọc!</td></tr>
                        ) : (
                            filteredTours.map(tour => (
                                <tr key={tour._id} className={tour.status === 'Pending' ? 'row-pending' : tour.status === 'Rejected' ? 'row-rejected' : ''} style={{ background: tour.status === 'Pending' ? '#fffdf0' : tour.status === 'Rejected' ? '#fcf0f0' : 'transparent' }}>

                                    {user?.role === 'Admin' && (
                                        <td className="td-checkbox">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => handleSelectOne(e, tour._id)}
                                                checked={selectedTours.includes(tour._id)}
                                                className="tour-checkbox"
                                            />
                                        </td>
                                    )}

                                    <td>
                                        <img
                                            src={`${IMAGE_URL}${(tour.images && tour.images.length > 0) ? tour.images[0] : tour.image}`}
                                            alt={tour.name}
                                            className="tour-thumbnail"
                                        />
                                    </td>
                                    <td className="id-cell">{tour.code}</td>
                                    <td className="tour-row-name">{tour.name}</td>

                                    {user?.role === 'Admin' && (
                                        <td className="tour-row-creator">{tour.createdBy?.fullname || 'Ẩn danh'}</td>
                                    )}

                                    <td>
                                        <span className={`badge-status ${tour.status === 'Approved' ? 'badge-approved' : tour.status === 'Rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                                            {tour.status === 'Approved' ? '✅ Đã Duyệt' : tour.status === 'Rejected' ? '❌ Từ chối' : '⏳ Chờ Duyệt'}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="action-buttons-group">
                                            <button onClick={() => handleViewTourDetails(tour)} className="btn-icon btn-view" title="Xem chỗ trống & Chi tiết">👁️</button>

                                            {user?.role === 'Admin' && tour.status !== 'Approved' && (
                                                <button onClick={() => handleApproveTour(tour._id, 'Approved')} className="btn-icon btn-quick-approve" title="Duyệt nhanh">✅</button>
                                            )}
                                            {user?.role === 'Admin' && tour.status !== 'Rejected' && (
                                                <button onClick={() => handleApproveTour(tour._id, 'Rejected')} className="btn-icon btn-quick-reject" title="Từ chối nhanh">❌</button>
                                            )}

                                            {user?.role === 'Partner' && (
                                                <>
                                                    <Link to={`/admin/tours/edit/${tour._id}`} className="btn-partner-action btn-edit">✏️ Sửa</Link>
                                                    <button type="button" onClick={(e) => handleDelete(e, tour._id)} className="btn-partner-action btn-delete">🗑️ Xóa</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}