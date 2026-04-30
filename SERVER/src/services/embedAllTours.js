require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const Tour = require("../models/Tours");
require("../models/Locations");
require("../models/Categorys");
const { generateEmbedding } = require("./rag/embeddingService");
const generateCleanTextForEmbedding = (tour) => {
  let minPrice = "Đang cập nhật";
  if (tour.departures && tour.departures.length > 0) {
    const validPrices = tour.departures
      .map((d) => d.adultPrice)
      .filter((p) => p != null && p > 0);
    if (validPrices.length > 0) {
      minPrice = Math.min(...validPrices) + " VNĐ";
    }
  }
  const locationName =
    tour.location && tour.location.name ? tour.location.name : "";
  const categoryName =
    tour.category && tour.category.name ? tour.category.name : "";
  const highlightsText =
    tour.highlights && tour.highlights.length > 0
      ? tour.highlights.join(", ")
      : "";
  const itineraryText =
    tour.itinerary && tour.itinerary.length > 0
      ? tour.itinerary.map((item) => `${item.day}: ${item.content}`).join(". ")
      : "";
  const rawText = `
        Tên tour: ${tour.name}. 
        Mã tour: ${tour.code}.
        Thể loại: ${categoryName}.
        Điểm đến: ${locationName}.
        Khởi hành từ: ${tour.departureLocation}. 
        Thời gian: ${tour.duration}. 
        Mức giá chỉ từ: ${minPrice}. 
        Điểm nhấn nổi bật: ${highlightsText}. 
        Lịch trình chi tiết: ${itineraryText}
    `;
  return rawText.replace(/\s+/g, " ").trim();
};
const embedAllTours = async () => {
  try {
    console.log("⏳ Đang kết nối đến MongoDB...");
    const dbURI =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taybac_tourism_db";
    await mongoose.connect(dbURI);
    console.log("✅ Kết nối DB thành công!");
    const tours = await Tour.find({})
      .populate("location", "name")
      .populate("category", "name");
    console.log(`📌 Tìm thấy ${tours.length} tour trong Database.`);
    if (tours.length === 0) {
      console.log("⚠️ Cảnh báo: Database hiện không có tour nào!");
      process.exit(0);
    }
    for (let tour of tours) {
      console.log(`⚙️ Đang xử lý tạo Vector cho: ${tour.name}...`);
      const textToEmbed = generateCleanTextForEmbedding(tour);
      tour.embeddingVector = await generateEmbedding(textToEmbed);
      await tour.save();
      console.log(`✅ Đã lưu Vector thành công cho: ${tour.name}`);
    }
    console.log("🎉 HOÀN TẤT NẠP VECTOR VÀO LOCAL MONGODB!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi trong quá trình chạy:", error);
    process.exit(1);
  }
};
embedAllTours();
