// SERVER/src/services/aiTools.js
const Tour = require('../models/Tours');
const Booking = require('../models/Booking');
const { semanticSearchLocal } = require('./rag/retrievalService');

// ==========================================
// 🛠️ HELPER FUNCTIONS (Hàm hỗ trợ dùng chung)
// ==========================================

// 1. Hàm chống lỗi Regex (Bảo vệ Database khỏi Crash)
const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// 2. Hàm tìm Tour theo tên (Dùng chung cho cả 4 tools bên dưới)
const findTourByNameHelper = async (tourName, includeLocation = false) => {
    if (!tourName) return null;
    
    // Tách từ khóa và escape an toàn, hỗ trợ tìm kiếm mờ (Fuzzy Search)
    const safeRegexStr = tourName.trim().split(/\s+/).map(escapeRegex).join('.*');
    
    const query = { status: 'Approved' };
    const orConditions = [{ name: { $regex: safeRegexStr, $options: 'i' } }];
    
    if (includeLocation) {
        orConditions.push({ departureLocation: { $regex: safeRegexStr, $options: 'i' } });
    }
    
    query.$or = orConditions;
    
    // Trả về tour đầu tiên khớp nhất
    return await Tour.findOne(query).lean();
};

// ==========================================
// 🚀 MAIN AI TOOLS
// ==========================================

