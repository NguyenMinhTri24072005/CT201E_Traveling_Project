import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";
import { IMAGE_URL } from "../../utils/constants";
import { io } from "socket.io-client";
import "./Chat.css";
const SOCKET_HOST = "http://localhost:3000";
export default function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const socket = useRef();
  const scrollRef = useRef();
  useEffect(() => {
    if (user) {
      socket.current = io(SOCKET_HOST);
      socket.current.emit("add-user", user._id);
    }
    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [user]);
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axiosClient.get("/auth/chat-contacts");
        setContacts(res.data);
      } catch (error) {
        console.error("Lỗi lấy danh bạ:", error);
      }
    };
    if (user) fetchContacts();
  }, [user]);
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentChat) {
        try {
          const res = await axiosClient.get(`/messages/${currentChat._id}`);
          setMessages(res.data);
        } catch (error) {
          console.error("Lỗi lấy tin nhắn:", error);
        }
      }
    };
    fetchMessages();
  }, [currentChat]);
  const handleSendMsg = async (e) => {
    e.preventDefault();
    if (msgInput.trim().length > 0) {
      socket.current.emit("send-msg", {
        to: currentChat._id,
        msg: msgInput,
      });
      const msgs = [...messages];
      msgs.push({ fromSelf: true, text: msgInput, createdAt: new Date() });
      setMessages(msgs);
      try {
        await axiosClient.post("/messages", {
          to: currentChat._id,
          text: msgInput,
        });
      } catch (error) {
        console.error("Lỗi lưu tin nhắn:", error);
      }
      setMsgInput("");
    }
  };
  useEffect(() => {
    if (socket.current) {
      socket.current.off("msg-receive");
      socket.current.on("msg-receive", (msg) => {
        setArrivalMessage({
          fromSelf: false,
          text: msg,
          createdAt: new Date(),
        });
      });
    }
  }, [socket.current]);
  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage]);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleChatChange = (contact) => {
    setCurrentChat(contact);
  };
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.fullname
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = activeTab === "All" || contact.role === activeTab;
    return matchesSearch && matchesRole;
  });
  if (!user)
    return (
      <h2 className="login-alert-msg">
        Vui lòng đăng nhập để sử dụng tính năng Chat!
      </h2>
    );
  return (
    <div className="chat-container fade-in">
      {}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">💬 Hộp Thư Trực Tuyến</div>
        <div className="chat-filter-section">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
          <div className="chat-tabs-container">
            {["All", "Customer", "Partner", "Admin"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`chat-tab-btn ${activeTab === tab ? "active" : ""}`}
              >
                {tab === "All"
                  ? "Tất cả"
                  : tab === "Customer"
                    ? "Khách"
                    : tab === "Partner"
                      ? "Đối tác"
                      : "Admin"}
              </button>
            ))}
          </div>
        </div>
        <div className="contact-list">
          {filteredContacts.length === 0 ? (
            <div className="chat-empty-result">Không tìm thấy kết quả nào.</div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact._id}
                className={`contact-item ${currentChat?._id === contact._id ? "active" : ""}`}
                onClick={() => handleChatChange(contact)}
              >
                <img
                  src={
                    contact.avatar && !contact.avatar.includes("default")
                      ? `${IMAGE_URL}${contact.avatar}`
                      : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                  }
                  alt="avatar"
                  className="contact-avatar"
                />
                <div className="contact-info">
                  <h4>{contact.fullname}</h4>
                  <p>
                    {contact.role === "Partner"
                      ? "🤝 Đối tác"
                      : contact.role === "Admin"
                        ? "👑 Quản trị viên"
                        : "🎒 Khách hàng"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {}
      <div className="chat-window">
        {currentChat === null ? (
          <div className="no-chat-selected">
            <div className="no-chat-icon">👋</div>
            <h2>Chào {user.fullname}!</h2>
            <p>Chọn một người từ danh sách bên trái để bắt đầu trò chuyện.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <img
                src={
                  currentChat.avatar && !currentChat.avatar.includes("default")
                    ? `${IMAGE_URL}${currentChat.avatar}`
                    : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                }
                alt="avatar"
                className="contact-avatar"
              />
              <div className="chat-header-info">
                <h3>{currentChat.fullname}</h3>
                <span className="chat-status-active">● Đang hoạt động</span>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  ref={scrollRef}
                  key={index}
                  className={`message ${msg.fromSelf ? "sent" : "received"}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <form className="chat-input-container" onSubmit={handleSendMsg}>
              <input
                type="text"
                placeholder="Nhập tin nhắn của bạn..."
                className="chat-input"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                🚀
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
