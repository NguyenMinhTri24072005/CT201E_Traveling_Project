// Đã chuyển sang CommonJS
const Tour = require('../../models/Tours'); // Sửa lại đường dẫn và bỏ đuôi .js
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

const semanticSearchLocal = async (query) => {
    console.log(`[RAG] Đang tạo Vector cho câu hỏi: "${query}"`);
    const queryVector = await generateEmbedding(query);
    
    if (!queryVector) return [];

    console.log(`[RAG] Bắt đầu quét và tính điểm Cosine cho Database...`);
    const allTours = await Tour.find({ status: 'Approved' })
        .select('+embeddingVector name price duration departureLocation destination itinerary')
        .lean();
    
    const scoredTours = allTours.map(tour => {
        const score = tour.embeddingVector && tour.embeddingVector.length > 0
            ? cosineSimilarity(queryVector, tour.embeddingVector) 
            : 0;
        delete tour.embeddingVector; 
        return { ...tour, score };
    });
    
    // Sắp xếp và lấy top 3
    scoredTours.sort((a, b) => b.score - a.score);
    return scoredTours.slice(0, 3);
};

module.exports = { semanticSearchLocal };