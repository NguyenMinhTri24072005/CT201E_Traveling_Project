// SERVER/src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    
    // [QUAN TRỌNG] Lưu ID ngày khởi hành khách chọn
    departureId: { type: mongoose.Schema.Types.ObjectId, required: true },
    bookingDate: { type: Date, default: Date.now },

    // Phân tách tiền bạc rõ ràng
    totalprice: { type: Number, required: true },        // Tổng tiền khách trả
    adminCommission: { type: Number, default: 0 },       // Hoa hồng Admin
    partnerRevenue: { type: Number, default: 0 },        // Thực nhận Partner

    status: {
        type: String,
        // Đã bổ sung payment_verifying
        enum: ['pending_payment', 'payment_verifying', 'paid', 'confirmed', 'completed', 'cancelled', 'payment_failed'],
        default: 'pending_payment'
    },
    
    // [YÊU CẦU] Thời hạn thanh toán (24h)
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000)
    },

    paymentMethod: {
        type: String,
        enum: ['VNPAY', 'MOMO', 'BANK_TRANSFER'],
        default: 'BANK_TRANSFER'
    },
    notes: { type: String },

    tickets: [{
        ticketType: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true }
    }],
    totalTickets: { type: Number, required: true, min: 1 },

    // [YÊU CẦU] Người đại diện (Bắt buộc)
    representative: {
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        cccd: { type: String, required: true, trim: true } 
    },
    
    // [YÊU CẦU] Người đi cùng (Tùy chọn)
    passengers: [{
        fullName: { type: String, trim: true },
        passengerType: {
            type: String,
            enum: ['Người lớn', 'Trẻ em', 'Em bé'],
            default: 'Người lớn'
        },
        cccd_or_birthyear: { type: String, trim: true } 
    }],
    isReviewed: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);