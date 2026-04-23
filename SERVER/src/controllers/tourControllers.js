const Tour = require('../models/Tours.js');
const fs = require('fs'); // 👉 THƯ VIỆN XỬ LÝ FILE CỦA NODE.JS
const path = require('path');

const tourControllers = {
    // 1. Lấy danh sách tất cả các tour (Có Lọc & Phân trang chuẩn Server-side)
    getAllTours: async (req, res) => {
        try {
            // Nhận các tham số (query params) từ URL do Frontend gửi lên
            const {
                page = 1,
                limit = 9,
                search = '',
                minPrice,
                maxPrice,
                destination
            } = req.query;

            // Khởi tạo Object Query rỗng để nhét điều kiện vào dần
            const query = { status: 'Approved' };
            const Location = require('../models/Locations.js');

            // 👉 BƯỚC 1: Tìm ID địa điểm nếu có từ khóa search
            let searchLocIds = [];
            if (search) {
                const searchLocs = await Location.find({ name: { $regex: search, $options: 'i' } });
                searchLocIds = searchLocs.map(loc => loc._id);
            }

            // 👉 BƯỚC 2: Lọc theo Điểm đến từ Dropdown (Ví dụ: Khách chọn "Sapa")
            if (destination && destination !== 'ALL') {
                const destLocs = await Location.find({ name: { $regex: destination, $options: 'i' } });
                const destIds = destLocs.map(loc => loc._id);

                if (search) {
                    // Nếu khách VỪA NHẬP ô tìm kiếm VỪA CHỌN dropdown
                    query.$and = [
                        { location: { $in: destIds } }, // Bắt buộc phải thuộc Dropdown
                        {
                            $or: [
                                { name: { $regex: search, $options: 'i' } }, // Tên tour có chứa từ khóa
                                { location: { $in: searchLocIds } }          // Hoặc tên địa điểm có chứa từ khóa
                            ]
                        }
                    ];
                } else {
                    // Nếu khách CHỈ CHỌN Dropdown
                    query.location = { $in: destIds };
                }
            }
            // 👉 BƯỚC 3: Nếu khách CHỈ NHẬP ô tìm kiếm (Không chọn Dropdown)
            else if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { location: { $in: searchLocIds } }
                ];
            }

            // 👉 BƯỚC 4: Lọc theo Khoảng giá (Tìm vào mảng departures -> adultPrice)
            if (minPrice || maxPrice) {
                let priceCondition = {};
                if (minPrice) priceCondition.$gte = parseInt(minPrice);
                if (maxPrice) priceCondition.$lte = parseInt(maxPrice);

                // $elemMatch: Tìm xem có ÍT NHẤT 1 lịch khởi hành nào có giá lọt vào khoảng này không
                query.departures = { $elemMatch: { adultPrice: priceCondition } };
            }

            // Thực thi Query truy vấn vào Database
            const tours = await Tour.find(query)
                .populate('category', 'name')
                .populate('location', 'name')
                .populate('partner', 'fullname email')
                .populate('createdBy', 'fullname email shopName')
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit));

            const total = await Tour.countDocuments(query);

            res.status(200).json({
                tours,
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
                currentPage: parseInt(page)
            });
        } catch (error) {
            console.error("Lỗi get tours:", error);
            res.status(500).json({ error: error.message });
        }
    },
    // 2. LẤY CHI TIẾT 1 TOUR
    getTourById: async (req, res) => {
        try {
            const tour = await Tour.findById(req.params.id);
            if (!tour) return res.status(404).json("Không tìm thấy tour!");
            res.status(200).json(tour);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. TẠO TOUR MỚI
    // 2. TẠO TOUR MỚI
    createTour: async (req, res) => {
        try {
            const tourData = req.body;

            // 1. Giải mã các trường JSON từ chuỗi sang Array/Object
            if (typeof tourData.departures === 'string') tourData.departures = JSON.parse(tourData.departures);
            if (typeof tourData.highlights === 'string') tourData.highlights = JSON.parse(tourData.highlights);
            if (typeof tourData.itinerary === 'string') tourData.itinerary = JSON.parse(tourData.itinerary);

            // 👉 2. XỬ LÝ ẢNH GALLERY CHÍNH (Trường 'images')
            let imageUrls = ["default-tour.jpg"];
            if (req.files && req.files['images'] && req.files['images'].length > 0) {
                imageUrls = req.files['images'].map(file => `/uploads/tours/${file.filename}`);
            }

            // 👉 3. XỬ LÝ ẢNH LỊCH TRÌNH (Trường 'itineraryImages')
            if (req.files && req.files['itineraryImages'] && req.files['itineraryImages'].length > 0) {
                const itinFiles = req.files['itineraryImages'];
                const imageMap = JSON.parse(req.body.itineraryImageMap || "[]");

                imageMap.forEach((itinIndex, arrayIndex) => {
                    // Gán đường dẫn ảnh vào đúng index của ngày trong mảng itinerary
                    if (tourData.itinerary[itinIndex]) {
                        tourData.itinerary[itinIndex].image = `/uploads/tours/${itinFiles[arrayIndex].filename}`;
                    }
                });
            }

            // 4. Xác định người tạo và trạng thái duyệt
            const User = require('../models/Users');
            const creator = await User.findById(req.user.id);
            const initialStatus = creator.isTrusted ? 'Approved' : 'Pending';

            // 5. Tạo Object Tour mới
            const newTour = new Tour({
                ...tourData,
                partner: req.user.id,
                createdBy: req.user.id,
                images: imageUrls, // Lưu mảng ảnh gallery
                status: initialStatus
            });

            const savedTour = await newTour.save();
            res.status(201).json(savedTour);
        } catch (error) {
            console.error("LỖI TẠO TOUR: ", error);
            res.status(500).json({ error: error.message });
        }
    },

    // 3. CẬP NHẬT TOUR
    updateTour: async (req, res) => {
        try {
            const { id } = req.params;
            const tourData = req.body;

            // 1. Giải mã dữ liệu JSON
            if (typeof tourData.departures === 'string') tourData.departures = JSON.parse(tourData.departures);
            if (typeof tourData.highlights === 'string') tourData.highlights = JSON.parse(tourData.highlights);
            if (typeof tourData.itinerary === 'string') tourData.itinerary = JSON.parse(tourData.itinerary);

            const oldTour = await Tour.findById(id);
            if (!oldTour) return res.status(404).json("Không tìm thấy tour!");

            // 👉 2. XỬ LÝ ẢNH GALLERY CHÍNH
            if (req.files && req.files['images'] && req.files['images'].length > 0) {
                tourData.images = req.files['images'].map(file => `/uploads/tours/${file.filename}`);
                tourData.image = ""; // Xóa trường ảnh đơn cũ

                // Xóa file ảnh cũ khỏi server để tránh nặng máy
                if (oldTour.images && Array.isArray(oldTour.images)) {
                    oldTour.images.forEach(img => {
                        if (typeof img === 'string' && !img.includes('default')) {
                            const oldImagePath = path.join(__dirname, '../../', img);
                            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
                        }
                    });
                }
            }

            // 👉 3. XỬ LÝ ẢNH LỊCH TRÌNH
            if (req.files && req.files['itineraryImages'] && req.files['itineraryImages'].length > 0) {
                const itinFiles = req.files['itineraryImages'];
                const imageMap = JSON.parse(req.body.itineraryImageMap || "[]");

                imageMap.forEach((itinIndex, arrayIndex) => {
                    if (tourData.itinerary[itinIndex]) {
                        tourData.itinerary[itinIndex].image = `/uploads/tours/${itinFiles[arrayIndex].filename}`;
                    }
                });
            }

            const updatedTour = await Tour.findByIdAndUpdate(id, tourData, { new: true });
            res.status(200).json(updatedTour);
        } catch (error) {
            console.error("LỖI CẬP NHẬT TOUR: ", error);
            res.status(500).json({ error: error.message });
        }
    },

    // 5. XÓA TOUR (ĐÃ SỬA LỖI STORAGE LEAK)
    deleteTour: async (req, res) => {
        try {
            const { id } = req.params;
            const tour = await Tour.findById(id);

            if (!tour) {
                return res.status(404).json("Không tìm thấy tour!");
            }

            // 👉 SỬA LẠI: Xóa toàn bộ mảng ảnh trong ổ cứng
            if (tour.images && tour.images.length > 0) {
                tour.images.forEach(img => {
                    if (!img.includes('default')) {
                        const imagePath = path.join(__dirname, '../../', img);
                        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                    }
                });
            }

            await Tour.findByIdAndDelete(id);
            res.status(200).json("Đã xóa tour và dọn dẹp ảnh thành công!");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // ==========================================
    // [DÀNH CHO ADMIN & PARTNER] Lấy mọi loại Tour không màng trạng thái
    // ==========================================
    getToursForAdmin: async (req, res) => {
        try {
            const { limit = 1000 } = req.query; // Lấy số lượng lớn để đổ vào bảng quản lý
            const tours = await Tour.find()
                .populate('category', 'name')
                .populate('partner', 'fullname email')
                .populate('createdBy', 'fullname email')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            res.status(200).json({ tours });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // [ADMIN] Nút bấm Duyệt / Từ chối Tour
    // ==========================================
    changeTourStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, rejectReason } = req.body;

            if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({ message: "Trạng thái không hợp lệ." });
            }

            const updatedTour = await Tour.findByIdAndUpdate(
                id,
                { status, rejectReason: rejectReason || '' },
                { new: true }
            );

            if (!updatedTour) return res.status(404).json({ message: "Không tìm thấy Tour." });

            res.status(200).json({ message: `Đã đổi trạng thái thành ${status}`, tour: updatedTour });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // ==========================================
    // [ADMIN] DUYỆT HÀNG LOẠT (BULK APPROVE)
    // ==========================================
    bulkChangeTourStatus: async (req, res) => {
        try {
            const { tourIds, status } = req.body; // tourIds là một mảng: ['id1', 'id2', ...]

            if (!Array.isArray(tourIds) || tourIds.length === 0) {
                return res.status(400).json({ message: "Không có Tour nào được chọn." });
            }

            // UpdateMany: Tìm tất cả Tour có _id nằm trong mảng tourIds và cập nhật
            await Tour.updateMany(
                { _id: { $in: tourIds } },
                { $set: { status: status, rejectReason: '' } }
            );

            res.status(200).json({ message: `Đã xử lý thành công ${tourIds.length} Tour.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // ... các hàm cũ giữ nguyên (getTours, getTourById, createTour...)

    // [MỚI] API GỢI Ý TOUR TƯƠNG TỰ (Recommender System - Content-Based Filtering)
    getRecommendations: async (req, res) => {
        try {
            const tourId = req.params.id;

            // 1. Lấy thông tin của tour khách hàng đang xem
            const currentTour = await Tour.findById(tourId);
            if (!currentTour) {
                return res.status(404).json({ message: "Không tìm thấy tour gốc" });
            }

            // 2. Thuật toán: Tìm các tour CÙNG DANH MỤC hoặc CÙNG ĐIỂM ĐẾN
            // Điều kiện: Phải là tour đã được duyệt (Approved) và KHÔNG TRÙNG với tour đang xem
            const recommendations = await Tour.find({
                _id: { $ne: tourId }, // $ne: Not Equal (Loại trừ tour hiện tại)
                status: 'Approved',
                $or: [
                    { category: currentTour.category },
                    { departureLocation: currentTour.departureLocation }
                ]
            })
                .select('name duration departureLocation image images departures averageRating totalReviews')
                .sort({ averageRating: -1 })
                .limit(4);

            res.status(200).json(recommendations);
        } catch (error) {
            console.error("Lỗi khi lấy tour gợi ý:", error);
            res.status(500).json({ error: "Lỗi Server khi tính toán gợi ý" });
        }
    }

};

module.exports = tourControllers;