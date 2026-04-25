const Tour = require('../models/Tours.js');
const Location = require('../models/Locations.js');
const Category = require('../models/Categorys.js');
const fs = require('fs');
const path = require('path');
const { generateEmbedding } = require('../services/rag/embeddingService');

const generateCleanTextForEmbedding = async (tourData) => {
    let locationName = "";
    let categoryName = "";

    if (tourData.location) {
        const loc = await Location.findById(tourData.location);
        if (loc) locationName = loc.name;
    }
    if (tourData.category) {
        const cat = await Category.findById(tourData.category);
        if (cat) categoryName = cat.name;
    }

    let minPrice = "Đang cập nhật";
    if (tourData.departures && tourData.departures.length > 0) {
        const validPrices = tourData.departures.map(d => d.adultPrice).filter(p => p != null && p > 0);
        if (validPrices.length > 0) {
            minPrice = Math.min(...validPrices) + " VNĐ";
        }
    }

    const highlightsText = tourData.highlights && tourData.highlights.length > 0
        ? tourData.highlights.join(', ') : "";

    const itineraryText = tourData.itinerary && tourData.itinerary.length > 0
        ? tourData.itinerary.map(item => `${item.day}: ${item.content}`).join('. ') : "";

    const rawText = `
        Tên tour: ${tourData.name}. 
        Mã tour: ${tourData.code}.
        Thể loại: ${categoryName}.
        Điểm đến: ${locationName}.
        Khởi hành từ: ${tourData.departureLocation}. 
        Thời gian: ${tourData.duration}. 
        Mức giá chỉ từ: ${minPrice}. 
        Điểm nhấn nổi bật: ${highlightsText}. 
        Lịch trình chi tiết: ${itineraryText}
    `;

    return rawText.replace(/\s+/g, ' ').trim();
};

