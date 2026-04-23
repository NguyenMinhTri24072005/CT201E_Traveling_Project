import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios'; 
import './Chatbot.css'; 

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Chào bạn! Tôi là Trợ lý Ảo AI của Tây Bắc Travel. Bạn muốn tìm tour đi đâu?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { 
        scrollToBottom(); 
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/api/chat', { 
                message: userMessage.text 
            });

            const botMessage = { 
                sender: 'bot', 
                text: response.data.reply,
                thinkingType: response.data.thinkingType 
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Lỗi gọi AI:", error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Hệ thống đang bận, vui lòng thử lại sau.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    return (
        <div className="chatbot-wrapper">
            {!isOpen && (
                <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
                    💬
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3 className="chatbot-title">🤖 Trợ lý AI Tây Bắc</h3>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✖</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chatbot-message-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
                                <div className={`chatbot-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                                    {msg.text}
                                </div>
                                {msg.thinkingType && (
                                    <span className="chatbot-thinking-label">
                                        ⚡ {msg.thinkingType}
                                    </span>
                                )}
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="chatbot-loading">
                                AI đang suy nghĩ...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-input-container">
                        <input 
                            type="text" 
                            className="chatbot-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập câu hỏi của bạn..."
                        />
                        <button className="chatbot-send-btn" onClick={handleSendMessage}>
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;