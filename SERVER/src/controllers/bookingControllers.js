const Booking = require('../models/Booking.js');
const Tour = require('../models/Tours.js');
const User = require('../models/Users.js');

const bookingControllers = {
    // 1. Khách hàng đặt tour (Tự động trích xuất % Hoa hồng Sàn)
    createBooking: async (req, res) => {
        try {
            const { tourId, departureId, tickets, representative, passengers, paymentMethod, notes, isPaidNow } = req.body;
            const customerId = req.user.id;

            const tour = await Tour.findById(tourId);
            if (!tour) return res.status(404).json({ success: false, message: 'Không tìm thấy Tour' });

            const departure = tour.departures.id(departureId);
            if (!departure) return res.status(404).json({ success: false, message: 'Không tìm thấy ngày khởi hành' });

            const totalTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);

            if (departure.availableslots < totalTickets) {
                return res.status(400).json({ success: false, message: `Chỉ còn ${departure.availableslots} chỗ trống.` });
            }

            let secureTotalPrice = 0; // ĐÂY LÀ BIẾN ĐÚNG
            const secureTickets = tickets.map(ticket => {
                let actualPrice = 0;
                if (ticket.ticketType === 'Người lớn') actualPrice = departure.adultPrice;
                else if (ticket.ticketType === 'Trẻ em') actualPrice = departure.childPrice;
                else if (ticket.ticketType === 'Em bé') actualPrice = departure.babyPrice;

                secureTotalPrice += (ticket.quantity * actualPrice);

                return {
                    ticketType: ticket.ticketType,
                    quantity: ticket.quantity,
                    unitPrice: actualPrice
                };
            });

            // 👉 THUẬT TOÁN KẾ TOÁN MỚI: Tính % Hoa hồng dựa vào Uy tín của Partner
            // 1. Populate thông tin người tạo Tour (Partner)
            const tourInfo = await Tour.findById(tourId).populate('createdBy', 'commissionRate');

            // 2. Lấy tỷ lệ chiết khấu của Partner đó (Nếu lỗi thì mặc định thu 10%)
            const rate = tourInfo?.createdBy?.commissionRate ?? 10;

            // 3. Chốt sổ kế toán (👉 ĐÃ SỬA: Đổi totalPrice thành secureTotalPrice)
            const adminCommission = (secureTotalPrice * rate) / 100;
            const partnerRevenue = secureTotalPrice - adminCommission;

            // Tạo hóa đơn
            const newBooking = new Booking({
                customer: customerId,
                tour: tourId,
                departureId,
                tickets: secureTickets,
                representative,
                passengers: passengers || [],
                totalTickets,
                paymentMethod: paymentMethod || 'Chuyển khoản',
                notes,
                status: isPaidNow ? 'payment_verifying' : 'pending_payment',
                totalprice: secureTotalPrice, // 👉 ĐÃ SỬA: Viết chữ p thường để khớp với Database & File thống kê
                adminCommission: adminCommission,
                partnerRevenue: partnerRevenue
            });
            
            const savedBooking = await newBooking.save();
            departure.availableslots -= totalTickets;
            await tour.save();
            res.status(201).json({ success: true, message: 'Tạo đơn thành công!', booking: savedBooking });
        } catch (error) {
            // 👉 ĐÃ SỬA: Thêm console.error để nếu có lỗi, Terminal sẽ gào lên cho em biết
            console.error('❌ Lỗi tại createBooking:', error); 
            res.status(500).json({ success: false, message: 'Lỗi đặt tour', error: error.message });
        }
    },

    // 2. Dành cho Admin (Giữ nguyên)
    getAllBookings: async (req, res) => {
        try {
            const bookings = await Booking.find()
                .populate({
                    path: 'tour',
                    populate: { path: 'partner createdBy', select: 'fullname email commissionRate' }
                })
                .populate('customer', 'fullname email phone')
                .sort({ createdAt: -1 });
            res.status(200).json(bookings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. Dành cho Partner (Giữ nguyên)
    getPartnerBookings: async (req, res) => {
        try {
            const partnerId = req.user.id;
            const tours = await Tour.find({ $or: [{ createdBy: partnerId }, { partner: partnerId }] });
            const tourIds = tours.map(t => t._id);

            const bookings = await Booking.find({ tour: { $in: tourIds } })
                .populate({
                    path: 'tour',
                    populate: { path: 'partner createdBy', select: 'fullname email commissionRate' }
                })
                .populate('customer', 'fullname email phone')
                .sort({ createdAt: -1 });

            res.status(200).json(bookings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Khách hàng xem lịch sử đặt tour
    getBookingsByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const bookings = await Booking.find({ customer: userId })
                .populate('tour')
                .sort({ createdAt: -1 });
            res.status(200).json(bookings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. Cập nhật trạng thái đơn hàng (Duyệt/Hủy)
    updateBookingStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const booking = await Booking.findById(id).populate('tour', 'name departures');
            if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });

            if ((status === 'cancelled' || status === 'payment_failed') &&
                booking.status !== 'cancelled' && booking.status !== 'payment_failed') {

                const tour = await Tour.findById(booking.tour._id);
                if (tour) {
                    const departure = tour.departures.id(booking.departureId);
                    if (departure) {
                        departure.availableslots += booking.totalTickets;
                        await tour.save();
                    }
                }
            }

            booking.status = status;
            const updatedBooking = await booking.save();

            res.status(200).json({ message: "Đã cập nhật trạng thái", data: updatedBooking });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 6. Khách hàng tự hủy đơn
    cancelBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const customerId = req.user.id;

            const booking = await Booking.findById(bookingId);
            if (!booking) return res.status(404).json("Không tìm thấy đơn hàng!");

            if (booking.customer.toString() !== customerId) {
                return res.status(403).json("Bạn không có quyền hủy đơn này!");
            }

            if (booking.status !== 'pending_payment') {
                return res.status(400).json("Đơn hàng đã được xử lý hoặc thanh toán, không thể tự hủy.");
            }

            booking.status = 'cancelled';
            await booking.save();

            const tour = await Tour.findById(booking.tour);
            if (tour) {
                const departure = tour.departures.id(booking.departureId);
                if (departure) {
                    departure.availableslots += booking.totalTickets;
                    await tour.save();
                }
            }

            res.status(200).json({ message: "Đã hủy đơn thành công!", data: booking });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 7. Xóa vĩnh viễn đơn hàng
    deleteBooking: async (req, res) => {
        try {
            const booking = await Booking.findById(req.params.id);
            if (!booking) return res.status(404).json("Không tìm thấy đơn hàng");

            await Booking.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Đã xóa đơn hàng thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 8. Xác nhận đã chuyển khoản
    confirmPayment: async (req, res) => {
        try {
            const { id } = req.params;
            const booking = await Booking.findById(id);
            if (!booking) return res.status(404).json("Không tìm thấy đơn hàng!");

            booking.status = 'payment_verifying';
            await booking.save();
            res.status(200).json({ message: "Đã gửi thông báo!", data: booking });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // [ADMIN] LẤY THỐNG KÊ (CÓ BỘ LỌC)
    // ==========================================
    // ==========================================
    // [PARTNER] LẤY THỐNG KÊ (CÓ BỘ LỌC)
    // ==========================================
    getPartnerStats: async (req, res) => {
        try {
            const partnerId = req.user.id;
            const { startDate, endDate, tourId } = req.query;
            const mongoose = require('mongoose');

            // Lấy thông tin Partner để biết % Hoa hồng (Mặc định 10%)
            const User = require('../models/Users');
            const partner = await User.findById(partnerId);
            const commissionRate = partner?.commissionRate || 10;

            let dateFilter = {};
            if (startDate && endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt = { $gte: new Date(startDate), $lte: end };
            }

            let pipeline = [
                { $match: { status: { $in: ['paid', 'confirmed', 'completed'] }, ...dateFilter } },
                { $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tourData' } },
                { $unwind: '$tourData' },
                { $match: { 'tourData.createdBy': new mongoose.Types.ObjectId(partnerId) } }
            ];

            if (tourId && tourId !== 'All') {
                pipeline.push({ $match: { 'tourData._id': new mongoose.Types.ObjectId(tourId) } });
            }

            let groupPipeline = [...pipeline, {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalprice' },
                    netIncome: {
                        $sum: { $subtract: ['$totalprice', { $multiply: ['$totalprice', commissionRate / 100] }] }
                    },
                    totalBookings: { $sum: 1 }
                }
            }];

            const statsResult = await Booking.aggregate(groupPipeline);
            const totals = statsResult[0] || { totalRevenue: 0, netIncome: 0, totalBookings: 0 };

            let chartPipeline = [
                ...pipeline,
                {
                    $group: {
                        _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
                        revenue: { $sum: '$totalprice' },
                        netIncome: {
                            $sum: { $subtract: ['$totalprice', { $multiply: ['$totalprice', commissionRate / 100] }] }
                        }
                    }
                },
                { $sort: { '_id': 1 } }
            ];

            const chartDataRaw = await Booking.aggregate(chartPipeline);
            const chartData = chartDataRaw.map(item => ({
                name: item._id,
                revenue: item.revenue,
                netIncome: item.netIncome
            }));

            const Tour = require('../models/Tours');
            const totalTours = await Tour.countDocuments({ createdBy: partnerId });

            res.status(200).json({
                totalRevenue: totals.totalRevenue,
                netIncome: totals.netIncome,
                totalBookings: totals.totalBookings,
                totalTours,
                chartData
            });

        } catch (error) {
            console.error("Lỗi getPartnerStats:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // [ADMIN] LẤY THỐNG KÊ (CÓ BỘ LỌC)
    // ==========================================
    getAdminStats: async (req, res) => {
        try {
            const { startDate, endDate, partnerId } = req.query;
            const mongoose = require('mongoose');

            let dateFilter = {};
            if (startDate && endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt = { $gte: new Date(startDate), $lte: end };
            }

            let matchStage = { status: { $in: ['paid', 'confirmed', 'completed'] }, ...dateFilter };

            let pipeline = [
                { $match: matchStage },
                { $lookup: { from: 'tours', localField: 'tour', foreignField: '_id', as: 'tourData' } },
                { $unwind: '$tourData' },
                { $lookup: { from: 'users', localField: 'tourData.createdBy', foreignField: '_id', as: 'partnerData' } },
                { $unwind: { path: '$partnerData', preserveNullAndEmptyArrays: true } }
            ];

            if (partnerId && partnerId !== 'All') {
                pipeline.push({ $match: { 'tourData.createdBy': new mongoose.Types.ObjectId(partnerId) } });
            }

            // 👉 ĐÃ SỬA: Đổi $totalPrice thành $totalprice (chữ p thường)
            let groupPipeline = [...pipeline, {
                $group: {
                    _id: null,
                    totalSystemRevenue: { $sum: '$totalprice' },
                    totalAdminProfit: {
                        $sum: {
                            $multiply: ['$totalprice', { $divide: [{ $ifNull: ['$partnerData.commissionRate', 10] }, 100] }]
                        }
                    },
                    successfulBookings: { $sum: 1 }
                }
            }];

            const statsResult = await Booking.aggregate(groupPipeline);
            const totals = statsResult[0] || { totalSystemRevenue: 0, totalAdminProfit: 0, successfulBookings: 0 };

            let chartPipeline = [
                ...pipeline,
                {
                    $group: {
                        _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
                        revenue: { $sum: '$totalprice' },
                        profit: {
                            $sum: { $multiply: ['$totalprice', { $divide: [{ $ifNull: ['$partnerData.commissionRate', 10] }, 100] }] }
                        }
                    }
                },
                { $sort: { '_id': 1 } }
            ];

            const chartDataRaw = await Booking.aggregate(chartPipeline);
            const chartData = chartDataRaw.map(item => ({
                name: item._id,
                revenue: item.revenue,
                profit: item.profit
            }));

            const User = require('../models/Users');
            const Tour = require('../models/Tours');
            const totalUsers = await User.countDocuments();
            const totalTours = await Tour.countDocuments();

            res.status(200).json({
                totalSystemRevenue: totals.totalSystemRevenue,
                totalAdminProfit: totals.totalAdminProfit,
                successfulBookings: totals.successfulBookings,
                totalUsers,
                totalTours,
                chartData
            });

        } catch (error) {
            console.error("Lỗi getAdminStats:", error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = bookingControllers;