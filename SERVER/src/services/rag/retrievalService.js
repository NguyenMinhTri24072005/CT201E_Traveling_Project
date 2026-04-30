const Tour = require("../../models/Tours");
const { generateEmbedding } = require("./embeddingService");
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
const semanticSearchLocal = async (query, filters = {}, topK = 3) => {
  try {
    console.log(`[HYBRID RAG] Câu hỏi: "${query}" | Filters:`, filters);
    const dbQuery = { status: "Approved" };
    if (filters.maxPrice) {
      dbQuery["departures.adultPrice"] = {
        $lte: parseInt(filters.maxPrice, 10),
      };
    }
    if (filters.departureLocation) {
      dbQuery["departureLocation"] = {
        $regex: filters.departureLocation,
        $options: "i",
      };
    }
    if (filters.duration) {
      dbQuery["duration"] = {
        $regex: filters.duration.toString(),
        $options: "i",
      };
    }
    const candidateTours = await Tour.find(dbQuery)
      .select(
        "+embeddingVector name code duration departureLocation destination itinerary departures",
      )
      .lean();
    console.log(
      `[HYBRID RAG] Tìm thấy ${candidateTours.length} tour thỏa mãn điều kiện cứng.`,
    );
    if (candidateTours.length === 0) return [];

    if (!query || query.trim() === "") {
      return candidateTours.slice(0, topK).map((t) => {
        delete t.embeddingVector;
        return t;
      });
    }
    const queryVector = await generateEmbedding(query);
    if (!queryVector) return [];
    const scoredTours = candidateTours.map((tour) => {
      const score =
        tour.embeddingVector && tour.embeddingVector.length > 0
          ? cosineSimilarity(queryVector, tour.embeddingVector)
          : 0;
      delete tour.embeddingVector;
      return { ...tour, score };
    });
    const relevantTours = scoredTours.filter((t) => t.score > 0.25);
    relevantTours.sort((a, b) => b.score - a.score);
    return relevantTours.slice(0, topK);
  } catch (error) {
    console.error("[RAG ERROR] Lỗi trong quá trình tìm kiếm:", error);
    return [];
  }
};
module.exports = { semanticSearchLocal };
