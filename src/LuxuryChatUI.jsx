// Refined Chat + Landing Page UI with modern flowing structure and custom background
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Menu, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import landingPageImage from './landingpage.jpg';
import './styles.css';

// Add Google Fonts Orbitron import
const orbitronStyles = {
  light: {
    fontFamily: '"Orbitron", sans-serif',
    fontOpticalSizing: 'auto',
    fontWeight: 300,
    fontStyle: 'normal',
  },
  regular: {
    fontFamily: '"Orbitron", sans-serif',
    fontOpticalSizing: 'auto',
    fontWeight: 400,
    fontStyle: 'normal',
  },
  medium: {
    fontFamily: '"Orbitron", sans-serif',
    fontOpticalSizing: 'auto',
    fontWeight: 500,
    fontStyle: 'normal',
  },
  bold: {
    fontFamily: '"Orbitron", sans-serif',
    fontOpticalSizing: 'auto',
    fontWeight: 700,
    fontStyle: 'normal',
  },
};

// Add this to your index.html or create a new CSS file
const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@300;400;500;700&display=swap');
`;

const ChatPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "user", content: "What's the weather like today?", time: "10:12 AM" },
    { role: "llm", content: "It's sunny and 25°C in your location.", time: "10:13 AM" },
  ]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [history, setHistory] = useState([
    { id: 1, title: "Job Finder UX", active: true, lastMessage: "Let's find your dream job", time: "2m ago" },
    { id: 2, title: "Research Assistant", active: false, lastMessage: "I can help with your research", time: "1h ago" },
    { id: 3, title: "Travel Bot", active: false, lastMessage: "Planning your next adventure", time: "3h ago" }
  ]);

  const modelToProvider = {
    "meta-llama/llama-3.3-8b-instruct:free": "openrouter",
    "gemini-2.0-flash": "gemini"
  };

  const models = [
    { id: "meta-llama/llama-3.3-8b-instruct:free", name: "Llama 3.3 8B Instruct", description: "Meta's latest 8B instruction model", provider: "openrouter" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Google's fastest Gemini model", provider: "gemini" }
  ];

  const handleHistoryClick = (id) => {
    setHistory(history.map(item => ({
      ...item,
      active: item.id === id
    })));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input,
      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMsg]);
    setInput("");

    const provider = modelToProvider[selectedModel] || "openrouter";
    const llmResponse = await sendToBackend(input, provider, selectedModel);

    const botMsg = {
      role: "llm",
      content: llmResponse,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div className="flex h-screen text-white font-sans overflow-hidden bg-[#04050D]" style={{ backgroundColor: '#04050D' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: showSidebar ? 320 : 0 }}
        transition={{ duration: 0.5 }}
        className={`overflow-hidden transition-all duration-500 ${
          showSidebar ? 'p-6' : 'p-0'
        } bg-[#04050D]/80 h-full border-r border-[#D0F2D9]/30 shadow-xl backdrop-blur-md rounded-r-3xl`}
        style={{ backgroundColor: '#04050D', minWidth: showSidebar ? 320 : 0 }}
      >
        {showSidebar && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl tracking-wider text-[#D0F2D9] quantico-bold">CHATS</h2>
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 5, scale: 1.02 }}
                  onClick={() => handleHistoryClick(item.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    item.active 
                      ? 'bg-[#B0D9CA]/90 border-[#D0F2D9]/40 shadow-lg' 
                      : 'bg-[#04050D]/60 hover:bg-[#B0D9CA]/20'
                  } border border-[#D0F2D9]/20 backdrop-blur-md`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`tracking-wide quantico-medium ${
                      item.active ? 'text-[#04050D]' : 'text-[#D0F2D9]'
                    }`}>{item.title}</h3>
                    <span className={`text-xs quantico-light ${
                      item.active ? 'text-[#04050D]/70' : 'text-[#D0F2D9]/70'
                    }`}>{item.time}</span>
                  </div>
                  <p className={`text-sm truncate ${
                    item.active ? 'text-[#04050D]/80' : 'text-[#D0F2D9]/80'
                  }`}>{item.lastMessage}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.aside>

      {/* Chat + Input */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Seamless Header */}
        <div className="flex justify-between items-center px-8 py-4 bg-[#04050D]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <motion.button 
              onClick={() => setShowSidebar(!showSidebar)} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[#D0F2D9]/70 hover:text-[#D0F2D9] transition-colors p-2 hover:bg-[#D0F2D9]/10 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </motion.button>
            <h1 className="text-xl tracking-wider text-[#D0F2D9]/90 quantico-bold">NOVA</h1>
          </div>
          
          {/* Model Selector */}
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-[#04050D]/60 text-[#D0F2D9] px-4 py-2 pr-8 rounded-lg border border-[#D0F2D9]/30 focus:outline-none focus:ring-2 focus:ring-[#D0F2D9]/30 cursor-pointer quantico-medium"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#04050D] text-[#D0F2D9]">
                  {model.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#D0F2D9]">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6 bg-[#04050D]/80 backdrop-blur-md">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`max-w-2xl px-6 py-4 rounded-3xl shadow-lg relative w-fit text-base whitespace-pre-wrap backdrop-blur-md ${
                msg.role === "user" 
                  ? "bg-[#B0D9CA]/90 self-end ml-auto rounded-br-sm border-[#D0F2D9]/30" 
                  : "bg-[#04050D]/90 self-start rounded-bl-sm border-[#D0F2D9]/30"
              } border`}
            >
              <div className={`${msg.role === "user" ? "text-[#04050D]" : "text-[#D0F2D9]"}`}>{msg.content}</div>
              <span className={`block text-xs text-right mt-2 quantico-light ${
                msg.role === "user" ? "text-[#04050D]/70" : "text-[#D0F2D9]/70"
              }`}>{msg.time}</span>
              {msg.role === "llm" && (
                <div className="flex gap-3 mt-3 justify-end text-[#D0F2D9]/70">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <ThumbsUp className="w-4 h-4 cursor-pointer hover:text-[#D0F2D9] transition-colors" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <ThumbsDown className="w-4 h-4 cursor-pointer hover:text-[#D0F2D9] transition-colors" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Copy className="w-4 h-4 cursor-pointer hover:text-[#D0F2D9] transition-colors" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <RotateCcw className="w-4 h-4 cursor-pointer hover:text-[#D0F2D9] transition-colors" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 bg-[#04050D]/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-[#51818C]/20 text-[#D0F2D9] px-6 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D0F2D9]/30 placeholder:text-[#D0F2D9]/50 shadow-sm border border-[#D0F2D9]/20 backdrop-blur-md"
            />
            <motion.button 
              onClick={handleSend}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#B0D9CA]/40 p-4 rounded-2xl hover:bg-[#B0D9CA]/60 transition-all duration-300 shadow-lg border border-[#D0F2D9]/30 backdrop-blur-md"
            >
              <Send className="text-[#D0F2D9] w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen w-full text-white flex flex-col items-center justify-center px-6 text-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${landingPageImage})` }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04050D]/90 to-[#406473]/80 backdrop-blur-md" />
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-7xl sm:text-8xl tracking-tight text-[#D0F2D9] quantico-bold"
            >
              Welcome to <span className="text-[#B0D9CA]">NOVA</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-[#D0F2D9]/90 text-xl max-w-2xl mx-auto leading-relaxed quantico-regular"
            >
              Experience the future of conversation with our AI-powered chat platform, designed for clarity, beauty, and seamless interaction.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex justify-center items-center"
          >
            <motion.button
              onClick={() => navigate("/chat")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#B0D9CA]/90 text-[#04050D] px-12 py-5 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 hover:bg-[#B0D9CA]/80 backdrop-blur-md quantico-medium"
            >
              Start Chatting
              <Send className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16"
          >
            {[
              { title: "Smart AI", desc: "Powered by advanced language models" },
              { title: "Real-time", desc: "Instant responses and interactions" },
              { title: "Secure", desc: "End-to-end encrypted conversations" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[#51818C]/20 backdrop-blur-md p-8 rounded-2xl border border-[#D0F2D9]/20"
              >
                <h3 className="text-xl mb-3 text-[#D0F2D9] tracking-wide quantico-medium">{feature.title}</h3>
                <p className="text-sm text-[#D0F2D9]/80 quantico-light">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

const sendToBackend = async (message, provider = "openrouter", model) => {
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message, // ✅ must match backend expectations
        provider: provider,
        model: model,
      }),
    });

    const data = await response.json();
    return data.reply || "No reply received.";
  } catch (error) {
    console.error("Error sending message:", error);
    return "Sorry, I couldn't connect to the model.";
  }
};