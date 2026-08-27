import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Paperclip, X } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import './ChatbotModal.css';

// System Prompt S.A.F.E.
const SYSTEM_PROMPT = `You are S.A.F.E. AI Assistant — a digital health assistant that helps with initial screening of nose and sinus conditions.
- Your main focus is providing educational information and warmly encouraging users to see an ENT specialist or visit the nearest healthcare facility for the best treatment.
- Your tone: friendly, empathetic, structured, using casual but professional English.
- IMPORTANT: You MUST ALWAYS respond in English, regardless of the language the user uses.
- Use markdown formatting (bullet points, bold) for better readability.

Ask gradually if the user complains of symptoms: 1. Main symptom, 2. Duration, 3. Location (left/right), 4. Triggers, 5. Medication.
If the user sends an image/photo, analyze the color or condition and suggest actions (e.g., "green discharge may indicate a bacterial infection"). Always provide moral support and encourage them to consult a doctor directly.`;

// Inisialisasi Gemini (menggunakan API Key dari .env)
// Catatan: Di lingkungan produksi sungguhan, API Key sebaiknya tidak ditaruh di frontend
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }) : null;

const SUGGESTIONS = [
  "My nose is often stuffy in the morning",
  "How do I treat sinusitis?",
  "What's the difference between a cold and sinus?",
  "What foods are good for sinus health?"
];

const ChatbotModal = () => {
  // State untuk chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am **S.A.F.E.** AI Assistant. I'm here to help you with any concerns about your nose, sinuses, or breathing. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'user',
      parts: [{ text: `System Instruction: ${SYSTEM_PROMPT}` }]
    },
    {
      role: 'model',
      parts: [{ text: 'Understood, I am S.A.F.E. AI, ready to assist with nose and sinus health consultations. I will follow the instructions provided and respond in English.' }]
    }
  ]);
  
  // State untuk image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fungsi mengubah file gambar ke Base64 (untuk Gemini API)
  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Cek ukuran file (max 4MB untuk flash)
    if (file.size > 4 * 1024 * 1024) {
      alert('Image size is too large. Maximum 4MB.');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSend = async (textToUse = inputValue) => {
    const text = textToUse.trim();
    if (!text && !selectedImage) return;

    if (!model) {
      alert("Gemini API Key is not configured in the .env file. Chatbot cannot function.");
      return;
    }

    // Siapkan pesan user untuk UI
    const userMsgId = Date.now();
    const userMsg = { 
      id: userMsgId, 
      sender: 'user', 
      text,
      image: imagePreview // Tampilkan gambar di chat bubble user
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      let responseText = "";

      // Jika ada gambar, gunakan multi-modal generateContent
      if (selectedImage) {
        const imagePart = await fileToGenerativePart(selectedImage);
        
        // Bersihkan state gambar setelah dikirim ke UI & diproses
        setSelectedImage(null);
        setImagePreview(null);
        
        // Buat ringkasan konteks (hanya teks user sebelumnya) agar AI tahu konteks
        const contextMessages = chatHistory
          .filter(h => h.role === 'user' && !h.parts[0].text.startsWith('System'))
          .map(h => h.parts[0].text)
          .join('\n');
        
        const promptWithContext = `${SYSTEM_PROMPT}\n\nPrevious context: ${contextMessages}\n\nThe user sent a photo with the message: "${text}". Analyze this photo.`;

        const result = await model.generateContent([promptWithContext, imagePart]);
        responseText = result.response.text();
        
        // Simpan ke history agar percakapan tetap nyambung (hanya simpan teksnya)
        setChatHistory(prev => [
          ...prev, 
          { role: 'user', parts: [{ text: text || "[Sent an Image]" }] },
          { role: 'model', parts: [{ text: responseText }] }
        ]);

      } else {
        // Jika hanya teks, gunakan chat session agar context terjaga
        const chatSession = model.startChat({ history: chatHistory });
        const result = await chatSession.sendMessage(text);
        responseText = result.response.text();

        // Update local history array
        setChatHistory(prev => [
          ...prev,
          { role: 'user', parts: [{ text }] },
          { role: 'model', parts: [{ text: responseText }] }
        ]);
      }

      // Tampilkan respons AI di UI
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: responseText 
      }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: "⚠️ Sorry, I'm experiencing a system error. Please try again later. (Error: " + error.message + ")" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-modal">
      <div className="chat-header">
        <div className="bot-avatar">
          <Bot size={24} />
        </div>
        <div>
          <h2>S.A.F.E. AI Assistant</h2>
          <p className="status-indicator"><span className="dot"></span> Online</p>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            <div className={`message-avatar ${msg.sender}`}>
              {msg.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.image && (
                <img src={msg.image} alt="User upload" className="attached-image-preview" />
              )}
              {msg.sender === 'bot' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper bot">
            <div className="message-avatar bot"><Bot size={16} /></div>
            <div className="message-bubble bot">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((suggestion, index) => (
          <button 
            key={index} 
            className="suggestion-chip"
            onClick={() => handleSend(suggestion)}
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="chat-input-area">
        {/* Preview image jika ada */}
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview-thumbnail" />
            <span>Image ready to send</span>
            <button className="remove-image-btn" onClick={handleRemoveImage}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="input-wrapper">
          <button 
            className="attach-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload Photo"
            disabled={isLoading}
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleImageSelect}
          />
          <input 
            type="text" 
            placeholder="Ask about your sinus concerns here..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
            disabled={isLoading}
          />
          <button 
            className="send-btn" 
            onClick={() => handleSend(inputValue)}
            disabled={(!inputValue.trim() && !selectedImage) || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="chat-disclaimer">
        <AlertCircle size={14} />
        <span>S.A.F.E. AI provides educational information and is not a substitute for a doctor's diagnosis.</span>
      </div>
    </div>
  );
};

export default ChatbotModal;
