// SERVER/src/utils/cronJobs.js
const cron = require('node-cron');
const Booking = require('../models/Booking');
const Tour = require('../models/Tours');

// Hàm thiết lập tự động hóa
const startCronJobs = () => {
    console.log('⏳ Hệ thống Auto-Cancel Đơn hàng đã được kích hoạt...');

    // Cấu hình: '* * * * *' nghĩa là chạy mỗi phút 1 lần
    cron.schedule('* * * * *', async () => {
        try {
            // Tính toán mốc thời gian: Hiện tại trừ đi 30 phút
            // 👉 LỜI KHUYÊN: Lúc test em có thể đổi số 30 thành số 1 (1 phút) để xem kết quả nhanh hơn
            const thirtyMinutesAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // 1. Tìm các đơn hàng đang "Chờ thanh toán" và ĐÃ QUÁ HẠN
            const expiredBookings = await Booking.find({
                status: 'pending_payment',
                createdAt: { $lt: thirtyMinutesAgo } // $lt: less than (nhỏ hơn/trước thời điểm đó)
            });

            if (expiredBookings.length > 0) {
                console.log(`\n🧹 Phát hiện ${expiredBookings.length} đơn hàng quá hạn thanh toán. Đang tiến hành hủy...`);

                for (const booking of expiredBookings) {
                    // 2. Đổi trạng thái thành Lỗi thanh toán (hoặc Đã hủy)
                    booking.status = 'payment_failed';
                    await booking.save();

                    // 3. Quan trọng nhất: TRẢ LẠI VÉ CHO NHÀ XE (Hoàn availableslots)
                    const tour = await Tour.findById(booking.tour);
                    if (tour) {
                        const departure = tour.departures.id(booking.departureId);
                        if (departure) {
                            departure.availableslots += booking.totalTickets;
                            await tour.save();
                            console.log(`✅ Đã hoàn lại ${booking.totalTickets} vé cho Tour: ${tour.name}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Lỗi khi chạy Tác vụ dọn dẹp đơn hàng:', error);
        }
    });
};

module.exports = startCronJobs;