// Refined Chat + Landing Page UI with modern flowing structure and custom background
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Menu, Copy, RotateCcw, ThumbsDown, ThumbsUp, Plus } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import landingPageImage from './landingpage.jpg';
import './styles.css';

const API_URL = 'https://llm-chatbased-backend.onrender.com';

const ChatPage = () => {
  const location = useLocation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [history, setHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [chatTopic, setChatTopic] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);

  const refreshHistory = async () => {
    try {
      console.log("Refreshing chat history...");
      const response = await fetch(`${API_URL}/api/chat`);
      const data = await response.json();
      console.log("Received data:", data);
      if (data.chats) {
        const uniqueChats = Array.from(new Map(data.chats.map(chat => [chat.chatId, chat])).values());
        console.log("Setting unique chats:", uniqueChats);
        setHistory(uniqueChats);
      } else {
        console.log("No chats found in response");
        setHistory([]);
      }
    } catch (error) {
      console.error('Error refreshing history:', error);
      setHistory([]);
    }
  };

  // Load saved chats from MongoDB on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await refreshHistory();
      
      // If there's a chatId in the location state, load that chat
      if (location.state?.chatId) {
        const chatToLoad = history.find(chat => chat.chatId === location.state.chatId);
        if (chatToLoad) {
          setMessages(chatToLoad.messages);
          setCurrentChatId(chatToLoad.chatId);
          setChatTopic(chatToLoad.title);
          setSelectedModel(chatToLoad.model);
          setShowWelcome(false);
        }
      }
    };
    
    loadInitialData();
  }, [location.state, history]);

  // Save chat to MongoDB whenever messages change
  useEffect(() => {
    const saveChatToMongoDB = async () => {
      if (messages.length === 0) return;

      const chatData = {
        chatId: currentChatId || Date.now().toString(),
        title: chatTopic || messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : ''),
        lastMessage: messages[messages.length - 1].content,
        time: new Date().toLocaleTimeString(),
        messages: messages,
        model: selectedModel
      };

      try {
        console.log("Saving chat:", chatData);
        const response = await fetch(`${API_URL}/api/chat`, {
          method: currentChatId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatData),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Save response:", data);
          setCurrentChatId(data.chatId);
          await refreshHistory();
        }
      } catch (error) {
        console.error('Error saving chat:', error);
      }
    };

    saveChatToMongoDB();
  }, [messages, currentChatId, selectedModel, chatTopic]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const modelToProvider = {
    "meta-llama/llama-3.3-8b-instruct:free": "openrouter",
    "gemini-2.0-flash": "gemini"
  };

  const models = [
    { id: "meta-llama/llama-3.3-8b-instruct:free", name: "Llama 3.3 8B Instruct", description: "Meta's latest 8B instruction model", provider: "openrouter" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Google's fastest Gemini model", provider: "gemini" }
  ];

  const handleHistoryClick = async (chatId) => {
    try {
      console.log("Loading chat:", chatId);
      const response = await fetch(`${API_URL}/api/chat/${chatId}`);
      const data = await response.json();
      console.log("Loaded chat data:", data);
      
      if (data.chat) {
        setMessages(data.chat.messages);
        setCurrentChatId(data.chat.chatId);
        setChatTopic(data.chat.title);
        setSelectedModel(data.chat.model);
        setShowWelcome(false);
        await refreshHistory();
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setChatTopic("");
    setShowTopicModal(true);
    setShowWelcome(false);
    refreshHistory(); // Refresh history when starting a new chat
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // If this is the first message and no topic is set, show the topic modal
    if (messages.length === 0 && !chatTopic) {
      setShowTopicModal(true);
      return;
    }

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

  const handleTopicSubmit = async () => {
    if (chatTopic.trim()) {
      setShowTopicModal(false);
      // If there are messages, save the chat with the new topic
      if (messages.length > 0) {
        const chatData = {
          chatId: currentChatId || Date.now().toString(),
          title: chatTopic,
          lastMessage: messages[messages.length - 1].content,
          time: new Date().toLocaleTimeString(),
          messages: messages,
          model: selectedModel
        };

        try {
          const response = await fetch(`${API_URL}/api/chat`, {
            method: currentChatId ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatData),
          });

          if (response.ok) {
            // Immediately fetch updated chat list
            await refreshHistory();
          }
        } catch (error) {
          console.error('Error saving chat:', error);
        }
      }
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    try {
      const response = await fetch(`${API_URL}/api/chat/${chatId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // If we're deleting the current chat, clear the chat view
        if (chatId === currentChatId) {
          setMessages([]);
          setCurrentChatId(null);
          setChatTopic("");
          setShowWelcome(true);
        }
        // Refresh the history to update the sidebar
        await refreshHistory();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <div className="flex h-screen text-white font-sans overflow-hidden bg-[#04050D]" style={{ backgroundColor: '#04050D' }}>
      {/* Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#04050D] p-6 rounded-2xl border border-[#D0F2D9]/30 shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl mb-4 text-[#D0F2D9] orbitron-bold">Enter Chat Topic</h2>
            <input
              type="text"
              value={chatTopic}
              onChange={(e) => setChatTopic(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full bg-[#51818C]/20 text-[#D0F2D9] px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#D0F2D9]/30 border border-[#D0F2D9]/20 tomorrow-regular"
            />
            <div className="flex justify-end gap-4">
              <motion.button
                onClick={() => setShowTopicModal(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-[#D0F2D9]/70 hover:text-[#D0F2D9] transition-colors tomorrow-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleTopicSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-[#B0D9CA]/40 text-[#D0F2D9] rounded-xl hover:bg-[#B0D9CA]/60 transition-all duration-300 orbitron-medium"
              >
                Start Chat
              </motion.button>
            </div>
          </div>
        </div>
      )}

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
              <h2 className="text-xl tracking-wider text-[#D0F2D9] orbitron-bold">CHATS</h2>
              <motion.button
                onClick={refreshHistory}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[#D0F2D9]/70 hover:text-[#D0F2D9] transition-colors p-2 hover:bg-[#D0F2D9]/10 rounded-full"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <motion.div
                  key={item.chatId}
                  whileHover={{ x: 5, scale: 1.02 }}
                  onClick={() => handleHistoryClick(item.chatId)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    item.active 
                      ? 'bg-[#B0D9CA]/90 border-[#D0F2D9]/40 shadow-lg' 
                      : 'bg-[#04050D]/60 hover:bg-[#B0D9CA]/20'
                  } border border-[#D0F2D9]/20 backdrop-blur-md relative group`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`tracking-wide orbitron-medium ${
                      item.active ? 'text-[#04050D]' : 'text-[#D0F2D9]'
                    }`}>
                      {item.title || "Untitled Chat"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs tomorrow-light ${
                        item.active ? 'text-[#04050D]/70' : 'text-[#D0F2D9]/70'
                      }`}>
                        {item.time || ""}
                      </span>
                      <motion.button
                        onClick={(e) => handleDeleteChat(item.chatId, e)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#D0F2D9]/50 hover:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                  
                  {item.lastMessage && (
                    <p className={`text-sm truncate tomorrow-light ${
                      item.active ? 'text-[#04050D]/80' : 'text-[#D0F2D9]/80'
                    }`}>
                      {item.lastMessage}
                    </p>
                  )}
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
              <Menu className="w-5 h-5" />
            </motion.button>
            <h1 className="text-lg tracking-wider text-[#D0F2D9]/90 orbitron-bold">NOVA</h1>
          </div>
          
          {/* Model Selector and New Chat Button */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-[#04050D]/60 text-[#D0F2D9] px-4 py-2 pr-8 rounded-xl border border-[#D0F2D9]/30 focus:outline-none focus:ring-2 focus:ring-[#D0F2D9]/30 cursor-pointer orbitron-medium text-sm hover:bg-[#04050D]/80 transition-all duration-300 backdrop-blur-md"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[#04050D] text-[#D0F2D9] orbitron-medium">
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

            <motion.button
              onClick={handleNewChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#B0D9CA]/20 text-[#D0F2D9] hover:bg-[#B0D9CA]/30 transition-all duration-300 rounded-xl border border-[#D0F2D9]/30 shadow-lg hover:shadow-xl backdrop-blur-md"
            >
              <Plus className="w-4 h-4" />
              <span className="orbitron-medium tracking-wide text-sm">New Chat</span>
            </motion.button>
          </div>
        </div>

        {/* Welcome Screen or Chat Messages */}
        {showWelcome ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 bg-[#04050D]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl w-full text-center space-y-6"
            >
              <h2 className="text-3xl text-[#D0F2D9] orbitron-bold">Welcome to Nova Chat</h2>
              <p className="text-[#D0F2D9]/80 text-base tomorrow-regular">
                Start a new conversation or continue from your previous chats
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#51818C]/20 backdrop-blur-md p-6 rounded-2xl border border-[#D0F2D9]/20"
                >
                  <h3 className="text-lg mb-3 text-[#D0F2D9] orbitron-medium">Start New Chat</h3>
                  <p className="text-[#D0F2D9]/70 mb-4 text-sm tomorrow-light">Begin a fresh conversation with our AI</p>
                  <motion.button
                    onClick={handleNewChat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-[#B0D9CA]/40 text-[#D0F2D9] px-6 py-3 rounded-xl hover:bg-[#B0D9CA]/60 transition-all duration-300 orbitron-medium text-sm"
                  >
                    New Chat
                  </motion.button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#51818C]/20 backdrop-blur-md p-6 rounded-2xl border border-[#D0F2D9]/20"
                >
                  <h3 className="text-lg mb-3 text-[#D0F2D9] orbitron-medium">Recent Chats</h3>
                  <p className="text-[#D0F2D9]/70 mb-4 text-sm tomorrow-light">Continue your previous conversations</p>
                  <div className="space-y-3">
                    {history.slice(0, 2).map((chat) => (
                      <motion.div
                        key={chat.chatId}
                        whileHover={{ x: 5 }}
                        onClick={() => handleHistoryClick(chat.chatId)}
                        className="p-3 rounded-xl bg-[#04050D]/60 border border-[#D0F2D9]/20 cursor-pointer hover:bg-[#B0D9CA]/20 transition-all duration-300"
                      >
                        <h4 className="text-[#D0F2D9] text-sm mb-1 orbitron-medium">{chat.title}</h4>
                        <p className="text-[#D0F2D9]/60 text-xs truncate tomorrow-light">{chat.lastMessage}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6 bg-[#04050D]/80 backdrop-blur-md">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`max-w-2xl px-6 py-4 rounded-3xl shadow-lg relative w-fit text-sm whitespace-pre-wrap backdrop-blur-md ${
                    msg.role === "user" 
                      ? "bg-[#B0D9CA]/90 self-end ml-auto rounded-br-sm border-[#D0F2D9]/30" 
                      : "bg-[#04050D]/90 self-start rounded-bl-sm border-[#D0F2D9]/30"
                  } border`}
                >
                  <div className={`${msg.role === "user" ? "text-[#04050D] tomorrow-regular" : "text-[#D0F2D9] tomorrow-regular"}`}>{msg.content}</div>
                  <span className={`block text-xs text-right mt-2 tomorrow-light ${
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-[#04050D]/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#51818C]/20 text-[#D0F2D9] px-6 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D0F2D9]/30 placeholder:text-[#D0F2D9]/50 shadow-sm border border-[#D0F2D9]/20 backdrop-blur-md tomorrow-regular"
                />
                <motion.button 
                  onClick={handleSend}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#B0D9CA]/40 p-4 rounded-2xl hover:bg-[#B0D9CA]/60 transition-all duration-300 shadow-lg border border-[#D0F2D9]/30 backdrop-blur-md"
                >
                  <Send className="text-[#D0F2D9] w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col items-center justify-center px-6 text-center bg-cover bg-center relative"
      style={{ 
        backgroundImage: `url(${landingPageImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04050D]/70 via-[#04050D]/50 to-[#406473]/60" />
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl w-full flex-1 flex flex-col justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl sm:text-6xl tracking-tight text-[#D0F2D9] orbitron-bold drop-shadow-lg"
            >
              Welcome to <span className="text-[#B0D9CA]">NOVA</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-[#D0F2D9] text-lg max-w-2xl mx-auto leading-relaxed tomorrow-regular drop-shadow-md"
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
              className="bg-[#B0D9CA]/90 text-[#04050D] px-10 py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 hover:bg-[#B0D9CA] backdrop-blur-md orbitron-medium"
            >
              Start New Chat
              <Plus className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12"
          >
            {[
              { title: "Smart AI", desc: "Powered by advanced language models" },
              { title: "Real-time", desc: "Instant responses and interactions" },
              { title: "Secure", desc: "End-to-end encrypted conversations" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[#51818C]/30 backdrop-blur-sm p-6 rounded-2xl border border-[#D0F2D9]/30 shadow-lg"
              >
                <h3 className="text-lg mb-2 text-[#D0F2D9] tracking-wide orbitron-medium">{feature.title}</h3>
                <p className="text-sm text-[#D0F2D9] tomorrow-light">{feature.desc}</p>
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
    const response = await fetch(`${API_URL}/api/chat/completion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
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