require('dotenv').config();
const mongoose = require('mongoose');
const Tour = require('./src/models/Tours.js');
const Location = require('./src/models/Locations.js');
const Category = require('./src/models/Categorys.js');

// 👉 ID PARTNER CỦA EM
const PARTNER_ID = '69c5b6c6d90b7d96ce14cde7'; 

const seed10Tours = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🟢 Đã kết nối MongoDB. Đang tiến hành nạp 10 Tour mới...');

        // 1. TẠO HOẶC LẤY LẠI CÁC ĐỊA ĐIỂM (Bao gồm 5 địa điểm mới)
        const laichau = await Location.findOneAndUpdate({ name: 'Lai Châu' }, { description: 'Kỳ vĩ Cầu Kính Rồng Mây', image: 'laichau.jpg' }, { upsert: true, new: true });
        const yenbai = await Location.findOneAndUpdate({ name: 'Yên Bái' }, { description: 'Hương lúa nếp Tú Lệ', image: 'yenbai.jpg' }, { upsert: true, new: true });
        const langson = await Location.findOneAndUpdate({ name: 'Lạng Sơn' }, { description: 'Xứ Lạng mộng mơ', image: 'langson.jpg' }, { upsert: true, new: true });
        const backan = await Location.findOneAndUpdate({ name: 'Bắc Kạn' }, { description: 'Viên ngọc xanh Ba Bể', image: 'backan.jpg' }, { upsert: true, new: true });
        const tuyenquang = await Location.findOneAndUpdate({ name: 'Tuyên Quang' }, { description: 'Truyền thuyết Na Hang', image: 'tuyenquang.jpg' }, { upsert: true, new: true });
        const sapa = await Location.findOneAndUpdate({ name: 'Sapa' }, { description: 'Thành phố sương mù', image: 'sapa.jpg' }, { upsert: true, new: true });
        const hagiang = await Location.findOneAndUpdate({ name: 'Hà Giang' }, { description: 'Cao nguyên đá', image: 'hagiang.jpg' }, { upsert: true, new: true });
        
        // 2. TẠO HOẶC LẤY LẠI DANH MỤC
        const adventure = await Category.findOneAndUpdate({ name: 'Khám phá' }, { description: 'Mạo hiểm, leo núi', image: 'adventure.jpg' }, { upsert: true, new: true });
        const relax = await Category.findOneAndUpdate({ name: 'Nghỉ dưỡng' }, { description: 'Thư giãn, chữa lành', image: 'relax.jpg' }, { upsert: true, new: true });
        const eco = await Category.findOneAndUpdate({ name: 'Sinh thái' }, { description: 'Gần gũi thiên nhiên', image: 'eco.jpg' }, { upsert: true, new: true });
        const trekking = await Category.findOneAndUpdate({ name: 'Trekking - Săn mây' }, { description: 'Chinh phục đỉnh cao', image: 'trekking.jpg' }, { upsert: true, new: true });

        // 3. DANH SÁCH 10 TOUR SIÊU CHẤT LƯỢNG
        const toursData = [
            {
                name: "Lai Châu - Đèo Ô Quy Hồ - Cầu Kính Rồng Mây",
                code: "LAICHAU-011",
                duration: "3 Ngày 2 Đêm",
                departureLocation: "Hà Nội",
                image: "laichau.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: laichau._id, category: adventure._id,
                status: "Approved",
                highlights: ["Trải nghiệm Cầu Kính Rồng Mây cao nhất VN", "Chinh phục đèo Ô Quy Hồ", "Thưởng thức lợn cắp nách"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Sapa - Đèo Ô Quy Hồ - Lai Châu." },
                    { day: "Ngày 2", meals: "Sáng, Trưa, Tối", content: "Khám phá Cầu Kính Rồng Mây - Bản Hon." },
                    { day: "Ngày 3", meals: "Sáng, Trưa", content: "Chợ phiên Lai Châu - Trở về Hà Nội." }
                ],
                departures: [
                    { date: "12/05/2026", returnDate: "14/05/2026", dayOfWeek: "Thứ 3", transport: "Giường Nằm Cabin", adultPrice: 3200000, childPrice: 2400000, babyPrice: 400000, maxslots: 22, availableslots: 22 },
                    { date: "22/05/2026", returnDate: "24/05/2026", dayOfWeek: "Thứ 6", transport: "Limousine VIP", adultPrice: 3800000, childPrice: 2800000, babyPrice: 500000, maxslots: 9, availableslots: 5 }
                ],
                averageRating: 4.8, totalReviews: 42
            },
            {
                name: "Nghỉ Dưỡng Trạm Tấu - Suối Khoáng Nóng",
                code: "YENBAI-012",
                duration: "2 Ngày 1 Đêm",
                departureLocation: "Hà Nội",
                image: "yenbai.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: yenbai._id, category: relax._id,
                status: "Approved",
                highlights: ["Tắm suối khoáng nóng 100% tự nhiên", "Thưởng thức xôi nếp Tú Lệ", "Ngắm đồi chè Thanh Sơn"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Đồi chè Thanh Sơn - Nghĩa Lộ - Trạm Tấu." },
                    { day: "Ngày 2", meals: "Sáng, Trưa", content: "Tắm suối khoáng - Mua đặc sản - Về Hà Nội." }
                ],
                departures: [
                    { date: "09/05/2026", returnDate: "10/05/2026", dayOfWeek: "Thứ 7", transport: "Xe 16 chỗ", adultPrice: 1650000, childPrice: 1100000, babyPrice: 200000, maxslots: 15, availableslots: 15 },
                    { date: "16/05/2026", returnDate: "17/05/2026", dayOfWeek: "Thứ 7", transport: "Xe 16 chỗ", adultPrice: 1650000, childPrice: 1100000, babyPrice: 200000, maxslots: 15, availableslots: 2 } // Sắp hết
                ],
                averageRating: 4.5, totalReviews: 21
            },
            {
                name: "Mùa Đông Xứ Lạng - Đỉnh Mẫu Sơn",
                code: "LANGSON-013",
                duration: "2 Ngày 1 Đêm",
                departureLocation: "Hà Nội",
                image: "langson.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: langson._id, category: eco._id,
                status: "Approved",
                highlights: ["Check-in Đỉnh Mẫu Sơn", "Tham quan Động Tam Thanh", "Thưởng thức Vịt quay Lạng Sơn"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Động Tam Thanh - Chợ Kỳ Lừa - Lên Mẫu Sơn." },
                    { day: "Ngày 2", meals: "Sáng, Trưa", content: "Săn mây Mẫu Sơn - Chợ Đông Kinh - Về Hà Nội." }
                ],
                departures: [
                    { date: "02/06/2026", returnDate: "03/06/2026", dayOfWeek: "Thứ 3", transport: "Xe 29 chỗ", adultPrice: 1450000, childPrice: 950000, babyPrice: 100000, maxslots: 29, availableslots: 29 }
                ],
                averageRating: 4.2, totalReviews: 15
            },
            {
                name: "Sinh Thái Hồ Ba Bể - Đảo Bà Góa",
                code: "BACKAN-014",
                duration: "2 Ngày 1 Đêm",
                departureLocation: "Hà Nội",
                image: "backan.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: backan._id, category: eco._id,
                status: "Pending", // Demo duyệt
                highlights: ["Ngồi thuyền máy du ngoạn Hồ Ba Bể", "Khám phá Động Puông", "Trải nghiệm Homestay người Tày"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Vườn QG Ba Bể - Đi thuyền thăm hồ." },
                    { day: "Ngày 2", meals: "Sáng, Trưa", content: "Động Puông - Thác Đầu Đẳng - Trở về Hà Nội." }
                ],
                departures: [
                    { date: "20/05/2026", returnDate: "21/05/2026", dayOfWeek: "Thứ 4", transport: "Xe 29 chỗ", adultPrice: 1750000, childPrice: 1250000, babyPrice: 150000, maxslots: 25, availableslots: 25 }
                ],
                averageRating: 0, totalReviews: 0
            },
            {
                name: "Khám Phá Na Hang - Hạ Long Giữa Đại Ngàn",
                code: "TUYENQUANG-015",
                duration: "3 Ngày 2 Đêm",
                departureLocation: "Hà Nội",
                image: "tuyenquang.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: tuyenquang._id, category: eco._id,
                status: "Approved",
                highlights: ["Du thuyền hồ sinh thái Na Hang", "Check-in Cọc Vài Phạ", "Massage cá massage chân tự nhiên"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Tuyên Quang - Lâm Bình." },
                    { day: "Ngày 2", meals: "Sáng, Trưa, Tối", content: "Lên thuyền du ngoạn Na Hang - Thác Khuổi Nhi." },
                    { day: "Ngày 3", meals: "Sáng, Trưa", content: "Khám phá bản làng người Dao - Về Hà Nội." }
                ],
                departures: [
                    { date: "06/06/2026", returnDate: "08/06/2026", dayOfWeek: "Thứ 7", transport: "Xe 16 chỗ", adultPrice: 2600000, childPrice: 1800000, babyPrice: 200000, maxslots: 15, availableslots: 15 }
                ],
                averageRating: 4.7, totalReviews: 38
            },
            {
                name: "Sapa Trekking - Khám Phá Bản Lao Chải Tả Van",
                code: "SAPA-TREK-016",
                duration: "2 Ngày 1 Đêm",
                departureLocation: "Hà Nội",
                image: "sapa.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: sapa._id, category: trekking._id,
                status: "Approved",
                highlights: ["Trekking 12km qua thung lũng Mường Hoa", "Ngủ homestay giữa ruộng bậc thang", "Thưởng thức BBQ của người bản địa"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Xe giường nằm HN-Sapa. Trekking Y Linh Hồ - Lao Chải - Tả Van." },
                    { day: "Ngày 2", meals: "Sáng, Trưa", content: "Trekking Bản Giang Tà Chải - Trở về Sapa - Về Hà Nội." }
                ],
                departures: [
                    { date: "15/06/2026", returnDate: "16/06/2026", dayOfWeek: "Thứ 2", transport: "Xe Giường Nằm", adultPrice: 1550000, childPrice: 1100000, babyPrice: 200000, maxslots: 20, availableslots: 20 },
                    { date: "20/06/2026", returnDate: "21/06/2026", dayOfWeek: "Thứ 7", transport: "Cabin Đôi", adultPrice: 1850000, childPrice: 1300000, babyPrice: 200000, surcharge: 200000, maxslots: 20, availableslots: 16 }
                ],
                averageRating: 4.9, totalReviews: 88
            },
            {
                name: "Hoàng Su Phì Mùa Nước Đổ",
                code: "HAGIANG-HSP-017",
                duration: "3 Ngày 2 Đêm",
                departureLocation: "Hà Nội",
                image: "hagiang.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: hagiang._id, category: adventure._id,
                status: "Approved",
                highlights: ["Ngắm ruộng bậc thang Hoàng Su Phì đẹp nhất VN", "Thưởng thức chè Shan Tuyết cổ thụ", "Chinh phục đỉnh Chiêu Lầu Thi"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Bắc Quang - Hoàng Su Phì (Bản Luốc)." },
                    { day: "Ngày 2", meals: "Sáng, Trưa, Tối", content: "Chinh phục Chiêu Lầu Thi - Săn mây." },
                    { day: "Ngày 3", meals: "Sáng, Trưa", content: "Thăm bản Phùng - Trở về Hà Nội." }
                ],
                departures: [
                    { date: "24/05/2026", returnDate: "26/05/2026", dayOfWeek: "Chủ Nhật", transport: "Xe 16 chỗ", adultPrice: 3100000, childPrice: 2300000, babyPrice: 300000, maxslots: 14, availableslots: 14 }
                ],
                averageRating: 4.6, totalReviews: 27
            },
            {
                name: "Combo Mộc Châu - Săn Mây Tà Xùa",
                code: "MOCCHAU-TAXUA-018",
                duration: "3 Ngày 2 Đêm",
                departureLocation: "Hà Nội",
                image: "mocchau.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: yenbai._id, // Mix
                category: trekking._id,
                status: "Pending", 
                highlights: ["Kết hợp 2 điểm đến Hot nhất", "Check-in đồi chè trái tim", "Đón bình minh Sống Lưng Khủng Long"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Mộc Châu - Thác Dải Yếm." },
                    { day: "Ngày 2", meals: "Sáng, Trưa, Tối", content: "Mộc Châu - Bến phà Vạn Yên - Bắc Yên - Tà Xùa." },
                    { day: "Ngày 3", meals: "Sáng, Trưa", content: "Săn mây Tà Xùa - Về Hà Nội." }
                ],
                departures: [
                    { date: "10/06/2026", returnDate: "12/06/2026", dayOfWeek: "Thứ 4", transport: "Limousine 16 chỗ", adultPrice: 2850000, childPrice: 2000000, babyPrice: 250000, maxslots: 15, availableslots: 15 }
                ],
                averageRating: 0, totalReviews: 0
            },
            {
                name: "A Pa Chải - Cực Tây Tổ Quốc",
                code: "DIENBIEN-APC-019",
                duration: "4 Ngày 3 Đêm",
                departureLocation: "Hà Nội",
                image: "laichau.jpg", // Tạm dùng ảnh vùng cao
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: laichau._id, category: adventure._id,
                status: "Approved",
                highlights: ["Chinh phục Cột mốc số 0 A Pa Chải", "Ngã ba biên giới Việt - Lào - Trung", "Giao lưu Đồn Biên Phòng 317"],
                itinerary: [
                    { day: "Ngày 1", meals: "Trưa, Tối", content: "Hà Nội - Sơn La - Điện Biên Phủ." },
                    { day: "Ngày 2", meals: "Sáng, Trưa, Tối", content: "Điện Biên - Mường Nhé - Đồn Biên Phòng A Pa Chải." },
                    { day: "Ngày 3", meals: "Sáng, Trưa, Tối", content: "Trekking Cột Mốc số 0 - Quay về Điện Biên." },
                    { day: "Ngày 4", meals: "Sáng, Trưa", content: "Tham quan di tích ĐBP - Trở về Hà Nội." }
                ],
                departures: [
                    { date: "04/06/2026", returnDate: "07/06/2026", dayOfWeek: "Thứ 4", transport: "Xe 29 chỗ", adultPrice: 4200000, childPrice: 3200000, babyPrice: 500000, maxslots: 25, availableslots: 25 }
                ],
                averageRating: 4.8, totalReviews: 54
            },
            {
                name: "Cao Bằng - Mùa Hạt Dẻ Trùng Khánh",
                code: "CAOBANG-DE-020",
                duration: "2 Ngày 2 Đêm",
                departureLocation: "Hà Nội",
                image: "caobang.jpg",
                gallery: [],
                partner: PARTNER_ID, createdBy: PARTNER_ID, location: sapa._id, category: eco._id,
                status: "Approved",
                highlights: ["Trải nghiệm thu hoạch hạt dẻ Trùng Khánh", "Thưởng thức Vịt quay bảy vị", "Thăm thác Bản Giốc"],
                itinerary: [
                    { day: "Đêm 1", meals: "Không", content: "Lên xe giường nằm từ Mỹ Đình đi Cao Bằng." },
                    { day: "Ngày 1", meals: "Sáng, Trưa, Tối", content: "Cao Bằng - Trùng Khánh - Vào vườn nhặt hạt dẻ." },
                    { day: "Ngày 2", meals: "Sáng, Trưa", content: "Thác Bản Giốc - Động Ngườm Ngao - Lên xe về HN." }
                ],
                departures: [
                    { date: "10/09/2026", returnDate: "12/09/2026", dayOfWeek: "Thứ 5", transport: "Giường nằm", adultPrice: 2200000, childPrice: 1600000, babyPrice: 200000, maxslots: 34, availableslots: 34 },
                    { date: "17/09/2026", returnDate: "19/09/2026", dayOfWeek: "Thứ 5", transport: "Giường nằm", adultPrice: 2200000, childPrice: 1600000, babyPrice: 200000, maxslots: 34, availableslots: 10 }
                ],
                averageRating: 4.7, totalReviews: 31
            }
        ];

        await Tour.insertMany(toursData);
        console.log('✅ XONG! Đã tạo thành công 10 Tour siêu hoành tráng!');
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo dữ liệu:', error);
    } finally {
        mongoose.connection.close(); 
        process.exit(0);
    }
};

seed10Tours();