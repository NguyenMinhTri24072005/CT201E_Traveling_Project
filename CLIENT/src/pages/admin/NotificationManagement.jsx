import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Swal from 'sweetalert2';
import { FiSend, FiTrash2, FiEye, FiUsers } from 'react-icons/fi';
import './AdminStyles.css';
import './NotificationManagement.css'; 

export default function NotificationManagement() {
    const [broadcast, setBroadcast] = useState({ targetRole: 'All', title: '', message: '', link: '' });
    const [history, setHistory] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const res = await axiosClient.get('/notifications/broadcast-history');
            setHistory(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Lỗi lấy lịch sử thông báo:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        const confirm = await Swal.fire({
            title: 'Xác nhận Phát thanh?',
            text: `Thông báo này sẽ được gửi tới nhóm: ${broadcast.targetRole === 'All' ? 'Tất cả mọi người' : broadcast.targetRole === 'Partner' ? 'Tất cả Đối tác' : 'Khách hàng'}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e31837',
            confirmButtonText: '🚀 Gửi ngay'
        });

        if (confirm.isConfirmed) {
            setIsSending(true);
            try {
                const res = await axiosClient.post('/notifications/broadcast', broadcast);
                Swal.fire('Thành công!', res.data.message, 'success');
                setBroadcast({ targetRole: 'All', title: '', message: '', link: '' });
                fetchHistory();
            } catch (error) {
                Swal.fire('Lỗi', error.response?.data?.message || 'Không thể gửi thông báo', 'error');
            } finally {
                setIsSending(false);
            }
        }
    };

    const handleRecall = async (item) => {
        const confirm = await Swal.fire({
            title: 'Thu hồi thông báo?',
            text: `Bạn sẽ thu hồi thông báo "${item._id.title}" khỏi hộp thư của ${item.recipientCount} người. Những ai chưa đọc sẽ không thấy nữa.`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            confirmButtonText: 'Thu hồi'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await axiosClient.post('/notifications/recall', {
                    title: item._id.title,
                    message: item._id.message
                });
                Swal.fire('Đã thu hồi!', res.data.message, 'success');
                fetchHistory();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể thu hồi thông báo', 'error');
            }
        }
    };

    return (
        <div className="admin-page fade-in">
            <h2 className="admin-title">📢 Quản Lý & Phát Thanh Thông Báo</h2>

            <div className="notification-container">
                
                <div className="broadcast-station">
                    <h3 className="broadcast-title">
                        <FiSend /> Soạn Thông Báo Mới
                    </h3>
                    
                    <form onSubmit={handleSendBroadcast}>
                        <div className="broadcast-form-group">
                            <label className="broadcast-label">1. Gửi tới Nhóm:</label>
                            <select 
                                value={broadcast.targetRole} 
                                onChange={(e) => setBroadcast({...broadcast, targetRole: e.target.value})}
                                className="broadcast-input"
                            >
                                <option value="All">🌟 Tất cả mọi người (Sàn)</option>
                                <option value="Partner">🤝 Chỉ Đối tác (Partner)</option>
                                <option value="Customer">🎒 Chỉ Khách du lịch (Customer)</option>
                            </select>
                        </div>

                        <div className="broadcast-form-group">
                            <label className="broadcast-label">2. Tiêu đề:</label>
                            <input 
                                type="text" required placeholder="VD: Khuyến mãi lễ 30/4" 
                                value={broadcast.title} onChange={(e) => setBroadcast({...broadcast, title: e.target.value})}
                                className="broadcast-input"
                            />
                        </div>

                        <div className="broadcast-form-group">
                            <label className="broadcast-label">3. Nội dung thông báo:</label>
                            <textarea 
                                required placeholder="Nhập nội dung chi tiết..." rows="4"
                                value={broadcast.message} onChange={(e) => setBroadcast({...broadcast, message: e.target.value})}
                                className="broadcast-input broadcast-textarea"
                            />
                        </div>

                        <div className="broadcast-form-group" style={{ marginBottom: '20px' }}>
                            <label className="broadcast-label">4. Link đính kèm (Tùy chọn):</label>
                            <input 
                                type="text" placeholder="VD: /tours" 
                                value={broadcast.link} onChange={(e) => setBroadcast({...broadcast, link: e.target.value})}
                                className="broadcast-input"
                            />
                        </div>

                        <button type="submit" disabled={isSending} className="btn-broadcast-send">
                            {isSending ? 'Đang gửi...' : '🚀 Bắn Thông Báo'}
                        </button>
                    </form>
                </div>

                <div className="history-station">
                    <div className="history-card">
                        <h3 className="history-title">🕒 Lịch sử đã phát thanh</h3>
                        
                        {loading ? <p>Đang tải dữ liệu...</p> : history.length === 0 ? (
                            <div className="history-empty">Chưa có thông báo nào được gửi đi.</div>
                        ) : (
                            <div className="history-list">
                                {history.map((item, index) => (
                                    <div key={index} className="history-item">
                                        <div className="history-content">
                                            <h4 className="history-item-title">{item._id.title}</h4>
                                            <p className="history-item-desc">{item._id.message}</p>
                                            
                                            <div className="history-meta">
                                                <span><FiUsers /> Gửi đến: <strong>{item.recipientCount} người</strong></span>
                                                <span className="history-meta-read"><FiEye /> Đã đọc: <strong>{item.readCount} người</strong></span>
                                                <span>⏱️ {new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => handleRecall(item)} className="btn-recall">
                                            <FiTrash2 /> Thu hồi
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}