const tourControllers = {
    getAllTours: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 9,
                search = '',
                minPrice,
                maxPrice,
                destination,
                location,  // 👉 Bắt thêm biến location (ID) từ Frontend
                category   // 👉 Bắt thêm biến category (ID) từ Frontend
            } = req.query;

            const query = { status: 'Approved' };

            // 1. Lọc theo Category (Danh mục)
            if (category) {
                query.category = category;
            }

            // 2. Xử lý logic Điểm đến (Kết hợp ID mới và chữ cũ để không lỗi hàm)
            let destIds = [];
            let hasLocationFilter = false;

            if (location) {
                destIds = [location]; // Dùng ID truyền từ dropdown mới
                hasLocationFilter = true;
            } else if (destination && destination !== 'ALL') {
                const destLocs = await Location.find({ name: { $regex: destination, $options: 'i' } });
                destIds = destLocs.map(loc => loc._id);
                hasLocationFilter = true;
            }

            // 3. Xử lý Search kết hợp với Điểm đến
            if (search) {
                const searchLocs = await Location.find({ name: { $regex: search, $options: 'i' } });
                const searchLocIds = searchLocs.map(loc => loc._id);

                if (hasLocationFilter) {
                    query.$and = [
                        { location: { $in: destIds } },
                        {
                            $or: [
                                { name: { $regex: search, $options: 'i' } },
                                { location: { $in: searchLocIds } }
                            ]
                        }
                    ];
                } else {
                    query.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { location: { $in: searchLocIds } }
                    ];
                }
            } else if (hasLocationFilter) {
                query.location = { $in: destIds };
            }

            // 4. Lọc theo Giá
            if (minPrice || maxPrice) {
                let priceCondition = {};
                if (minPrice) priceCondition.$gte = parseInt(minPrice);
                if (maxPrice) priceCondition.$lte = parseInt(maxPrice);

                query.departures = { $elemMatch: { adultPrice: priceCondition } };
            }

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
    
    getTourById: async (req, res) => {
        try {
            const tour = await Tour.findById(req.params.id);
            if (!tour) return res.status(404).json("Không tìm thấy tour!");
            res.status(200).json(tour);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createTour: async (req, res) => {
        try {
            const tourData = req.body;

            if (typeof tourData.departures === 'string') tourData.departures = JSON.parse(tourData.departures);
            if (typeof tourData.highlights === 'string') tourData.highlights = JSON.parse(tourData.highlights);
            if (typeof tourData.itinerary === 'string') tourData.itinerary = JSON.parse(tourData.itinerary);

            let imageUrls = ["default-tour.jpg"];
            if (req.files && req.files['images'] && req.files['images'].length > 0) {
                imageUrls = req.files['images'].map(file => `/uploads/tours/${file.filename}`);
            }

            if (req.files && req.files['itineraryImages'] && req.files['itineraryImages'].length > 0) {
                const itinFiles = req.files['itineraryImages'];
                const imageMap = JSON.parse(req.body.itineraryImageMap || "[]");

                imageMap.forEach((itinIndex, arrayIndex) => {
                    if (tourData.itinerary[itinIndex]) {
                        tourData.itinerary[itinIndex].image = `/uploads/tours/${itinFiles[arrayIndex].filename}`;
                    }
                });
            }

            const User = require('../models/Users');
            const creator = await User.findById(req.user.id);
            const initialStatus = creator.isTrusted ? 'Approved' : 'Pending';

            console.log("⚙️ Đang tạo Vector AI cho Tour mới...");
            const textToEmbed = await generateCleanTextForEmbedding(tourData);
            const embeddingVector = await generateEmbedding(textToEmbed);

            const newTour = new Tour({
                ...tourData,
                partner: req.user.id,
                createdBy: req.user.id,
                images: imageUrls, 
                status: initialStatus,
                embeddingVector: embeddingVector
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
            if (typeof tourData.departures === 'string') tourData.departures = JSON.parse(tourData.departures);
            if (typeof tourData.highlights === 'string') tourData.highlights = JSON.parse(tourData.highlights);
            if (typeof tourData.itinerary === 'string') tourData.itinerary = JSON.parse(tourData.itinerary);

            const oldTour = await Tour.findById(id);
            if (!oldTour) return res.status(404).json("Không tìm thấy tour!");

            if (req.files && req.files['images'] && req.files['images'].length > 0) {
                tourData.images = req.files['images'].map(file => `/uploads/tours/${file.filename}`);
                tourData.image = "";
                if (oldTour.images && Array.isArray(oldTour.images)) {
                    oldTour.images.forEach(img => {
                        if (typeof img === 'string' && !img.includes('default')) {
                            const oldImagePath = path.join(__dirname, '../../', img);
                            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
                        }
                    });
                }
            }
            if (req.files && req.files['itineraryImages'] && req.files['itineraryImages'].length > 0) {
                const itinFiles = req.files['itineraryImages'];
                const imageMap = JSON.parse(req.body.itineraryImageMap || "[]");
                imageMap.forEach((itinIndex, arrayIndex) => {
                    if (tourData.itinerary[itinIndex]) {
                        tourData.itinerary[itinIndex].image = `/uploads/tours/${itinFiles[arrayIndex].filename}`;
                    }
                });
            }
            const mergedData = { ...oldTour.toObject(), ...tourData };
            console.log(`Đang cập nhật lại Vector AI cho Tour (ID: ${id})...`);
            const textToEmbed = await generateCleanTextForEmbedding(mergedData);
            tourData.embeddingVector = await generateEmbedding(textToEmbed);

            const updatedTour = await Tour.findByIdAndUpdate(id, tourData, { new: true });
            res.status(200).json(updatedTour);
        } catch (error) {
            console.error("LỖI CẬP NHẬT TOUR: ", error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteTour: async (req, res) => {
        try {
            const { id } = req.params;
            const tour = await Tour.findById(id);

            if (!tour) {
                return res.status(404).json("Không tìm thấy tour!");
            }
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

    // [MỚI] API GỢI Ý TOUR TƯƠNG TỰ (Recommender System - Content-Based Filtering)
    getRecommendations: async (req, res) => {
        try {
            const tourId = req.params.id;

            const currentTour = await Tour.findById(tourId);
            if (!currentTour) {
                return res.status(404).json({ message: "Không tìm thấy tour gốc" });
            }

            const recommendations = await Tour.find({
                _id: { $ne: tourId },
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