/**
 * =============================================================
 *  SEED TOURS + BOOKINGS + REVIEWS
 *  Tạo dữ liệu ảo phong phú cho hệ thống du lịch
 *  Chạy:  node seedTours.js
 * =============================================================
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Tour     = require('./src/models/Tours');
const Category = require('./src/models/Categorys');
const Location = require('./src/models/Locations');
const User     = require('./src/models/Users');
const Booking  = require('./src/models/Booking');
const Review   = require('./src/models/Reviews');
const bcrypt   = require('bcrypt');

/* ──────────────────── DỮ LIỆU GỐC ──────────────────── */

const CATEGORIES = [
  { name: 'Du lịch sinh thái',   description: 'Khám phá thiên nhiên hoang sơ, rừng núi, suối thác' },
  { name: 'Du lịch văn hoá',     description: 'Trải nghiệm văn hoá dân tộc, lễ hội, làng nghề' },
  { name: 'Du lịch mạo hiểm',   description: 'Leo núi, trekking, cắm trại, thể thao mạo hiểm' },
  { name: 'Du lịch nghỉ dưỡng', description: 'Nghỉ ngơi tại resort, homestay cao cấp' },
  { name: 'Du lịch ẩm thực',    description: 'Khám phá ẩm thực vùng miền, chợ phiên' },
  { name: 'Du lịch tâm linh',   description: 'Tham quan chùa chiền, đền miếu, di tích tâm linh' },
];

