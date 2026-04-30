let pipelineInstance = null;
const generateEmbedding = async (text) => {
  try {
    if (!pipelineInstance) {
      const transformers = await import("@xenova/transformers");
      pipelineInstance = await transformers.pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );
    }
    const output = await pipelineInstance(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
  } catch (error) {
    console.error("❌ Lỗi khi tạo Vector:", error);
    return null;
  }
};
module.exports = { generateEmbedding };
