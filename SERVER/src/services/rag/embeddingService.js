// Đã chuyển sang CommonJS và dùng Dynamic Import để tránh lỗi module
let pipelineInstance = null;

const generateEmbedding = async (text) => {
    try {
        if (!pipelineInstance) {
            // Sử dụng Dynamic import cho thư viện thuần ESM
            const transformers = await import('@xenova/transformers');
            // Tải mô hình
            pipelineInstance = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        const output = await pipelineInstance(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error("❌ Lỗi khi tạo Vector:", error);
        return null;
    }
};

module.exports = { generateEmbedding };