// SERVER/src/models/Tours.js
const mongoose = require('mongoose')

const tourSchema = new mongoose.Schema({
    // 1. Thông tin cơ bản
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // VD: NDO-HAN-SAPA-001
    duration: { type: String, required: true }, // VD: "3 Ngày 2 Đêm"
    departureLocation: { type: String, required: true }, // Nơi khởi hành (VD: "Hà Nội")
    
    // 2. Hình ảnh
    images: {
        type: [String], // Mảng các chuỗi URL
        required: true,
        default: []
    },
    gallery: [String], 

    // 3. Phân loại & Đối tác
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    // 4. Nội dung chi tiết
    highlights: [String], // Mảng chứa các điểm nhấn
    itinerary: [{         // Mảng chứa lịch trình từng ngày
        day: String,
        meals: String,
        content: String,
        image: String
    }],

    // 5. Lịch khởi hành & Giá
    departures: [{
        date: String,           // VD: "15/03/2026"
        returnDate: String,     // VD: "17/03/2026"
        dayOfWeek: String,      // VD: "Chủ Nhật"
        transport: String,      // VD: "Limousine"
        adultPrice: Number,
        childPrice: Number,
        babyPrice: Number,
        surcharge: { type: Number, default: 0 },
        maxslots: { type: Number, default: 20 },
        availableslots: { type: Number, default: 20 }
    }],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'], // Các trạng thái hợp lệ
        default: 'Pending' // Mặc định là 'Pending' khi Partner vừa tạo Tour
    },
    rejectReason: { 
        type: String, // Lý do từ chối (nếu Admin chọn 'Rejected')
        default: '' 
    },
    averageRating: { type: Number, default: 0 }, // Điểm sao trung bình (VD: 4.8)
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model('Tour', tourSchema)