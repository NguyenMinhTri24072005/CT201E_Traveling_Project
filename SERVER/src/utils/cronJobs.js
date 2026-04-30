const cron = require("node-cron");
const Booking = require("../models/Booking");
const Tour = require("../models/Tours");
const startCronJobs = () => {
  console.log("⏳ Hệ thống Auto-Cancel Đơn hàng đã được kích hoạt...");
  cron.schedule("* * * * *", async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredBookings = await Booking.find({
        status: "pending_payment",
        createdAt: { $lt: thirtyMinutesAgo },
      });
      if (expiredBookings.length > 0) {
        console.log(
          `\n🧹 Phát hiện ${expiredBookings.length} đơn hàng quá hạn thanh toán. Đang tiến hành hủy...`,
        );
        for (const booking of expiredBookings) {
          booking.status = "payment_failed";
          await booking.save();
          const tour = await Tour.findById(booking.tour);
          if (tour) {
            const departure = tour.departures.id(booking.departureId);
            if (departure) {
              departure.availableslots += booking.totalTickets;
              await tour.save();
              console.log(
                `✅ Đã hoàn lại ${booking.totalTickets} vé cho Tour: ${tour.name}`,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Lỗi khi chạy Tác vụ dọn dẹp đơn hàng:", error);
    }
  });
};
module.exports = startCronJobs;
