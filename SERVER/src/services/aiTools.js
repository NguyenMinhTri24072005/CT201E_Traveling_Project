// SERVER/src/services/aiTools.js
const Tour = require('../models/Tours');
const Booking = require('../models/Booking'); // Đảm bảo đường dẫn này đúng với project của bạn
const { semanticSearchLocal } = require('./rag/retrievalService');

const aiTools = {
    // 1. TÌM KIẾM TOUR (Đã bổ sung departureLocation, duration)
    executeFindTours: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'find_tours' VỚI RAG:", args);
            const { destination, keyword, departureLocation, duration, maxPrice } = args || {};
            
            // Gộp các từ khóa thành 1 câu truy vấn để RAG hiểu ngữ nghĩa
            const searchQuery = `${destination || ''} ${keyword || ''} ${departureLocation || ''}`.trim();
            let tours = [];

            if (searchQuery) {
                tours = await semanticSearchLocal(searchQuery);
            } else {
                tours = await Tour.find({ status: 'Approved' }).limit(3).lean();
            }

            // Lọc theo Max Price
            if (maxPrice && tours.length > 0) {
                const parsedPrice = parseInt(maxPrice, 10);
                if (!isNaN(parsedPrice) && parsedPrice > 0) {
                    tours = tours.filter(t => 
                        t.departures && t.departures.some(d => d.adultPrice <= parsedPrice)
                    );
                }
            }

            // Lọc theo Nơi khởi hành
            if (departureLocation && tours.length > 0) {
                tours = tours.filter(t => 
                    t.departureLocation && t.departureLocation.toLowerCase().includes(departureLocation.toLowerCase())
                );
            }

            // Lọc theo Số ngày (duration)
            if (duration && tours.length > 0) {
                const parsedDuration = parseInt(duration, 10);
                if (!isNaN(parsedDuration)) {
                    tours = tours.filter(t => 
                        t.duration && t.duration.toString().includes(parsedDuration.toString())
                    );
                }
            }

            if (tours.length === 0) {
                console.log("[TOOL] Không tìm thấy, kích hoạt Fallback lấy 3 tour ngẫu nhiên...");
                tours = await Tour.find({ status: 'Approved' }).limit(3).lean();
            }

            return tours;
        } catch (error) {
            console.error("[TOOL ERROR] Lỗi khi chạy find_tours:", error);
            return []; 
        }
    },

    // 2. XEM CHI TIẾT TOUR (Thay cho Itinerary, lấy full thông tin)
    executeGetTourDetails: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'get_tour_details' với tham số:", args);
            const { tourName } = args || {};

            if (!tourName) return { error: "Vui lòng cung cấp tên tour để xem chi tiết." };

            const searchRegex = tourName.trim().split(' ').join('.*');
            const tour = await Tour.findOne({
                status: 'Approved',
                $or: [
                    { name: { $regex: searchRegex, $options: 'i' } }
                ]
            }).select('name itinerary duration inclusions exclusions refundPolicy').lean();

            if (!tour) return { error: `Không tìm thấy chi tiết cho tour '${tourName}'.` };

            return {
                tourName: tour.name,
                duration: tour.duration,
                itinerary: tour.itinerary,
                inclusions: tour.inclusions || "Đang cập nhật",
                exclusions: tour.exclusions || "Đang cập nhật",
                refundPolicy: tour.refundPolicy || "Vui lòng liên hệ hotline để biết chính sách hoàn hủy."
            };
        } catch (error) {
            console.error("[TOOL ERROR] Lỗi khi tra cứu chi tiết tour:", error);
            return { error: "Hệ thống đang gặp sự cố khi lấy chi tiết tour." };
        }
    },

    // 3. KIỂM TRA CHỖ TRỐNG (Giữ nguyên logic cực tốt của bạn)
    executeCheckAvailability: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'check_availability' với tham số:", args);
            const { tourName, date } = args || {};
            
            if (!tourName) return { error: "Vui lòng cung cấp tên địa điểm hoặc tên tour để kiểm tra chỗ trống." };

            const searchRegex = tourName.trim().split(' ').join('.*');
            const tours = await Tour.find({
                status: 'Approved',
                $or: [
                    { name: { $regex: searchRegex, $options: 'i' } },
                    { departureLocation: { $regex: searchRegex, $options: 'i' } }
                ]
            }).lean();

            if (tours.length === 0) return { error: `Không tìm thấy tour nào liên quan đến '${tourName}'.` };

            const tour = tours[0];

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
                        error: `Tour '${tour.name}' không có lịch khởi hành vào ngày ${date}.`,
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
            console.error("[TOOL ERROR] Lỗi khi chạy check_availability:", error);
            return { error: "Lỗi hệ thống khi kiểm tra vé." };
        }
    },

    // 4. TÍNH TỔNG TIỀN (Giữ nguyên)
    executeCalculatePrice: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'calculate_total_price' với tham số:", args);
            const { tourName, adultCount = 0, childCount = 0 } = args;
            const searchRegex = tourName.trim().split(' ').join('.*');
            const tours = await Tour.find({
                status: 'Approved',
                name: { $regex: searchRegex, $options: 'i' }
            }).lean();

            if (tours.length === 0) return { error: `Không tìm thấy tour '${tourName}'.` };

            const tour = tours[0];
            const departure = tour.departures[0]; 
            if (!departure || !departure.adultPrice) return { error: "Tour này chưa có bảng giá chi tiết." };

            const aCount = parseInt(adultCount) || 0;
            const cCount = parseInt(childCount) || 0;
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
            console.error("[TOOL ERROR] Lỗi tính giá:", error);
            return { error: "Không thể tính giá lúc này." };
        }
    },

    // 5. TẠO YÊU CẦU ĐẶT TOUR (New)
    executeRequestBooking: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'request_booking' với tham số:", args);
            const { tourName, departureDate, adultCount, childCount = 0, fullName, phone, email, cccd, notes } = args;

            // Tìm Tour
            const searchRegex = tourName.trim().split(' ').join('.*');
            const tour = await Tour.findOne({ name: { $regex: searchRegex, $options: 'i' }, status: 'Approved' });
            if (!tour) return { error: `Không tìm thấy tour '${tourName}'.` };

            // Tìm Ngày khởi hành
            const departure = tour.departures.find(d => d.date.includes(departureDate) || departureDate.includes(d.date));
            if (!departure) return { error: `Tour không có lịch khởi hành vào ngày ${departureDate}.` };

            // Tính tiền
            const aCount = parseInt(adultCount) || 1;
            const cCount = parseInt(childCount) || 0;
            const totalTickets = aCount + cCount;
            const childPrice = departure.childPrice || (departure.adultPrice * 0.75);
            const totalprice = (aCount * departure.adultPrice) + (cCount * childPrice);

            // TẠO BOOKING NHÁP
            // Lưu ý: customer (User ID) đang được set mock '000000000000000000000000' để tránh crash Schema do req.user chưa được truyền vào Chatbot. 
            // Về sau bạn có thể truyền ID thật qua `chatHistory` hoặc bắt buộc User Login trước khi chat.
            const newBooking = new Booking({
                customer: '000000000000000000000000', // Mock User ID (hoặc bỏ required trong Schema)
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

            // Nếu bạn tạm thời chưa muốn Save vào DB để tránh rác DB, hãy comment dòng save() lại.
            // await newBooking.save(); 

            return {
                success: true,
                message: "Đã tạo yêu cầu đặt Tour thành công. Vui lòng hướng dẫn khách kiểm tra Email hoặc truy cập mục 'Đơn hàng' để tiến hành thanh toán trong 24h.",
                bookingSummary: {
                    tourName: tour.name,
                    departureDate: departure.date,
                    representative: fullName,
                    totalPrice: totalprice,
                    status: "Chờ thanh toán (24h)"
                }
            };

        } catch (error) {
            console.error("[TOOL ERROR] Lỗi khi tạo booking:", error);
            return { error: "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng báo khách gọi Hotline để được hỗ trợ trực tiếp." };
        }
    },

    // 6. THÔNG TIN CÔNG TY & FAQ (New)
    executeGetFaqInfo: async (args) => {
        console.log("[TOOL EXECUTION] Đang chạy 'get_faq_info':", args);
        // Có thể tích hợp RAG FAQ vào đây sau. Tạm thời dùng dữ liệu tĩnh:
        return {
            companyInfo: {
                name: "Tây Bắc Travel",
                address: "Thành phố Cần Thơ, Việt Nam",
                insurance: "Có bảo hiểm du lịch lên đến 100.000.000 VNĐ cho mọi hành khách.",
                paymentMethods: "Hỗ trợ thanh toán qua VNPAY, MOMO và Chuyển khoản ngân hàng.",
                contact: "Hotline hỗ trợ: 1900 xxxx - Email: support@taybactravel.com"
            },
            instructionToAI: "Hãy dùng các thông tin trên để trả lời câu hỏi của khách hàng một cách tự nhiên nhất."
        };
    }
};

module.exports = aiTools;