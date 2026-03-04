import { useState, useRef, useEffect } from 'react';
import toast from '../utils/toast';
import axios from '../api/axios';

/**
 * MUWAS Recommendation Chatbot – "Sophie"
 * Real product recommendation engine based on actual inventory.
 * Supports: product lookup, category browsing, budget filtering,
 * preference-based recommendations, stock checks, and more.
 */

let globalConversationId = null;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId] = useState(() => {
    if (!globalConversationId) {
      globalConversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return globalConversationId;
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '👋 **Assalamu Alaikum! Welcome to MUWAS!**\n\nI\'m Sophie, your personal fragrance advisor. 🌹\n\nI can help you discover:\n🕌 **Premium Attars** – Luxury traditional attars\n🪵 **Oud Reserve** – Rare oud oils\n💰 **Budget picks** – "Products under 500"\n🔍 **Product details** – Just say a product name\n\nWhat are you looking for today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [loading]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setShowSuggestions(false);
    const userMsg = { id: Date.now(), type: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post('chatbot/chat', {
        message: text,
        conversationId
      });

      if (res.data.status === 'success') {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: res.data.message,
          timestamp: new Date()
        }]);
      } else {
        toast.error('Failed to get response');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again!',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  const quickSuggestions = [
    { label: '🕌 Premium Attars', msg: 'Show me Premium Attars', color: 'amber' },
    { label: '🪵 Oud Reserve', msg: 'Show me Oud Reserve', color: 'yellow' },
    { label: '🏆 Best Rated', msg: 'Show me the best rated products', color: 'emerald' },
    { label: '💰 Under ₹500', msg: 'Products under 500', color: 'sky' },
    { label: '🔥 Bakhoor', msg: 'Show me Bakhoor', color: 'orange' },
    { label: '🧪 Aroma Chemicals', msg: 'Show me Aroma Chemicals', color: 'violet' },
    { label: '👑 Luxury', msg: 'Show me luxury products', color: 'rose' },
    { label: '🎁 Gift Ideas', msg: 'Gift suggestions', color: 'pink' },
  ];

  const colorMap = {
    amber:   { bg: 'bg-amber-100', hover: 'hover:bg-amber-200', text: 'text-amber-800', border: 'border-amber-300' },
    yellow:  { bg: 'bg-yellow-100', hover: 'hover:bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' },
    emerald: { bg: 'bg-emerald-100', hover: 'hover:bg-emerald-200', text: 'text-emerald-800', border: 'border-emerald-300' },
    sky:     { bg: 'bg-sky-100', hover: 'hover:bg-sky-200', text: 'text-sky-800', border: 'border-sky-300' },
    orange:  { bg: 'bg-orange-100', hover: 'hover:bg-orange-200', text: 'text-orange-800', border: 'border-orange-300' },
    violet:  { bg: 'bg-violet-100', hover: 'hover:bg-violet-200', text: 'text-violet-800', border: 'border-violet-300' },
    rose:    { bg: 'bg-rose-100', hover: 'hover:bg-rose-200', text: 'text-rose-800', border: 'border-rose-300' },
    pink:    { bg: 'bg-pink-100', hover: 'hover:bg-pink-200', text: 'text-pink-800', border: 'border-pink-300' },
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '64px', height: '64px', borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgb(217, 119, 6), rgb(180, 83, 9))',
            color: 'white', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 40,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
          aria-label="Open chatbot"
          title="Sophie – Fragrance Advisor"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-screen md:h-[600px] bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl shadow-2xl flex flex-col z-50 border border-amber-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-t-xl flex justify-between items-center border-b border-amber-600">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">Sophie 🌹</h3>
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">BETA</span>
              </div>
              <p className="text-sm text-amber-200 mt-1">Your MUWAS Fragrance Advisor</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-amber-600 hover:bg-opacity-30 p-2 rounded-lg transition"
              aria-label="Close chatbot"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-slate-100">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-lg ${message.type === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-none'
                    : 'bg-white border border-amber-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <span className={`text-xs mt-1 block ${message.type === 'user' ? 'text-amber-100' : 'text-amber-600'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-amber-200 text-gray-800 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {showSuggestions && messages.length <= 1 && !loading && (
            <div className="px-4 py-3 border-t border-amber-200 bg-gradient-to-b from-slate-100 to-slate-50">
              <p className="text-xs font-semibold text-slate-700 mb-2">💡 Quick picks:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickSuggestions.map((s, idx) => {
                  const c = colorMap[s.color] || colorMap.amber;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(s.msg)}
                      className={`text-xs ${c.bg} ${c.hover} ${c.text} px-2.5 py-1.5 rounded-lg transition font-medium border ${c.border}`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-amber-200 bg-gradient-to-r from-slate-100 to-slate-50 rounded-b-xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, prices, categories..."
                className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder-slate-500 bg-white text-sm"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
