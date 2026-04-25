// src/controllers/chatControllers.js
const aiAgentService = require('../services/aiAgentService'); 

const chatControllers = {
    handleChat: async (req, res) => {
        try {
            const { message, chatHistory, userId } = req.body;
            if (!message) return res.status(400).json({ error: "Tin nhắn không được để trống" });
            const trimmedHistory = chatHistory ? chatHistory.slice(-10) : [];

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

            return res.status(200).json(aiResponse);

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