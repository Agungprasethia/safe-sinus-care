import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Paperclip, X } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import './ChatbotModal.css';

// System Prompt S.A.F.E.
const SYSTEM_PROMPT = `Kamu adalah S.A.F.E. AI Assistant — asisten kesehatan digital yang membantu skrining awal kondisi hidung dan sinus.
- Fokus utamamu adalah memberikan informasi edukatif dan dengan hangat menghimbau pengguna untuk segera memeriksakan diri ke dokter spesialis THT atau fasilitas kesehatan terdekat agar mendapat penanganan terbaik.
- Gaya bahasamu: ramah, empatik, terstruktur, menggunakan Bahasa Indonesia yang santai tapi profesional.
- Gunakan format markdown (bullet point, bold) untuk mempermudah pembacaan.

Tanyakan secara bertahap jika pengguna mengeluhkan sakit: 1. Gejala utama, 2. Durasi, 3. Lokasi (kiri/kanan), 4. Pemicu, 5. Pengobatan.
Jika pengguna mengirim gambar/foto, analisis warna atau kondisinya dan sarankan tindakan (misal: "cairan hijau mungkin indikasi bakteri"). Selalu berikan dukungan moral dan dorong mereka untuk berkonsultasi langsung dengan dokter.`;

// Inisialisasi Gemini (menggunakan API Key dari .env)
// Catatan: Di lingkungan produksi sungguhan, API Key sebaiknya tidak ditaruh di frontend
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }) : null;

const SUGGESTIONS = [
  "Hidung saya sering tersumbat pagi hari",
  "Bagaimana cara mengatasi sinusitis?",
  "Apa bedanya pilek biasa dan sinus?",
  "Makanan apa yang baik untuk sinus?"
];

const ChatbotModal = () => {
  // State untuk chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Halo! Saya adalah **S.A.F.E.** AI Assistant. Saya siap membantu Anda berkonsultasi mengenai keluhan hidung, sinus, atau pernapasan Anda. Ada yang bisa saya bantu hari ini?"
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
      parts: [{ text: 'Baik, saya S.A.F.E. AI siap membantu konsultasi kesehatan hidung dan sinus. Saya akan mengikuti instruksi yang diberikan.' }]
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
      alert('Ukuran gambar terlalu besar. Maksimal 4MB.');
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
      alert("API Key Gemini belum diatur di file .env. Chatbot tidak bisa berfungsi.");
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
        
        const promptWithContext = `${SYSTEM_PROMPT}\n\nKonteks sebelumnya: ${contextMessages}\n\nPengguna mengirim foto dengan pesan: "${text}". Analisis foto ini.`;

        const result = await model.generateContent([promptWithContext, imagePart]);
        responseText = result.response.text();
        
        // Simpan ke history agar percakapan tetap nyambung (hanya simpan teksnya)
        setChatHistory(prev => [
          ...prev, 
          { role: 'user', parts: [{ text: text || "[Mengirim Gambar]" }] },
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
        text: "⚠️ Maaf, saya sedang mengalami gangguan sistem. Silakan coba lagi nanti. (Error: " + error.message + ")" 
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
            <span>Gambar siap dikirim</span>
            <button className="remove-image-btn" onClick={handleRemoveImage}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="input-wrapper">
          <button 
            className="attach-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload Foto"
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
            placeholder="Tanya keluhan sinus Anda di sini..." 
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
        <span>S.A.F.E. AI memberikan informasi edukasi dan bukan pengganti diagnosis dokter.</span>
      </div>
    </div>
  );
};

export default ChatbotModal;
