// src/services/aiAgentService.js
const { OpenAI } = require('openai');
const aiTools = require('./aiTools');

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const systemInstruction = `Bạn là "Mây", nữ nhân viên tư vấn du lịch siêu đáng yêu của Tây Bắc Travel.

====================
PERSONA
====================
- Giao tiếp thân thiện, nhiệt tình như một tư vấn viên trẻ tuổi Việt Nam.
- LUÔN LUÔN xưng "em" và gọi khách là "anh/chị" (ngay cả khi khách xưng hô suồng sã như tao/mày).
- Sử dụng các emoji dễ thương, nhẹ nhàng (🌸, ✨, 😊, 🏞️) để tạo sự gần gũi.

====================
KNOWLEDGE RULE
====================
- CHỈ SỬ DỤNG dữ liệu tour có thật được cung cấp từ lịch sử chat hoặc từ công cụ (Tools).
- TUYỆT ĐỐI KHÔNG tự bịa ra (hallucinate) tên tour, địa điểm, lịch trình hay giá tiền.
- Khi giới thiệu một tour, LUÔN LUÔN phải đính kèm giá tiền cụ thể để khách tham khảo.

====================
BEHAVIOR
====================
- Nếu khách chỉ chào hỏi, khen ngợi hoặc trò chuyện xã giao (VD: "chào bé"):
  → CHỈ trả lời giao tiếp tự nhiên. BỊ CẤM gọi công cụ (Tools).
- Nếu khách hỏi lại thông tin ĐÃ CÓ trong lịch sử chat (VD: "tour ở trên giá bao nhiêu"):
  → Tự đọc lại lịch sử để trả lời. KHÔNG gọi công cụ.
- Nếu khách có nhu cầu đi chơi, tìm tour mới, hoặc hỏi chung chung (VD: "mày có gì hay"):
  → BẮT BUỘC gọi công cụ 'find_tours' (để trống tham số nếu khách không nói rõ chi tiết).
- NGUYÊN TẮC KHI GỌI CÔNG CỤ:
  → Khi bạn quyết định gọi công cụ, BẠN PHẢI HOÀN TOÀN IM LẶNG. KHÔNG được sinh ra văn bản hội thoại nào. Chỉ được nói chuyện SAU KHI có kết quả trả về.

====================
FAILSAFE
====================
- Nếu không tìm thấy tour hoặc công cụ không có dữ liệu:
  → Khéo léo trả lời: "Dạ hiện tại em chưa có thông tin chính xác về yêu cầu này, anh/chị tham khảo các tuyến khác giúp em nhé..."
- Nếu khách trêu ghẹo, hỏi chuyện ngoài lề (không liên quan du lịch):
  → Đáp lại tự nhiên, dí dỏm nhưng luôn tìm cách dẫn dắt câu chuyện quay lại việc đi du lịch.`;

const tools = [
    {
        type: "function",
        function: {
            name: "find_tours",
            description: "Tìm kiếm tour du lịch trong cơ sở dữ liệu.",
            parameters: {
                type: "object",
                properties: {
                    destination: { type: "string", description: "Điểm đến (VD: Sapa, Hà Giang)" },
                    keyword: { type: "string", description: "Từ khóa sở thích (VD: lãng mạn, gia đình)" },
                    maxPrice: { type: "string", description: "Mức giá tối đa (VD: 3000000)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_availability",
            description: "Kiểm tra vé, chỗ trống của tour.",
            parameters: {
                type: "object",
                properties: {
                    tourName: { type: "string", description: "Tên tour" },
                    date: { type: "string", description: "Ngày khởi hành (VD: 20/10)" }
                },
                required: ["tourName"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "calculate_total_price",
            description: "Tính tổng tiền tour cho nhiều người.",
            parameters: {
                type: "object",
                properties: {
                    tourName: { type: "string" },
                    adultCount: { type: "string" },
                    childCount: { type: "string" }
                },
                required: ["tourName"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_tour_itinerary",
            description: "Xem lịch trình chi tiết của tour.",
            parameters: {
                type: "object",
                properties: {
                    tourName: { type: "string" }
                },
                required: ["tourName"]
            }
        }
    }
];

const aiAgentService = {
    processUserMessage: async (userMessage, chatHistory = []) => {
        
        const messages = [
            { role: "system", content: systemInstruction },
            ...chatHistory, 
            { role: "user", content: userMessage }
        ];

        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages, 
            tools: tools,
            tool_choice: "auto",
            parallel_tool_calls: false,
        });

        const responseMessage = response.choices[0].message;

        if (responseMessage.tool_calls) {
            const toolCall = responseMessage.tool_calls[0];
            const toolName = toolCall.function.name;
            
            // Xử lý an toàn khi parse arguments
            let args = {};
            try {
                args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
                console.error("Lỗi parse arguments của Tool:", e);
            }

            let toolData = null;

            if (toolName === "find_tours") {
                toolData = await aiTools.executeFindTours(args);
            }
            else if (toolName === "check_availability") {
                toolData = await aiTools.executeCheckAvailability(args);
            }
            else if (toolName === "calculate_total_price") {
                toolData = await aiTools.executeCalculatePrice(args);
            }
            else if (toolName === "get_tour_itinerary") {
                toolData = await aiTools.executeGetItinerary(args);
            }

            messages.push(responseMessage);
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify(toolData)
            });

            const finalResponse = await groqClient.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages, 
            });

            return {
                reply: finalResponse.choices[0].message.content,
                thinkingType: "slow Thinking"
            };
        }

        else {
            console.log("fast thinking");
            return {
                reply: responseMessage.content,
                thinkingType: "fast Thinking"
            };
        }
    }
};

module.exports = aiAgentService;