require('dotenv').config(); // Cần dotenv để lấy chuỗi kết nối DB
const mongoose = require('mongoose');
const Tour = require('../models/Tours'); // Sửa đường dẫn, bỏ .js
const { generateEmbedding } = require('./rag/embeddingService'); // Import CommonJS

const embedAllTours = async () => {
    try {
        console.log("⏳ Đang kết nối đến MongoDB...");
        // Bắt buộc phải kết nối DB trước khi thao tác
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/CT201E_Traveling");
        console.log("✅ Kết nối DB thành công! Bắt đầu tạo Vector...");

        const tours = await Tour.find({});
        for (let tour of tours) {
            const textToEmbed = `${tour.name}. Điểm đến: ${tour.destination}. Lịch trình: ${JSON.stringify(tour.itinerary)}`;
            
            tour.embeddingVector = await generateEmbedding(textToEmbed);
            await tour.save();
            console.log(`Đã tạo Vector xong cho tour: ${tour.name}`);
        }
        console.log("🎉 HOÀN TẤT NẠP VECTOR VÀO LOCAL MONGODB!");
        process.exit(0); // Chạy xong tự động thoát script
    } catch (error) {
        console.error("❌ Lỗi trong quá trình chạy:", error);
        process.exit(1);
    }
};

// Gọi hàm thực thi
embedAllTours();