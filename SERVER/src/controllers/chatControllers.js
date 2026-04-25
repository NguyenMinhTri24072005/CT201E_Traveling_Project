// src/controllers/chatControllers.js
const aiAgentService = require('../services/aiAgentService'); 

/**
 * Chuyển đổi chatHistory từ định dạng Gemini (role: 'model')
 * sang định dạng OpenAI/Groq (role: 'assistant').
 * Đồng thời lọc bỏ các entry có role không hợp lệ để tránh lỗi API.
 */
const sanitizeChatHistory = (history) => {
    if (!Array.isArray(history)) return [];

    return history
        .map(entry => {
            if (!entry || typeof entry !== 'object') return null;

            // Normalize role: 'model' (Gemini) → 'assistant' (OpenAI/Groq)
            const role = entry.role === 'model' ? 'assistant' : entry.role;

            // Chỉ giữ các role hợp lệ
            if (!['user', 'assistant'].includes(role)) return null;

            // Đảm bảo content là string
            const content = typeof entry.content === 'string'
                ? entry.content
                : (entry.parts?.[0]?.text ?? ''); // fallback cho format Gemini cũ

            if (!content) return null;

            return { role, content };
        })
        .filter(Boolean); // loại bỏ null
};

const chatControllers = {
    handleChat: async (req, res) => {
        try {
            const { message, chatHistory } = req.body;
            const userId = req.user?.id || req.user?._id || null;
            if (!message) return res.status(400).json({ error: "Tin nhắn không được để trống" });

            // Sanitize → đảm bảo đúng format OpenAI/Groq trước khi slice
            const sanitizedHistory = sanitizeChatHistory(chatHistory);
            const trimmedHistory = sanitizedHistory.slice(-10);

            const sensitiveWords = ["đéo", "nín", "cút", "vcl"];
            const hasSensitiveWord = sensitiveWords.some(word => message.toLowerCase().includes(word));

            if (hasSensitiveWord) {
                return res.status(200).json({
                    reply: "Tây Bắc Travel mong muốn mang lại trải nghiệm tốt nhất. Bạn vui lòng sử dụng ngôn ngữ lịch sự nhé!",
                    thinkingType: "System Filter"
                });
            }

            console.log("\nKhách hàng:", message);

            const agentResponse = await aiAgentService.processUserMessage(message, trimmedHistory, userId);

            return res.status(200).json(agentResponse);

        } catch (error) {
            if (error.status === 503 || error.status === 429) {
                return res.status(200).json({
                    reply: "nghẽn ời, tí quay lại",
                    thinkingType: "system busy"
                });
            }
            
            console.error("Lỗi ở chatController:", error);
            res.status(500).json({ error: "sập ời, đợi tí" });
        }
    }
};

module.exports = chatControllers;