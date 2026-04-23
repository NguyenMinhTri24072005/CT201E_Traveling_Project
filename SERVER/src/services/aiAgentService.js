// src/services/aiAgentService.js
const { OpenAI } = require('openai');
const aiTools = require('./aiTools');

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const systemInstruction = `Bạn là Trợ lý ảo chuyên nghiệp của Tây Bắc Travel.
                        ĐỊNH HÌNH NHÂN CÁCH (PERSONA)
                        Bạn là "Mây" - Nữ nhân viên tư vấn du lịch vô cùng đáng yêu và chuyên nghiệp của Tây Bắc Travel. 
                        - Tính cách: Cực kỳ niềm nở, nhiệt tình, ân cần và luôn vui vẻ. 
                        - Xưng hô: Luôn xưng là "em" và gọi khách là "anh/chị" hoặc "bạn". 
                        - Văn phong: Sử dụng đa dạng các emoji dễ thương (như 🌸, ✨, 😊, 🎒, 🏞️) để tạo sự thân thiện. Luôn cảm ơn khách đã quan tâm.
                        - Kỹ năng Sale: Sau khi cung cấp thông tin (như giá tour, chỗ trống), LUÔN LUÔN kết thúc bằng một câu hỏi gợi mở để chốt sale hoặc giữ chân khách (Ví dụ: "Anh/chị thấy lịch trình này hợp lý không ạ?", "Mình đi mấy người để em giữ chỗ luôn cho nhé?").

                        QUY TẮC PHẢI TUÂN THỦ TUYỆT ĐỐI (BẮT BUỘC TUÂN THỦ 100%):
                        1. TUYỆT ĐỐI KHÔNG tự tư vấn lịch trình, giá cả, hay kinh nghiệm bằng kiến thức cá nhân.
                        2. Khi khách hỏi tìm tour, giá tiền, ngân sách -> BẮT BUỘC GỌI CÔNG CỤ 'find_tours'.
                        3. Khi khách hỏi "còn chỗ không", "còn nhận khách không", hỏi vé ngày cụ thể -> BẮT BUỘC GỌI CÔNG CỤ 'check_availability'.
                        4. CHỈ ĐƯỢC PHÉP tự trả lời trực tiếp (không gọi hàm) khi khách nói những câu giao tiếp xã giao như: "chào bạn", "cảm ơn", "tạm biệt".
                        5. Khi khách hỏi TÍNH CHI PHÍ, TỔNG TIỀN cho số lượng người cụ thể (người lớn, trẻ em) -> BẮT BUỘC GỌI CÔNG CỤ 'calculate_total_price'.
                        
                        QUY TẮC BỔ SUNG:
                        - Khi trả về lịch trình (itinerary), hãy trình bày theo dạng danh sách (bullet points) từng ngày thật rõ ràng.
                        - Sử dụng các từ ngữ gợi cảm xúc như "khám phá", "thưởng thức", "chiêm ngưỡng".
                        - Nếu lịch trình quá dài, hãy tóm tắt những điểm chính nổi bật nhất để khách không bị choáng ngợp.`;

const tools = [
    {
        type: "function",
        function: {
            name: "find_tours",
            description: "Công cụ truy xuất Tour từ Cơ sở dữ liệu. BẮT BUỘC GỌI HÀM NÀY NẾU CÂU HỎI CỦA KHÁCH CÓ LIÊN QUAN ĐẾN TÌM TOUR, ĐỊA ĐIỂM HOẶC GIÁ TIỀN.",
            parameters: {
                type: "object",
                properties: {
                    destination: {
                        type: "string",
                        description: "Tên địa danh khách muốn đến (VD: Sapa, Hà Giang)."
                    },
                    maxPrice: {
                        type: "string",
                        description: "Giá tiền tối đa khách có thể trả (nhập bằng số, VD: 5000000)."
                    },
                    minPrice: {
                        type: "string",
                        description: "giá tiền tối thiểu khách yêu cầu (nhập bằng số, VD: 5000000)"
                    },
                    keyword: {
                        type: "string",
                        description: "Từ khóa trải nghiệm (VD: lúa chín, săn mây, rẻ, hot)."
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_availability",
            description: "Công cụ kiểm tra số lượng CHỖ TRỐNG (vé còn lại) của một tour. Gọi hàm này khi khách hỏi: còn chỗ không, còn nhận khách không, ngày X đi Sapa còn vé không.",
            parameters: {
                type: "object",
                properties: {
                    tourName: {
                        type: "string",
                        description: "Tên địa danh hoặc tên tour (VD: Sapa, Hà Giang)."
                    },
                    date: {
                        type: "string",
                        description: "Ngày khởi hành khách muốn đi (VD: 20/10, 2/9, tuần sau). Nếu khách không nói, hãy để rỗng."
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "calculate_total_price",
            description: "Công cụ tính TỔNG CHI PHÍ. Gọi hàm này khi khách yêu cầu tính tiền cho bao nhiêu người lớn, bao nhiêu trẻ em.",
            parameters: {
                type: "object",
                properties: {
                    tourName: { 
                        type: "string", 
                        description: "Tên địa danh hoặc tour (VD: Sapa)" 
                    },
                    adultCount: { 
                        type: "string", 
                        description: "Số lượng người lớn (VD: '2')" 
                    },
                    childCount: { 
                        type: "string", 
                        description: "Số lượng trẻ em (VD: '1')" 
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_tour_itinerary",
            description: "Dùng để xem lịch trình chi tiết từng ngày của một tour. Gọi khi khách hỏi: đi đâu, lịch trình thế nào, ngày 1 làm gì...",
            parameters: {
                type: "object",
                properties: {
                    tourName: { type: "string", description: "Tên địa danh hoặc tour (VD: Sapa)" }
                },
                required: ["tourName"]
            }
        }
    }
];

const aiAgentService = {
    processUserMessage: async (userMessage) => {
        const messages = [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage }
        ];

        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            tools: tools,
            tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;

        if (responseMessage.tool_calls) {
            const toolCall = responseMessage.tool_calls[0];
            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

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