require("dotenv").config();
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ Không tìm thấy GEMINI_API_KEY! Hãy kiểm tra lại file .env");
  process.exit(1);
}
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`)
  .then((r) => r.json())
  .then((data) => {
    if (data.error) {
      console.error("❌ Google API từ chối truy cập:", data.error.message);
      return;
    }
    const chatModels = data.models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({
        name: m.name.replace("models/", ""),
        displayName: m.displayName,
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit,
        description: m.description,
      }));
    console.table(chatModels);
  })
  .catch((err) => {
    console.error("❌ Quá trình gọi API bị lỗi:", err);
  });
