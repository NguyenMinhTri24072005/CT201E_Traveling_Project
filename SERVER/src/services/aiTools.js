const Tour = require('../models/Tours');
const { semanticSearchLocal } = require('./rag/retrievalService');

const aiTools = {
    executeFindTours: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy công cụ 'find_tours' VỚI RAG:", args);
            const { destination, maxPrice, keyword } = args || {};
            
            // 1. Gộp các từ khóa thành 1 câu truy vấn để RAG hiểu ngữ nghĩa
            const searchQuery = `${destination || ''} ${keyword || ''}`.trim();
            let tours = [];

            if (searchQuery) {
                // 👉 CHÚ THÍCH Ở ĐÂY: Gọi RAG để tìm kiếm theo vector
                tours = await semanticSearchLocal(searchQuery);
            } else {
                // Fallback nếu khách không nhập gì
                tours = await Tour.find({ status: 'Approved' }).limit(3).lean();
            }

            // 2. Nếu khách có yêu cầu maxPrice, ta lọc lại kết quả RAG bằng giá
            if (maxPrice && tours.length > 0) {
                const parsedPrice = parseInt(maxPrice, 10);
                if (!isNaN(parsedPrice) && parsedPrice > 0) {
                    tours = tours.filter(t => 
                        t.departures && t.departures.some(d => d.adultPrice <= parsedPrice)
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
    executeCheckAvailability: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'check_availability' với tham số:", args);
            const { tourName, date } = args || {};
            
            if (!tourName) {
                return { error: "Vui lòng cung cấp tên địa điểm hoặc tên tour để kiểm tra chỗ trống." };
            }

            const searchRegex = tourName.trim().split(' ').join('.*');
            const tours = await Tour.find({
                status: 'Approved',
                $or: [
                    { name: { $regex: searchRegex, $options: 'i' } },
                    { departureLocation: { $regex: searchRegex, $options: 'i' } }
                ]
            }).lean();

            if (tours.length === 0) {
                return { error: `Không tìm thấy tour nào liên quan đến '${tourName}'.` };
            }

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
                    message: "Khách không cung cấp ngày cụ thể. Dưới đây là các ngày khởi hành gần nhất:",
                    upcomingDepartures: tour.departures.slice(0, 3).map(d => ({
                        date: d.date,
                        availableSlots: d.availableslots
                    }))
                };
            }

        } catch (error) {
            console.error("[TOOL ERROR] Lỗi khi chạy check_availability:", error);
            return { error: "Lỗi hệ thống khi kiểm tra vé. Hãy báo khách liên hệ hotline." };
        }
    },
    executeCalculatePrice: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'calculate_total_price' với tham số:", args);
            const { tourName, adultCount = 0, childCount = 0 } = args;
            const searchRegex = tourName.trim().split(' ').join('.*');
            const tours = await Tour.find({
                status: 'Approved',
                $or: [
                    { name: { $regex: searchRegex, $options: 'i' } },
                    { departureLocation: { $regex: searchRegex, $options: 'i' } }
                ]
            }).lean();

            if (tours.length === 0) {
                return { error: `Không tìm thấy tour nào tên là '${tourName}' để tính giá.` };
            }

            const tour = tours[0];
            
            const departure = tour.departures[0]; 
            if (!departure || !departure.adultPrice) {
                return { error: "Tour này hiện chưa được cập nhật bảng giá chi tiết." };
            }

            const aCount = parseInt(adultCount) || 0;
            const cCount = parseInt(childCount) || 0;
            const adultTotal = aCount * departure.adultPrice;
            const childPrice = departure.childPrice || (departure.adultPrice * 0.75);
            const childTotal = cCount * childPrice;
            const grandTotal = adultTotal + childTotal;

            return {
                tourName: tour.name,
                numberOfAdults: aCount,
                numberOfChildren: cCount,
                pricePerAdult: departure.adultPrice,
                pricePerChild: childPrice,
                totalAmount: grandTotal,
                currency: "VNĐ"
            };
        } catch (error) {
            console.error(" [TOOL ERROR] Lỗi khi chạy calculate_total_price:", error);
            return { error: "Hệ thống đang bận, không thể tính giá lúc này." };
        }
    },
    executeGetItinerary: async (args) => {
        try {
            console.log("[TOOL EXECUTION] Đang chạy 'get_tour_itinerary' với tham số:", args);
            const { tourName } = args || {};

            if (!tourName) return { error: "Bạn muốn xem lịch trình của tour nào ạ?" };

            const searchRegex = tourName.trim().split(' ').join('.*');
            const tour = await Tour.findOne({
                status: 'Approved',
                $or: [
                    { name: { $regex: searchRegex, $options: 'i' } },
                    { departureLocation: { $regex: searchRegex, $options: 'i' } }
                ]
            }).select('name itinerary duration').lean();

            if (!tour) return { error: `Em không tìm thấy lịch trình cho tour '${tourName}' ạ.` };

            return {
                tourName: tour.name,
                duration: tour.duration,
                itinerary: tour.itinerary 
            };
        } catch (error) {
            console.error(" [TOOL ERROR] Lỗi khi tra cứu lịch trình:", error);
            return { error: "Hệ thống đang gặp sự cố khi lấy lịch trình." };
        }
    }
};

module.exports = aiTools;