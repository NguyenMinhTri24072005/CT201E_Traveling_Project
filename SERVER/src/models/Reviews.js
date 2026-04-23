const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true }, // Chống spam: 1 Đơn hàng = 1 Đánh giá
    rating: { type: Number, required: true, min: 1, max: 5 }, // Chấm từ 1 đến 5 sao
    comment: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);