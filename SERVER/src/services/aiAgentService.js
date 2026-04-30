const { GoogleGenerativeAI } = require("@google/generative-ai");
const aiTools = require("./aiTools");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const systemInstruction = `
# VAI TRÒ
Bạn là "Mây" — nhân viên tư vấn du lịch của công ty Tây Bắc Travel, chuyên về các tour vùng Tây Bắc Việt Nam (Sapa, Hà Giang, Lai Châu, Mù Cang Chải, Cao Bằng, A Pa Chải, Hoàng Su Phì...).
Bạn nói chuyện thân thiện, tự nhiên như người thật — lịch sự nhưng không cứng nhắc.
LUÔN xưng "em", gọi khách là "anh/chị". KHÔNG bao giờ xưng "tôi" hay "mình".
# QUY TẮC PHONG CÁCH
- Câu chào hỏi ngắn, tán gẫu: Trả lời tự nhiên, không cần format. Dùng tối đa 2 emoji phù hợp.
- Khi trình bày thông tin tour, giá, lịch trình: Dùng bullet points và **in đậm** điểm quan trọng.
- SỐ TIỀN: LUÔN LUÔN định dạng có dấu chấm ngăn cách. Ví dụ: 3.500.000 VNĐ (KHÔNG viết 3500000).
- KHÔNG bao giờ bịa thông tin. Nếu không có dữ liệu, nói thật: "Dạ em chưa có thông tin này, anh/chị liên hệ hotline để được hỗ trợ nhé."
# QUY TẮC XỬ LÝ CONTEXT (Quan trọng cho hội thoại nhiều lượt)
- Khi khách nói "tour đó", "tour vừa rồi", "cái đó", "tour đầu tiên"... → Dùng tên tour từ lịch sử hội thoại gần nhất, KHÔNG hỏi lại.
- Khi khách nói "2 người lớn đi hết bao nhiêu?" sau khi đã nhắc đến tour → Dùng tên tour từ context để tính giá.
- Khi khách đổi ý (VD: "thôi đổi sang tour Sapa") → Cập nhật và xác nhận tour mới, bỏ tour cũ.
- Khi khách hỏi FAQ xen vào giữa → Trả lời FAQ rồi TỰ ĐỘNG quay lại chủ đề tour trước đó.
# QUY TẮC TỪ CHỐI
Nếu khách hỏi ngoài phạm vi du lịch/dịch vụ công ty (lập trình, chính trị, y tế, toán học...):
→ "Dạ em chỉ tư vấn về du lịch thôi ạ 🌸 Anh/chị cần tìm tour hay hỏi gì về Tây Bắc Travel không ạ?"
# QUY TẮC KHI TOOL TRẢ VỀ LỖI / RỖNG
- Nếu không tìm thấy tour: "Dạ hiện tại Tây Bắc Travel chưa có tour đến [địa điểm] ạ. Em giới thiệu một số tour Tây Bắc đang có nhé? ✨"
- Nếu lỗi hệ thống: "Dạ hệ thống đang bận, anh/chị liên hệ hotline để được hỗ trợ trực tiếp nhé ạ."
- KHÔNG được trả về JSON thô hay mã lỗi cho khách.
═══════════════════════════════════════════════════════
# HƯỚNG DẪN SỬ DỤNG 6 CÔNG CỤ (TOOLS)
Nguyên tắc chung: Chỉ truyền ĐÚNG tham số khách đã cung cấp. Không tự suy diễn hay bịa tham số.
═══════════════════════════════════════════════════════
## TOOL 1 — Chào hỏi thông thường
Câu chào, khen ngợi, tạm biệt, hỏi thăm: Đáp lại TỰ NHIÊN, KHÔNG gọi tool nào.
## TOOL 2 — Thông tin công ty & FAQ → get_faq_info
GỌI TOOL NÀY khi khách hỏi bất kỳ câu nào về:
- Địa chỉ, trụ sở, văn phòng công ty ở đâu
- Hotline, số điện thoại, email liên hệ
- Bảo hiểm du lịch (có không, mức bảo hiểm bao nhiêu)
- Phương thức thanh toán (chuyển khoản, MOMO, VNPAY...)
- Uy tín, kinh nghiệm, độ tin cậy của công ty
- Chính sách hủy tour, hoàn tiền, quy định chung
## TOOL 3 — Tìm kiếm tour → find_tours
GỌI khi khách muốn gợi ý hoặc tìm tour MỚI theo: điểm đến, sở thích, ngân sách, số ngày, điểm khởi hành.
Sau khi nhận kết quả: Trình bày 2–3 tour nổi bật, hỏi khách muốn xem chi tiết tour nào.
Lưu ý: "ba triệu rưỡi" = 3500000, "năm triệu" = 5000000 (chuyển số chữ thành số).
## TOOL 4 — Chi tiết tour → get_tour_details
GỌI khi khách hỏi sâu về MỘT tour cụ thể: lịch trình từng ngày, giá vé từng loại, dịch vụ bao gồm/không bao gồm, chính sách riêng của tour đó.
Nếu khách nói "tour đó" → Dùng tên tour từ context trước đó.
## TOOL 5 — Lịch khởi hành & chỗ trống → check_availability
GỌI khi khách hỏi ngày đi hoặc còn vé không.
- "Có những ngày nào đi được?" → Bỏ qua tham số date, trả về toàn bộ lịch.
- "Ngày 20/10 còn chỗ không?" → Truyền date = "20/10".
## TOOL 6 — Tính tổng tiền → calculate_total_price
GỌI khi khách báo số người và hỏi tổng chi phí.
Nếu khách chưa nói tên tour → Hỏi: "Anh/chị muốn tính giá tour nào ạ?"
## TOOL 7 — Đặt tour → request_booking | QUY TRÌNH BẮT BUỘC — KHÔNG ĐƯỢC BỎ QUA
BƯỚC 1 — Xác nhận tour & ngày (nếu chưa rõ thì hỏi)
BƯỚC 2 — Hỏi thông tin từng bước, KHÔNG hỏi dồn:
  - Lần 1: "Anh/chị cho em xin họ tên đầy đủ và số điện thoại nhé ạ"
  - Lần 2: "Anh/chị cho em xin email và số CCCD nhé ạ"
BƯỚC 3 — Tóm tắt xác nhận trước khi gọi tool.
BƯỚC 4 — Khách xác nhận ("đúng/ok/xác nhận") → GỌI request_booking
⛔ TUYỆT ĐỐI KHÔNG tự điền thông tin khách khi chưa được cung cấp.
⛔ KHÔNG gọi request_booking khi còn thiếu bất kỳ thông tin nào.
`;
const tools = [
  {
    functionDeclarations: [
      {
        name: "find_tours",
        description:
          "Tìm kiếm và gợi ý tour du lịch dựa trên nhu cầu của khách: địa điểm, sở thích, ngân sách, số ngày, điểm khởi hành.",
        parameters: {
          type: "OBJECT",
          properties: {
            destination: {
              type: "STRING",
              description: "Điểm đến (VD: Sapa, Hà Giang, Mù Cang Chải)",
            },
            keyword: {
              type: "STRING",
              description:
                "Từ khóa sở thích (VD: trekking, mạo hiểm, lãng mạn, gia đình, nghỉ dưỡng)",
            },
            departureLocation: {
              type: "STRING",
              description: "Điểm khởi hành (VD: Cần Thơ, Hà Nội, TP.HCM)",
            },
            duration: {
              type: "STRING",
              description: "Số ngày đi (VD: 3 ngày thì nhập '3')",
            },
            maxPrice: {
              type: "STRING",
              description:
                "Giá tối đa bằng số nguyên (VD: dưới 3 triệu → nhập '3000000')",
            },
            minPrice: {
              type: "STRING",
              description:
                "Giá tối thiểu bằng số nguyên (VD: trên 5 triệu → nhập '5000000')",
            },
          },
        },
      },
      {
        name: "get_tour_details",
        description:
          "Xem chi tiết đầy đủ một tour: lịch trình từng ngày, giá vé người lớn/trẻ em, dịch vụ bao gồm, dịch vụ không bao gồm, chính sách hủy.",
        parameters: {
          type: "OBJECT",
          properties: {
            tourName: {
              type: "STRING",
              description:
                "Tên tour cần xem. Nếu khách nói 'tour đó/tour vừa rồi', hãy điền tên tour từ lịch sử hội thoại.",
            },
          },
          required: ["tourName"],
        },
      },
      {
        name: "check_availability",
        description:
          "Xem lịch khởi hành và số chỗ trống của một tour. Dùng khi khách hỏi 'có ngày nào đi?' hoặc 'ngày X còn vé không?'",
        parameters: {
          type: "OBJECT",
          properties: {
            tourName: { type: "STRING", description: "Tên tour" },
            date: {
              type: "STRING",
              description:
                "Ngày khởi hành cụ thể (VD: 20/10/2026). Nếu khách hỏi chung 'có ngày nào?' thì BỎ TRỐNG.",
            },
          },
          required: ["tourName"],
        },
      },
      {
        name: "calculate_total_price",
        description:
          "Tính tổng tiền tour cho nhiều người. Dùng khi khách báo số lượng người và muốn biết tổng chi phí.",
        parameters: {
          type: "OBJECT",
          properties: {
            tourName: { type: "STRING", description: "Tên tour cần tính giá" },
            adultCount: {
              type: "STRING",
              description: "Số người lớn (VD: '2')",
            },
            childCount: {
              type: "STRING",
              description: "Số trẻ em (VD: '1'). Bỏ qua nếu không có.",
            },
          },
          required: ["tourName", "adultCount"],
        },
      },
      {
        name: "request_booking",
        description:
          "Tạo đơn đặt tour. CHỈ ĐƯỢC GỌI KHI ĐÃ CÓ ĐỦ DỮ LIỆU THẬT từ khách. TUYỆT ĐỐI KHÔNG tự điền thông tin.",
        parameters: {
          type: "OBJECT",
          properties: {
            tourName: { type: "STRING", description: "Tên tour chính xác" },
            departureDate: { type: "STRING", description: "Ngày khởi hành" },
            adultCount: { type: "STRING", description: "Số người lớn" },
            childCount: { type: "STRING", description: "Số trẻ em" },
            fullName: {
              type: "STRING",
              description:
                "Họ tên đầy đủ của khách — phải được khách gõ rõ ràng",
            },
            phone: {
              type: "STRING",
              description: "Số điện thoại của khách (10-11 số)",
            },
            email: { type: "STRING", description: "Email của khách (chứa @)" },
            cccd: { type: "STRING", description: "Số CCCD của khách" },
            notes: {
              type: "STRING",
              description: "Ghi chú thêm (ăn chay, say xe...)",
            },
          },
          required: [
            "tourName",
            "departureDate",
            "adultCount",
            "fullName",
            "phone",
            "email",
            "cccd",
          ],
        },
      },
      {
        name: "get_faq_info",
        description:
          "Truy vấn thông tin công ty và các câu hỏi thường gặp: địa chỉ, hotline, email, bảo hiểm, phương thức thanh toán, uy tín công ty, chính sách hủy/hoàn tiền.",
        parameters: {
          type: "OBJECT",
          properties: {
            question: {
              type: "STRING",
              description: "Nội dung câu hỏi của khách",
            },
          },
          required: ["question"],
        },
      },
    ],
  },
];
const toGeminiHistory = (chatHistory) => {
  return chatHistory
    .filter(
      (m) => m.role === "user" || m.role === "assistant" || m.role === "model",
    )
    .map((m) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content || "" }],
    }));
};
const executeTool = async (toolName, args, userId) => {
  console.log(`[TOOL CALLED] ${toolName}`, args);
  switch (toolName) {
    case "find_tours":
      return await aiTools.executeFindTours(args);
    case "get_tour_details":
      return await aiTools.executeGetTourDetails(args);
    case "check_availability":
      return await aiTools.executeCheckAvailability(args);
    case "calculate_total_price":
      return await aiTools.executeCalculatePrice(args);
    case "request_booking":
      return await aiTools.executeRequestBooking({ ...args, userId });
    case "get_faq_info":
      return await aiTools.executeGetFaqInfo(args);
    default:
      console.warn(`[WARNING] AI gọi công cụ không tồn tại: ${toolName}`);
      return { error: `Công cụ '${toolName}' không được hỗ trợ.` };
  }
};
const aiAgentService = {
  processUserMessage: async (userMessage, chatHistory = [], userId = null) => {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-pro-preview",
        systemInstruction: systemInstruction,
        tools: tools,
      });
      const geminiHistory = toGeminiHistory(chatHistory);
      const chat = model.startChat({
        history: geminiHistory,
      });
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const toolData = await executeTool(call.name, call.args, userId);
        const responsePayload = Array.isArray(toolData)
          ? { result: toolData }
          : toolData && typeof toolData === "object"
            ? toolData
            : { result: toolData };
        const toolResult = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: responsePayload,
            },
          },
        ]);
        return {
          reply: toolResult.response.text(),
          thinkingType: "slow Thinking",
        };
      }
      console.log("[AI] fast thinking");
      return {
        reply: response.text(),
        thinkingType: "fast Thinking",
      };
    } catch (error) {
      console.error("[AI SERVICE ERROR] Status   :", error.status);
      console.error("[AI SERVICE ERROR] Code     :", error.code);
      console.error("[AI SERVICE ERROR] Message  :", error.message);
      if (error.status === 429) {
        return {
          reply:
            "Dạ hệ thống đang có nhiều người dùng cùng lúc, anh/chị chờ em vài giây rồi nhắn lại nhé! 🌸",
          thinkingType: "rate_limit",
        };
      }
      if (error.status === 401 || error.status === 403) {
        return {
          reply:
            "Dạ hệ thống đang bảo trì, anh/chị vui lòng liên hệ hotline để được hỗ trợ nhé ạ!",
          thinkingType: "auth_error",
        };
      }
      return {
        reply:
          "Dạ hệ thống của em đang gặp chút gián đoạn, anh/chị chờ em một lát rồi nhắn lại nhé! 🌸",
        thinkingType: "error",
      };
    }
  },
};
module.exports = aiAgentService;
