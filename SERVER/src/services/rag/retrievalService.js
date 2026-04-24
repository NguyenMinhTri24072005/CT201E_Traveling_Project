// SERVER/src/services/rag/retrievalService.js
const Tour = require('../../models/Tours'); 
const { generateEmbedding } = require('./embeddingService');

const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// 👉 TỐI ƯU: Nhận thêm tham số filters và topK
const semanticSearchLocal = async (query, filters = {}, topK = 3) => {
    try {
        console.log(`[HYBRID RAG] Câu hỏi: "${query}" | Filters:`, filters);

        // ==========================================
        // BƯỚC 1: LỌC CỨNG (HARD FILTER) BẰNG MONGODB
        // ==========================================
        const dbQuery = { status: 'Approved' };

        // 1.1 Lọc theo ngân sách tối đa
        if (filters.maxPrice) {
            dbQuery['departures.adultPrice'] = { $lte: parseInt(filters.maxPrice, 10) };
        }

        // 1.2 Lọc theo điểm khởi hành
        if (filters.departureLocation) {
            dbQuery['departureLocation'] = { $regex: filters.departureLocation, $options: 'i' };
        }

        // 1.3 Lọc theo số ngày đi (duration)
        if (filters.duration) {
            dbQuery['duration'] = { $regex: filters.duration.toString(), $options: 'i' };
        }

        // 👉 Kéo danh sách tour ĐÃ LỌC từ DB (Giúp giải phóng 90% RAM)
        const candidateTours = await Tour.find(dbQuery)
            .select('+embeddingVector name code duration departureLocation destination itinerary departures')
            .lean();
            
        console.log(`[HYBRID RAG] Tìm thấy ${candidateTours.length} tour thỏa mãn điều kiện cứng.`);

        if (candidateTours.length === 0) return []; // Không có tour nào phù hợp túi tiền/địa điểm

        // Nếu khách chỉ lọc giá, không có nhu cầu tìm kiếm ngữ nghĩa, trả về luôn topK
        if (!query || query.trim() === '') {
            return candidateTours.slice(0, topK).map(t => {
                delete t.embeddingVector; // Xóa cho nhẹ
                return t;
            });
        }

        // ==========================================
        // BƯỚC 2: LỌC MỀM (SOFT FILTER) BẰNG VECTOR
        // ==========================================
        const queryVector = await generateEmbedding(query);
        if (!queryVector) return [];

        const scoredTours = candidateTours.map(tour => {
            const score = tour.embeddingVector && tour.embeddingVector.length > 0
                ? cosineSimilarity(queryVector, tour.embeddingVector) 
                : 0;
            
            delete tour.embeddingVector; // Chấm điểm xong thì xóa Vector cho nhẹ bộ nhớ trả về
            return { ...tour, score };
        });
        
        // 👉 TỐI ƯU: Chỉ giữ lại những tour có điểm Cosine > 0.25 (Độ liên quan đủ tốt)
        const relevantTours = scoredTours.filter(t => t.score > 0.25);

        // Sắp xếp và lấy top K
        relevantTours.sort((a, b) => b.score - a.score);
        return relevantTours.slice(0, topK);

    } catch (error) {
        console.error("[RAG ERROR] Lỗi trong quá trình tìm kiếm:", error);
        return [];
    }
};

module.exports = { semanticSearchLocal };