const LOCATIONS = [
  { name: 'Sapa',         imgLink: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800' },
  { name: 'Hà Giang',     imgLink: 'https://images.unsplash.com/photo-1573155993874-d5d48af862ba?w=800' },
  { name: 'Mù Cang Chải', imgLink: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
  { name: 'Mai Châu',     imgLink: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800' },
  { name: 'Mộc Châu',     imgLink: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
  { name: 'Điện Biên',    imgLink: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800' },
  { name: 'Lai Châu',     imgLink: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800' },
  { name: 'Yên Bái',      imgLink: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800' },
  { name: 'Lào Cai',      imgLink: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800' },
  { name: 'Tuyên Quang',  imgLink: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800' },
  { name: 'Bắc Kạn',      imgLink: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
  { name: 'Cao Bằng',     imgLink: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800' },
];

const DEPARTURE_LOCATIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng'];
const TRANSPORTS = ['Xe khách VIP', 'Limousine', 'Máy bay + Xe đưa đón', 'Tàu hoả + Xe đưa đón', 'Xe giường nằm'];
const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600',
];

/* ── Mẫu lịch trình chi tiết theo số ngày ── */
const ITINERARY_TEMPLATES = {
  2: [
    [
      { day: 'Ngày 1', meals: 'Ăn trưa, Ăn tối', content: 'Xuất phát từ điểm hẹn, di chuyển đến điểm đến. Nhận phòng khách sạn, tham quan trung tâm thị trấn, chợ phiên và các điểm văn hoá nổi bật. Ăn tối với đặc sản địa phương.', image: '' },
      { day: 'Ngày 2', meals: 'Ăn sáng, Ăn trưa', content: 'Ăn sáng tại khách sạn, tham quan các bản làng dân tộc, trải nghiệm đời sống bản địa. Ăn trưa và trả phòng, khởi hành về lại điểm xuất phát.', image: '' },
    ],
    [
      { day: 'Ngày 1', meals: 'Ăn trưa, Ăn tối', content: 'Khởi hành sáng sớm, đến nơi vào buổi trưa. Check-in homestay, đi bộ khám phá bản làng, ngắm ruộng bậc thang. Tối tham gia đốt lửa trại cùng người dân bản địa.', image: '' },
      { day: 'Ngày 2', meals: 'Ăn sáng, Ăn trưa', content: 'Dậy sớm ngắm bình minh. Trek nhẹ qua các cung đường ruộng bậc thang. Thưởng thức bữa trưa đặc sản rồi trở về.', image: '' },
    ],
  ],
  3: [
    [
      { day: 'Ngày 1', meals: 'Ăn trưa, Ăn tối', content: 'Di chuyển từ Hà Nội, dừng chân nghỉ ngơi dọc đường, đến nơi vào buổi chiều. Nhận phòng và tản bộ ngắm cảnh hoàng hôn. Ăn tối với lẩu cá hồi tươi.', image: '' },
      { day: 'Ngày 2', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Tham quan thác nước hùng vĩ, trekking qua rừng nguyên sinh, ghé thăm bản người Mông. Chiều tham gia workshop nhuộm chàm truyền thống. Tối thưởng thức BBQ tại homestay.', image: '' },
      { day: 'Ngày 3', meals: 'Ăn sáng, Ăn trưa', content: 'Tham quan chợ phiên buổi sáng, mua quà lưu niệm thủ công mỹ nghệ. Ăn trưa rồi khởi hành trở về Hà Nội, dự kiến đến nơi vào tối.', image: '' },
    ],
    [
      { day: 'Ngày 1', meals: 'Ăn trưa, Ăn tối', content: 'Xuất phát sáng sớm, đi qua đèo với cảnh quan hùng vĩ. Dừng chân chụp ảnh tại các điểm view đẹp nhất. Đến khách sạn, tự do khám phá khu vực lân cận.', image: '' },
      { day: 'Ngày 2', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Ngày dành trọn cho trekking: chinh phục đỉnh núi, qua suối, ghé hang động. Picnic giữa rừng. Chiều về homestay nghỉ ngơi, tắm lá thuốc người Dao.', image: '' },
      { day: 'Ngày 3', meals: 'Ăn sáng, Ăn trưa', content: 'Buổi sáng tham quan vườn hoa, đồi chè. Mua đặc sản địa phương làm quà. Ăn trưa và trả phòng, lên xe về lại thành phố.', image: '' },
    ],
  ],
  4: [
    [
      { day: 'Ngày 1', meals: 'Ăn trưa, Ăn tối', content: 'Xuất phát từ thành phố, vượt đèo ngắm cảnh hùng vĩ. Đến nơi check-in resort 4 sao, thư giãn spa buổi chiều. Ăn tối buffet đặc sản vùng cao.', image: '' },
      { day: 'Ngày 2', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Tham quan quần thể danh thắng, di tích lịch sử. Ăn trưa tại nhà hàng view núi. Chiều thăm bản làng người Thái, học dệt thổ cẩm.', image: '' },
      { day: 'Ngày 3', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Ngày mạo hiểm: chèo thuyền kayak trên hồ, đạp xe xuyên rừng, leo vách đá. Tối BBQ và chương trình văn nghệ dân gian.', image: '' },
      { day: 'Ngày 4', meals: 'Ăn sáng, Ăn trưa', content: 'Ngủ nướng, ăn sáng thong thả. Ghé chợ phiên sắm quà đặc sản. Trưa lên xe trở về, dừng nghỉ dọc đường tại quán cà phê view đèo.', image: '' },
    ],
  ],
  5: [
    [
      { day: 'Ngày 1', meals: 'Ăn trưa, Ăn tối', content: 'Bay từ TP.HCM ra Hà Nội, xe đón đưa lên vùng cao. Nhận phòng khách sạn, dạo phố cổ buổi tối, thưởng thức phở nóng.', image: '' },
      { day: 'Ngày 2', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Tham quan đỉnh Fansipan bằng cáp treo, chiêm ngưỡng biển mây. Chiều xuống thung lũng Mường Hoa ngắm ruộng bậc thang. Tối ăn lẩu thả tại nhà hàng ven suối.', image: '' },
      { day: 'Ngày 3', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Di chuyển qua các bản Tả Van, Tả Phìn. Trải nghiệm tắm lá thuốc người Dao Đỏ. Học nấu món thắng cố truyền thống. Đêm xem biểu diễn khèn Mông.', image: '' },
      { day: 'Ngày 4', meals: 'Ăn sáng, Ăn trưa, Ăn tối', content: 'Trekking cung đường mới qua rừng trúc, qua cầu treo. Picnic bên thác nước. Chiều về homestay làm bánh dày cùng dân bản. Tối tiệc chia tay quanh bếp lửa.', image: '' },
      { day: 'Ngày 5', meals: 'Ăn sáng, Ăn trưa', content: 'Sáng tự do mua sắm tại chợ Sapa. Trưa ăn bún riêu đặc biệt rồi xuống xe về Hà Nội, bay trở lại TP.HCM.', image: '' },
    ],
  ],
};

/* ── Template tên tour theo location & category ── */
function generateTourName(loc, cat, variant) {
  const templates = [
    `Khám phá ${loc} ${variant} – Hành trình ${cat}`,
    `${loc} ${variant} – Trải nghiệm ${cat} đặc sắc`,
    `Tour ${loc} ${variant} – ${cat} tuyệt vời`,
    `Hành trình ${cat} ${loc} ${variant}`,
    `${loc} ${variant} – Điểm đến ${cat} lý tưởng`,
    `Chuyến đi ${loc} ${variant} – ${cat} khó quên`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

const VARIANT_LABELS = ['Premium', 'Tiết Kiệm', 'Gia Đình', 'Giới Trẻ', 'VIP', 'Classic', 'Đặc Biệt', 'Cao Cấp'];

function generateHighlights(loc, numDays) {
  const pool = [
    `Ngắm cảnh ${loc} từ trên cao`,
    'Trải nghiệm văn hoá dân tộc thiểu số',
    'Thưởng thức ẩm thực đặc sản vùng cao',
    'Trekking qua ruộng bậc thang tuyệt đẹp',
    'Check-in tại các điểm view triệu like',
    'Tắm lá thuốc người Dao Đỏ',
    'Đốt lửa trại dưới bầu trời sao',
    'Tham quan chợ phiên đặc sắc',
    'Chụp ảnh biển mây sớm mai',
    'Chinh phục đèo núi hùng vĩ',
    `Lưu trú ${numDays > 3 ? 'resort cao cấp' : 'homestay ấm cúng'}`,
    'Học làm đồ thủ công mỹ nghệ truyền thống',
    'Chèo thuyền kayak trên hồ nước xanh ngọc',
    'Thăm quan hang động kỳ bí',
    'Xem biểu diễn khèn Mông đặc sắc',
  ];
  const count = Math.min(4 + Math.floor(Math.random() * 3), pool.length);
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/* ── Tạo lịch khởi hành đa dạng ── */
function generateDepartures(numDays, tier) {
  const basePrices = {
    budget:  { adult: 1500000, child: 900000,  baby: 300000 },
    mid:     { adult: 3500000, child: 2000000, baby: 500000 },
    premium: { adult: 6000000, child: 3500000, baby: 800000 },
    vip:     { adult: 9500000, child: 5500000, baby: 1200000 },
  };
  const base = basePrices[tier] || basePrices.mid;
  const departures = [];
  const startDate = new Date(2026, 4, 1); // tháng 5/2026

  const numDepartures = 4 + Math.floor(Math.random() * 8); // 4–11 lịch

  for (let i = 0; i < numDepartures; i++) {
    const dep = new Date(startDate);
    dep.setDate(dep.getDate() + i * (5 + Math.floor(Math.random() * 10)));
    const ret = new Date(dep);
    ret.setDate(ret.getDate() + numDays - 1);

    const priceMultiplier = 0.85 + Math.random() * 0.35; // 85%–120%
    const surcharge = Math.random() < 0.3 ? Math.round(Math.random() * 500000 / 50000) * 50000 : 0;
    const maxSlots = [15, 20, 25, 30, 35, 40][Math.floor(Math.random() * 6)];

    departures.push({
      date: formatDate(dep),
      returnDate: formatDate(ret),
      dayOfWeek: DAYS_OF_WEEK[dep.getDay() === 0 ? 6 : dep.getDay() - 1],
      transport: TRANSPORTS[Math.floor(Math.random() * TRANSPORTS.length)],
      adultPrice: Math.round(base.adult * priceMultiplier * numDays / 3 / 50000) * 50000,
      childPrice: Math.round(base.child * priceMultiplier * numDays / 3 / 50000) * 50000,
      babyPrice:  Math.round(base.baby  * priceMultiplier * numDays / 3 / 50000) * 50000,
      surcharge,
      maxslots: maxSlots,
      availableslots: maxSlots - Math.floor(Math.random() * Math.min(8, maxSlots)),
    });
  }
  return departures;
}

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ═══════════════════════════════  MAIN  ═══════════════════════════════ */
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    /* ── 1. Tạo Categories & Locations (upsert) ── */
    const catDocs = [];
    for (const c of CATEGORIES) {
      const doc = await Category.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
      catDocs.push(doc);
    }
    console.log(`📂 ${catDocs.length} Categories sẵn sàng`);

    const locDocs = [];
    for (const l of LOCATIONS) {
      const doc = await Location.findOneAndUpdate({ name: l.name }, l, { upsert: true, new: true });
      locDocs.push(doc);
    }
    console.log(`📍 ${locDocs.length} Locations sẵn sàng`);

    /* ── 2. Tạo 3 tài khoản Partner ── */
    const partnerData = [
      { email: 'partner1@taybac.com', password: 'Partner@123', fullname: 'Công ty Du Lịch Tây Bắc Xanh',  companyname: 'Tây Bắc Xanh Travel', taxcode: '0123456789', role: 'Partner', isTrusted: true },
      { email: 'partner2@taybac.com', password: 'Partner@123', fullname: 'Công ty Du Lịch Sao Vàng',       companyname: 'Sao Vàng Tourism',     taxcode: '9876543210', role: 'Partner', isTrusted: true },
      { email: 'partner3@taybac.com', password: 'Partner@123', fullname: 'Công ty TNHH Mây Núi Adventures', companyname: 'Mây Núi Adventures',   taxcode: '1122334455', role: 'Partner', isTrusted: false },
    ];
    const partners = [];
    for (const p of partnerData) {
      let user = await User.findOne({ email: p.email });
      if (!user) {
        const hashed = await bcrypt.hash(p.password, 10);
        user = await User.create({ ...p, password: hashed, createat: new Date() });
      }
      partners.push(user);
    }
    console.log(`👤 ${partners.length} Partners sẵn sàng`);

    /* ── 3. Tạo Tours ── */
    const TIERS = ['budget', 'mid', 'premium', 'vip'];
    const DURATIONS = [
      { days: 2, label: '2 Ngày 1 Đêm' },
      { days: 3, label: '3 Ngày 2 Đêm' },
      { days: 4, label: '4 Ngày 3 Đêm' },
      { days: 5, label: '5 Ngày 4 Đêm' },
    ];

    let tourCount = 0;
    const allTours = [];

    for (const loc of locDocs) {
      // Mỗi location tạo 3–5 tour
      const numTours = 3 + Math.floor(Math.random() * 3);
      for (let t = 0; t < numTours; t++) {
        const cat      = pickRandom(catDocs);
        const dur      = pickRandom(DURATIONS);
        const tier     = pickRandom(TIERS);
        const variant  = pickRandom(VARIANT_LABELS);
        const partner  = pickRandom(partners);

        const tourName = generateTourName(loc.name, cat.name, variant);
        const code     = `${loc.name.substring(0, 3).toUpperCase()}-${cat.name.substring(0, 3).toUpperCase()}-${String(tourCount + 1).padStart(3, '0')}`;

        // Chọn itinerary phù hợp số ngày
        const templates = ITINERARY_TEMPLATES[dur.days] || ITINERARY_TEMPLATES[3];
        const itinerary = pickRandom(templates);

        const images  = [pickRandom(SAMPLE_IMAGES), pickRandom(SAMPLE_IMAGES)];
        const gallery = SAMPLE_IMAGES.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));

        const tour = {
          name: tourName,
          code,
          duration: dur.label,
          departureLocation: pickRandom(DEPARTURE_LOCATIONS),
          images,
          gallery,
          partner: partner._id,
          location: loc._id,
          category: cat._id,
          highlights: generateHighlights(loc.name, dur.days),
          itinerary,
          departures: generateDepartures(dur.days, tier),
          createdBy: partner._id,
          status: Math.random() < 0.85 ? 'Approved' : 'Pending',
          averageRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          totalReviews: Math.floor(Math.random() * 120),
        };

        allTours.push(tour);
        tourCount++;
      }
    }

    // Xoá tour cũ do seeder tạo (dựa trên code pattern) rồi insert mới
    await Tour.deleteMany({ code: { $regex: /^[A-ZÀ-Ỹ]{3}-[A-ZÀ-Ỹ]{3}-\d{3}$/ } });
    const inserted = await Tour.insertMany(allTours);
    console.log(`\n🎉 Đã tạo thành công ${inserted.length} Tours!`);

    /* ── 4. Tạo 10 tài khoản Customer ── */
    const customerNames = [
      { fullname: 'Nguyễn Văn An',    email: 'customer1@test.com',  phone: '0901111111', cccd: '001099000001' },
      { fullname: 'Trần Thị Bình',    email: 'customer2@test.com',  phone: '0902222222', cccd: '001099000002' },
      { fullname: 'Lê Hoàng Cường',   email: 'customer3@test.com',  phone: '0903333333', cccd: '001099000003' },
      { fullname: 'Phạm Minh Đức',    email: 'customer4@test.com',  phone: '0904444444', cccd: '001099000004' },
      { fullname: 'Hoàng Thị E',      email: 'customer5@test.com',  phone: '0905555555', cccd: '001099000005' },
      { fullname: 'Vũ Quang Phú',     email: 'customer6@test.com',  phone: '0906666666', cccd: '001099000006' },
      { fullname: 'Đặng Ngọc Giang',  email: 'customer7@test.com',  phone: '0907777777', cccd: '001099000007' },
      { fullname: 'Bùi Thanh Hà',     email: 'customer8@test.com',  phone: '0908888888', cccd: '001099000008' },
      { fullname: 'Ngô Đình Khôi',    email: 'customer9@test.com',  phone: '0909999999', cccd: '001099000009' },
      { fullname: 'Dương Thùy Linh',  email: 'customer10@test.com', phone: '0900000000', cccd: '001099000010' },
    ];
    const customers = [];
    for (const c of customerNames) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        const hashed = await bcrypt.hash('Customer@123', 10);
        user = await User.create({ ...c, password: hashed, role: 'Customer', createat: new Date() });
      }
      customers.push(user);
    }
    console.log(`👥 ${customers.length} Customers sẵn sàng`);

    /* ── 5. Tạo BOOKINGS đa dạng (trải đều 6 tháng) ── */
    // Xoá booking cũ do seeder tạo (chỉ xoá booking của customer test)
    const customerIds = customers.map(c => c._id);
    await Booking.deleteMany({ customer: { $in: customerIds } });
    await Review.deleteMany({ user: { $in: customerIds } });

    const BOOKING_STATUSES_GOOD = ['paid', 'confirmed', 'completed'];
    const BOOKING_STATUSES_BAD  = ['cancelled', 'payment_failed'];
    const BOOKING_STATUSES_PENDING = ['pending_payment', 'payment_verifying'];
    const PAYMENT_METHODS = ['VNPAY', 'MOMO', 'BANK_TRANSFER'];

    const PASSENGER_NAMES = [
      'Nguyễn Minh Tuấn', 'Trần Hải Yến', 'Lê Quốc Bảo', 'Phạm Thị Mai',
      'Hoàng Đức Anh', 'Vũ Ngọc Lan', 'Đặng Văn Hùng', 'Bùi Thị Hương',
      'Ngô Thanh Tùng', 'Dương Minh Châu', 'Lý Hoàng Nam', 'Võ Thị Thuỷ',
      'Đinh Quang Huy', 'Phan Thị Ngọc', 'Trương Đức Mạnh', 'Mai Thanh Hà',
    ];

    const REVIEW_COMMENTS = [
      'Tour rất tuyệt vời, hướng dẫn viên nhiệt tình và chuyên nghiệp!',
      'Cảnh đẹp mê hồn, đồ ăn ngon, sẽ quay lại lần sau!',
      'Trải nghiệm tuyệt vời, đáng đồng tiền bát gạo.',
      'Lịch trình hợp lý, không bị rush. Rất thích phần camping buổi tối.',
      'Homestay sạch sẽ, view đẹp. Gia đình rất hài lòng.',
      'Xe đưa đón thoải mái, tài xế lái cẩn thận qua đèo.',
      'Đồ ăn địa phương rất ngon, nhất là lẩu cá hồi và thắng cố.',
      'Tour quá đỉnh! Check-in ruộng bậc thang cực đẹp.',
      'Giá hơi cao nhưng chất lượng dịch vụ xứng đáng.',
      'Trekking mệt nhưng rất đáng, phong cảnh tuyệt vời.',
      'Hướng dẫn viên am hiểu văn hoá bản địa, kể chuyện rất hay.',
      'Thời tiết không ủng hộ nhưng tour vẫn được tổ chức tốt.',
      'Lần đầu đi Tây Bắc, ấn tượng lắm! Chắc chắn sẽ quay lại.',
      'Tour phù hợp cho cả gia đình, con nhỏ cũng thích.',
      'Resort sang trọng, spa thư giãn. Kỳ nghỉ hoàn hảo!',
      'Phong cảnh hoàng hôn trên đèo đẹp như tranh vẽ.',
      'Dịch vụ ổn, nhưng chỗ ăn trưa ngày 2 hơi xa.',
      'Chuyến đi đáng nhớ nhất năm nay, cảm ơn công ty du lịch!',
      'Trải nghiệm tắm lá thuốc người Dao rất thú vị.',
      'Chợ phiên đặc sắc, mua được nhiều quà hay.',
    ];

    // Tạo bookings trải đều từ tháng 11/2025 → tháng 4/2026 (6 tháng)
    const allBookings = [];
    const approvedTours = inserted.filter(t => t.status === 'Approved');

    // Mục tiêu: ~300-500 bookings
    const TOTAL_BOOKINGS_TARGET = 400;

    for (let i = 0; i < TOTAL_BOOKINGS_TARGET; i++) {
      const tour = pickRandom(approvedTours);
      if (!tour.departures || tour.departures.length === 0) continue;

      const departure = pickRandom(tour.departures);
      const customer  = pickRandom(customers);
      const partner   = await User.findById(tour.createdBy);
      const commissionRate = partner?.commissionRate || 10;

      // Ngày booking ngẫu nhiên trong 6 tháng (11/2025 → 4/2026)
      const monthOffset = Math.floor(Math.random() * 6); // 0–5
      const dayInMonth  = 1 + Math.floor(Math.random() * 27);
      const bookingDate = new Date(2025, 10 + monthOffset, dayInMonth); // tháng 11 (index 10)
      // Thêm giờ ngẫu nhiên cho tự nhiên
      bookingDate.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60));

      // Tạo tickets
      const numAdults   = 1 + Math.floor(Math.random() * 4);
      const numChildren = Math.random() < 0.4 ? Math.floor(Math.random() * 3) : 0;
      const numBabies   = Math.random() < 0.2 ? Math.floor(Math.random() * 2) : 0;

      const tickets = [];
      let totalPrice = 0;
      let totalTickets = 0;

      if (numAdults > 0) {
        tickets.push({ ticketType: 'Người lớn', quantity: numAdults, unitPrice: departure.adultPrice });
        totalPrice += numAdults * departure.adultPrice;
        totalTickets += numAdults;
      }
      if (numChildren > 0) {
        tickets.push({ ticketType: 'Trẻ em', quantity: numChildren, unitPrice: departure.childPrice });
        totalPrice += numChildren * departure.childPrice;
        totalTickets += numChildren;
      }
      if (numBabies > 0) {
        tickets.push({ ticketType: 'Em bé', quantity: numBabies, unitPrice: departure.babyPrice });
        totalPrice += numBabies * departure.babyPrice;
        totalTickets += numBabies;
      }

      if (totalTickets === 0) continue;

      // Phân bổ trạng thái: 70% thành công, 15% huỷ/fail, 15% pending
      let status;
      const roll = Math.random();
      if (roll < 0.70) {
        status = pickRandom(BOOKING_STATUSES_GOOD);
      } else if (roll < 0.85) {
        status = pickRandom(BOOKING_STATUSES_BAD);
      } else {
        status = pickRandom(BOOKING_STATUSES_PENDING);
      }

      const adminCommission = Math.round(totalPrice * commissionRate / 100);
      const partnerRevenue  = totalPrice - adminCommission;

      // Tạo representative
      const representative = {
        fullName: customer.fullname || 'Khách hàng',
        phone: customer.phone || '0900000000',
        email: customer.email,
        cccd: customer.cccd || '000000000000',
      };

      // Tạo passengers
      const passengers = [];
      const numPassengers = Math.max(0, totalTickets - 1);
      for (let p = 0; p < numPassengers; p++) {
        const pName = pickRandom(PASSENGER_NAMES);
        let pType = 'Người lớn';
        if (p >= numAdults - 1 && p < numAdults - 1 + numChildren) pType = 'Trẻ em';
        else if (p >= numAdults - 1 + numChildren) pType = 'Em bé';
        passengers.push({
          fullName: pName,
          passengerType: pType,
          cccd_or_birthyear: pType === 'Người lớn' ? `00109900${String(1000 + p).slice(-4)}` : `20${10 + Math.floor(Math.random() * 15)}`,
        });
      }

      // Booking đã hoàn thành mới có thể đánh giá
      const isReviewed = status === 'completed' && Math.random() < 0.65;

      allBookings.push({
        customer: customer._id,
        tour: tour._id,
        departureId: departure._id,
        bookingDate,
        totalprice: totalPrice,
        adminCommission,
        partnerRevenue,
        status,
        expiresAt: new Date(+bookingDate + 24 * 60 * 60 * 1000),
        paymentMethod: pickRandom(PAYMENT_METHODS),
        notes: Math.random() < 0.3 ? pickRandom([
          'Xin sắp xếp phòng gần nhau',
          'Có người dị ứng hải sản',
          'Cần ghế trẻ em trên xe',
          'Muốn xuất phát sớm hơn nếu được',
          'Gia đình có người lớn tuổi, xin đi nhẹ nhàng',
          '',
        ]) : '',
        tickets,
        totalTickets,
        representative,
        passengers,
        isReviewed,
        createdAt: bookingDate,
        updatedAt: bookingDate,
      });
    }

    // Insert bookings (bypass timestamps auto-update bằng cách set trực tiếp)
    const insertedBookings = [];
    for (const bData of allBookings) {
      const b = new Booking(bData);
      b.createdAt = bData.createdAt;
      b.updatedAt = bData.updatedAt;
      // Mongoose sẽ override timestamps, dùng $set trực tiếp
      const saved = await Booking.collection.insertOne({
        ...b.toObject(),
        createdAt: bData.createdAt,
        updatedAt: bData.updatedAt,
      });
      insertedBookings.push({ ...bData, _id: saved.insertedId });
    }
    console.log(`📦 ${insertedBookings.length} Bookings đã được tạo`);

    /* ── 6. Tạo Reviews cho các booking completed + isReviewed ── */
    const reviewBookings = insertedBookings.filter(b => b.isReviewed && b.status === 'completed');
    const allReviews = [];

    for (const b of reviewBookings) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3–5 sao
      allReviews.push({
        user: b.customer,
        tour: b.tour,
        booking: b._id,
        rating,
        comment: pickRandom(REVIEW_COMMENTS),
        createdAt: new Date(+b.createdAt + Math.floor(Math.random() * 7) * 86400000), // 0–7 ngày sau booking
      });
    }

    if (allReviews.length > 0) {
      await Review.insertMany(allReviews);
    }
    console.log(`⭐ ${allReviews.length} Reviews đã được tạo`);

    /* ── 7. Cập nhật averageRating / totalReviews cho Tours ── */
    const reviewsByTour = {};
    for (const r of allReviews) {
      const tid = r.tour.toString();
      if (!reviewsByTour[tid]) reviewsByTour[tid] = [];
      reviewsByTour[tid].push(r.rating);
    }
    for (const [tourId, ratings] of Object.entries(reviewsByTour)) {
      const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
      await Tour.findByIdAndUpdate(tourId, { averageRating: avg, totalReviews: ratings.length });
    }

    /* ── TỔNG KẾT ── */
    const goodBookings = insertedBookings.filter(b => ['paid', 'confirmed', 'completed'].includes(b.status));
    const totalRevenue = goodBookings.reduce((s, b) => s + b.totalprice, 0);

    console.log('\n══════════════════════════════════════');
    console.log('           SEED HOÀN TẤT!            ');
    console.log('══════════════════════════════════════');
    console.log(`  📍 Locations  : ${locDocs.length}`);
    console.log(`  📂 Categories : ${catDocs.length}`);
    console.log(`  👤 Partners   : ${partners.length}`);
    console.log(`  👥 Customers  : ${customers.length}`);
    console.log(`  🗺️  Tours      : ${inserted.length}`);
    const totalDep = inserted.reduce((s, t) => s + t.departures.length, 0);
    console.log(`  📅 Lịch KH    : ${totalDep}`);
    console.log(`  📦 Bookings   : ${insertedBookings.length}`);
    console.log(`     ├─ Thành công: ${goodBookings.length}`);
    console.log(`     ├─ Huỷ/Fail : ${insertedBookings.filter(b => ['cancelled','payment_failed'].includes(b.status)).length}`);
    console.log(`     └─ Pending  : ${insertedBookings.filter(b => ['pending_payment','payment_verifying'].includes(b.status)).length}`);
    console.log(`  ⭐ Reviews    : ${allReviews.length}`);
    console.log(`  💰 Tổng DT    : ${(totalRevenue / 1000000).toFixed(1)}M VND`);
    console.log('══════════════════════════════════════');

  } catch (err) {
    console.error('❌ Lỗi seed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

seed();
