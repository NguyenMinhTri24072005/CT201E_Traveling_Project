const Review = require('../models/Reviews');
const Tour = require('../models/Tours');
const Booking = require('../models/Booking');

const reviewControllers = {
    // 1. Khách hàng gửi Đánh giá mới
    createReview: async (req, res) => {
        try {
            const { tourId, bookingId, rating, comment } = req.body;
            const userId = req.user.id;

            // Rào chắn 1: Kiểm tra xem các trường bắt buộc đã được gửi lên chưa
            if (!tourId || !bookingId || !rating || !comment) {
                return res.status(400).json({ message: "Vui lòng cung cấp đủ thông tin đánh giá!" });
            }

            // Rào chắn 2: Tìm Booking mà không cần quan tâm đến status (để check lỗi cụ thể)
            const booking = await Booking.findOne({ _id: bookingId, customer: userId });
            
            if (!booking) {
                return res.status(404).json({ message: "Không tìm thấy Đơn hàng của bạn!" });
            }

            // Ép kiểu chữ thường (lowercase) để so sánh trạng thái an toàn
            const currentStatus = (booking.status || '').toLowerCase();
            console.log(currentStatus)
            if (currentStatus !== 'completed') {
                return res.status(400).json({ message: `Bạn chỉ có thể đánh giá khi đơn hàng đã Hoàn thành (Hiện tại: ${booking.status})` });
            }

            // Rào chắn 3: Chống Spam đánh giá 2 lần
            const existingReview = await Review.findOne({ booking: bookingId });
            if (existingReview) {
                return res.status(400).json({ message: "Bạn đã đánh giá chuyến đi này rồi!" });
            }

            // Lưu Đánh giá
            const newReview = new Review({ 
                user: userId, 
                tour: tourId, 
                booking: bookingId, 
                rating: Number(rating), 
                comment 
            });
            await newReview.save();

            // Đánh dấu Booking là Đã Review
            await Booking.findByIdAndUpdate(bookingId, { isReviewed: true });

            // Cập nhật lại Sao vàng cho Tour
            const reviews = await Review.find({ tour: tourId });
            const totalReviews = reviews.length;
            const sumRating = reviews.reduce((acc, item) => acc + item.rating, 0);
            const averageRating = sumRating / totalReviews;

            await Tour.findByIdAndUpdate(tourId, {
                totalReviews,
                averageRating: parseFloat(averageRating.toFixed(1))
            });

            res.status(200).json({ message: "Cảm ơn bạn đã đánh giá!", review: newReview });
        } catch (error) {
            console.error("LỖI CREATE REVIEW:", error);
            res.status(500).json({ message: "Lỗi máy chủ nội bộ!", error: error.message });
        }
    },
    // 4. Chỉnh sửa đánh giá đã gửi
    updateReview: async (req, res) => {
        try {
            const { rating, comment } = req.body;
            const reviewId = req.params.id;
            const userId = req.user.id;

            // Tìm review và kiểm tra quyền sở hữu
            const review = await Review.findOne({ _id: reviewId, user: userId });
            if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá hoặc bạn không có quyền sửa!" });

            // Cập nhật thông tin mới
            review.rating = Number(rating);
            review.comment = comment;
            await review.save();

            // THUẬT TOÁN: Tính toán lại điểm trung bình cho Tour (Quan trọng!)
            const tourId = review.tour;
            const reviews = await Review.find({ tour: tourId });
            const totalReviews = reviews.length;
            const sumRating = reviews.reduce((acc, item) => acc + item.rating, 0);
            const averageRating = sumRating / totalReviews;

            await Tour.findByIdAndUpdate(tourId, {
                totalReviews,
                averageRating: parseFloat(averageRating.toFixed(1))
            });

            res.status(200).json({ message: "Cập nhật đánh giá thành công!", review });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getTourReviews: async (req, res) => {
        try {
            const reviews = await Review.find({ tour: req.params.tourId })
                .populate('user', 'fullname avatar') 
                .sort({ createdAt: -1 }); 
            res.status(200).json(reviews);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getReviewByBooking: async (req, res) => {
        try {
            const review = await Review.findOne({ booking: req.params.bookingId });
            if (!review) return res.status(404).json({ message: "Chưa có đánh giá!" });
            res.status(200).json(review);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reviewControllers;