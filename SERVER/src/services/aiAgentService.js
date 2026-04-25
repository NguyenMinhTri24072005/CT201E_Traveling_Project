// src/services/aiAgentService.js
const { OpenAI } = require('openai');
const aiTools = require('./aiTools');

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const systemInstruction = `
Bạn là "Mây", nữ nhân viên tư vấn du lịch siêu đáng yêu của Tây Bắc Travel.
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
            description: "Tìm kiếm tour du lịch trong cơ sở dữ liệu dựa trên địa điểm, sở thích, điểm khởi hành, số ngày hoặc ngân sách.",
            parameters: {
                type: "object",
                properties: {
                    destination: { type: "string", description: "Điểm đến (VD: Sapa, Hà Giang)" },
                    keyword: { type: "string", description: "Từ khóa sở thích (VD: lãng mạn, gia đình)" },
                    departureLocation: { type: "string", description: "Điểm khởi hành (VD: Cần Thơ, Hà Nội)" },
                    duration: { type: "number", description: "Số ngày đi tour (VD: đi 3 ngày 2 đêm thì nhập 3)" },
                    maxPrice: { type: "number", description: "Mức giá tối đa bằng số (VD: 3000000)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_tour_details",
            description: "Xem chi tiết một tour bao gồm lịch trình, chính sách hoàn hủy và dịch vụ bao gồm/loại trừ. Thay thế cho get_tour_itinerary.",
            parameters: {
                type: "object",
                properties: {
                    tourName: { type: "string", description: "Tên tour cần xem chi tiết" }
                },
                required: ["tourName"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_availability",
            description: "Kiểm tra vé, chỗ trống của tour trong một ngày cụ thể.",
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
                    tourName: { type: "string", description: "Tên tour khách muốn tính giá" },
                    adultCount: { type: "number", description: "Số lượng người lớn (VD: 2)" },
                    childCount: { type: "number", description: "Số lượng trẻ em (VD: 1)" }
                },
                required: ["tourName", "adultCount"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "request_booking",
            description: "Tạo yêu cầu đặt tour (booking nháp) vào hệ thống. LƯU Ý: Phải hỏi và thu thập đủ thông tin người đại diện (Tên, SĐT, Email, CCCD) trước khi gọi hàm này.",
            parameters: {
                type: "object",
                properties: {
                    tourName: { type: "string", description: "Tên tour khách muốn đặt" },
                    departureDate: { type: "string", description: "Ngày khởi hành mong muốn (VD: 25/12/2026)" },
                    adultCount: { type: "number", description: "Số lượng người lớn" },
                    childCount: { type: "number", description: "Số lượng trẻ em (nếu không có thì để 0)" },
                    fullName: { type: "string", description: "Họ và tên người đại diện đặt tour" },
                    phone: { type: "string", description: "Số điện thoại liên hệ" },
                    email: { type: "string", description: "Email của người đại diện" },
                    cccd: { type: "string", description: "Số Căn cước công dân (CCCD) của người đại diện" },
                    notes: { type: "string", description: "Ghi chú thêm của khách (Ví dụ: ăn chay, say xe). Bỏ qua nếu không có." }
                },
                required: [
                    "tourName", "departureDate", "adultCount", 
                    "fullName", "phone", "email", "cccd"
                ]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_faq_info",
            description: "Truy vấn các câu hỏi thường gặp về công ty (VD: địa chỉ ở đâu, độ uy tín, chính sách bảo hiểm, quy định chung).",
            parameters: {
                type: "object",
                properties: {
                    question: { type: "string", description: "Câu hỏi của khách (VD: Công ty có bảo hiểm du lịch không?)" }
                },
                required: ["question"]
            }
        }
    }
];

const aiAgentService = {
    processUserMessage: async (userMessage, chatHistory = []) => {
        try {
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
                    console.error("[AI ERROR] Lỗi parse arguments của Tool:", e);
                }

                let toolData = null;

                // BỔ SUNG ÁNH XẠ ĐẦY ĐỦ 6 TOOLS
                if (toolName === "find_tours") {
                    toolData = await aiTools.executeFindTours(args);
                }
                else if (toolName === "get_tour_details") { // Thay thế cho get_tour_itinerary cũ
                    toolData = await aiTools.executeGetTourDetails(args);
                }
                else if (toolName === "check_availability") {
                    toolData = await aiTools.executeCheckAvailability(args);
                }
                else if (toolName === "calculate_total_price") {
                    toolData = await aiTools.executeCalculatePrice(args);
                }
                else if (toolName === "request_booking") { // Tool mới: Đặt tour
                    toolData = await aiTools.executeRequestBooking({ ...args, userId });
                }
                else if (toolName === "get_faq_info") { // Tool mới: Thông tin công ty
                    toolData = await aiTools.executeGetFaqInfo(args);
                }
                else {
                    console.warn(`[WARNING] AI gọi công cụ không tồn tại: ${toolName}`);
                    toolData = { error: `Công cụ ${toolName} không được hệ thống hỗ trợ.` };
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
                console.log("[AI] fast thinking");
                return {
                    reply: responseMessage.content,
                    thinkingType: "fast Thinking"
                };
            }
        } catch (error) {
            console.error("[AI SERVICE ERROR] Lỗi trong quá trình xử lý tin nhắn:", error);
            return {
                reply: "Dạ hệ thống của em đang gặp chút gián đoạn, anh/chị chờ em một lát rồi nhắn lại nhé! 🌸",
                thinkingType: "error"
            };
        }
    }
};

module.exports = aiAgentService;