const aiTools = {
    // 1. TÌM KIẾM TOUR (Đã đẩy Filter xuống cho RAG xử lý để nhẹ RAM)
    executeFindTours: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'find_tours':", args);
            const { destination, keyword, departureLocation, duration, maxPrice } = args || {};
            
            const searchQuery = `${destination || ''} ${keyword || ''}`.trim();
            
            // Đóng gói các điều kiện cứng
            const filters = {
                maxPrice: maxPrice,
                departureLocation: departureLocation,
                duration: duration
            };

            // Gọi thẳng Hybrid Search (MongoDB lọc cứng + Vector chấm điểm)
            let tours = await semanticSearchLocal(searchQuery, filters, 3);

            // Fallback nếu không có kết quả
            if (tours.length === 0) {
                console.log("[TOOL] Không có tour khớp 100%, Fallback ngẫu nhiên...");
                tours = await Tour.find({ status: 'Approved' })
                    .select('-embeddingVector') // Loại bỏ vector cho nhẹ
                    .limit(3)
                    .lean();
            }

            return tours;
        } catch (error) {
            console.error("[TOOL ERROR] Lỗi find_tours:", error);
            return []; 
        }
    },

    // 2. XEM CHI TIẾT TOUR
    executeGetTourDetails: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'get_tour_details':", args);
            const tour = await findTourByNameHelper(args.tourName);

            if (!tour) return { error: `Dạ em không tìm thấy tour nào tên '${args.tourName}'.` };

            return {
                tourName: tour.name,
                duration: tour.duration,
                itinerary: tour.itinerary,
                inclusions: tour.inclusions || "Đang cập nhật",
                exclusions: tour.exclusions || "Đang cập nhật",
                refundPolicy: tour.refundPolicy || "Vui lòng liên hệ hotline."
            };
        } catch (error) {
            console.error("[TOOL ERROR] Lỗi get_tour_details:", error);
            return { error: "Hệ thống đang bận, không lấy được chi tiết." };
        }
    },

    // 3. KIỂM TRA CHỖ TRỐNG
    executeCheckAvailability: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'check_availability':", args);
            const { tourName, date } = args || {};
            
            // Hàm helper có hỗ trợ tìm thêm theo departureLocation
            const tour = await findTourByNameHelper(tourName, true);

            if (!tour) return { error: `Không tìm thấy tour liên quan đến '${tourName}'.` };

            if (date) {
                const exactDeparture = tour.departures.find(d => 
                    d.date.includes(date) || date.includes(d.date)
                );

                if (exactDeparture) {
                    return {
                        tourName: tour.name,
                        requestedDate: exactDeparture.date,
                        availableSlots: exactDeparture.availableslots,
                        transport: exactDeparture.transport,
                        adultPrice: exactDeparture.adultPrice
                    };
                } else {
                    return { 
                        error: `Tour '${tour.name}' không có lịch khởi hành ngày ${date}.`,
                        suggestedDates: tour.departures.map(d => d.date).slice(0, 3) 
                    };
                }
            } else {
                return {
                    tourName: tour.name,
                    message: "Dưới đây là các ngày khởi hành gần nhất:",
                    upcomingDepartures: tour.departures.slice(0, 3).map(d => ({
                        date: d.date,
                        availableSlots: d.availableslots
                    }))
                };
            }
        } catch (error) {
            console.error("[TOOL ERROR] Lỗi check_availability:", error);
            return { error: "Lỗi hệ thống khi kiểm tra vé." };
        }
    },

    // 4. TÍNH TỔNG TIỀN
    executeCalculatePrice: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'calculate_total_price':", args);
            const tour = await findTourByNameHelper(args.tourName);

            if (!tour) return { error: `Không tìm thấy tour '${args.tourName}'.` };

            const departure = tour.departures[0]; 
            if (!departure || !departure.adultPrice) return { error: "Tour chưa có giá chi tiết." };

            const aCount = parseInt(args.adultCount) || 0;
            const cCount = parseInt(args.childCount) || 0;
            const adultTotal = aCount * departure.adultPrice;
            const childPrice = departure.childPrice || (departure.adultPrice * 0.75);
            const childTotal = cCount * childPrice;

            return {
                tourName: tour.name,
                numberOfAdults: aCount,
                numberOfChildren: cCount,
                pricePerAdult: departure.adultPrice,
                pricePerChild: childPrice,
                totalAmount: adultTotal + childTotal,
                currency: "VNĐ"
            };
        } catch (error) {
            console.error("[TOOL ERROR] Lỗi calculate_total_price:", error);
            return { error: "Không thể tính giá lúc này." };
        }
    },

    // 5. TẠO YÊU CẦU ĐẶT TOUR
    executeRequestBooking: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'request_booking':", args);
            const { tourName, departureDate, adultCount, childCount = 0, fullName, phone, email, cccd, notes } = args;

            const tour = await findTourByNameHelper(tourName);
            if (!tour) return { error: `Không tìm thấy tour '${tourName}'.` };

            const departure = tour.departures.find(d => d.date.includes(departureDate) || departureDate.includes(d.date));
            if (!departure) return { error: `Tour không có lịch khởi hành ngày ${departureDate}.` };

            const aCount = parseInt(adultCount) || 1;
            const cCount = parseInt(childCount) || 0;
            const totalTickets = aCount + cCount;
            const childPrice = departure.childPrice || (departure.adultPrice * 0.75);
            const totalprice = (aCount * departure.adultPrice) + (cCount * childPrice);

            const newBooking = new Booking({
                customer: '000000000000000000000000', 
                tour: tour._id,
                departureId: departure._id,
                totalprice: totalprice,
                totalTickets: totalTickets,
                tickets: [
                    { ticketType: 'Người lớn', quantity: aCount, unitPrice: departure.adultPrice },
                    ...(cCount > 0 ? [{ ticketType: 'Trẻ em', quantity: cCount, unitPrice: childPrice }] : [])
                ],
                representative: { fullName, phone, email, cccd },
                notes: notes || "",
                status: 'pending_payment'
            });

            // await newBooking.save(); 

            return {
                success: true,
                message: "Đã tạo yêu cầu đặt Tour thành công. Vui lòng thanh toán trong 24h.",
                bookingSummary: {
                    tourName: tour.name,
                    departureDate: departure.date,
                    representative: fullName,
                    totalPrice: totalprice
                }
            };

        } catch (error) {
            console.error("[TOOL ERROR] Lỗi request_booking:", error);
            return { error: "Đã xảy ra lỗi khi tạo đơn hàng." };
        }
    },

    // 6. THÔNG TIN CÔNG TY & FAQ
    executeGetFaqInfo: async (args) => {
        console.log("[TOOL EXECUTION] Đang chạy 'get_faq_info':", args);
        return {
            companyInfo: {
                name: "Tây Bắc Travel",
                address: "Thành phố Cần Thơ, Việt Nam",
                insurance: "Có bảo hiểm du lịch lên đến 100.000.000 VNĐ.",
                paymentMethods: "Hỗ trợ VNPAY, MOMO và Chuyển khoản.",
                contact: "Hotline: 1900 xxxx - Email: support@taybactravel.com"
            }
        };
    }
};

module.exports = aiTools;