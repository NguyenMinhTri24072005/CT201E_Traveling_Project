const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Người nhận thông báo (Bắt buộc)
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Người gửi (Có thể null nếu là thông báo tự động từ Hệ thống)
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    // Phân loại để frontend hiện icon cho đẹp (VD: 🛒 Đơn hàng, 📢 Hệ thống...)
    type: { 
        type: String, 
        enum: ['system', 'booking', 'tour', 'review'], 
        default: 'system' 
    },
    
    isRead: { type: Boolean, default: false },
    
    // Đường link để khi click vào thông báo sẽ chuyển hướng (VD: /admin/bookings)
    link: { type: String, default: '' }

}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);