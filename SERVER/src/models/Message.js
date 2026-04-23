const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Người gửi
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Người nhận
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Nội dung tin nhắn
    text: { type: String, required: true },
    // Trạng thái đã xem
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);