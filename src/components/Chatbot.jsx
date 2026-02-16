import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../api/axios';

/**
 * Intelligent Chatbot Component
 * Floating chatbot widget with smart shopping assistant features
 * Supports: price queries, stock checks, recommendations, occasion-based suggestions
 * Maintains conversation state across messages using conversationId
 */

// Global variable to store conversationId across component instances
let globalConversationId = null;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId] = useState(() => {
    // Use global conversationId if already initialized, otherwise create new one
    if (!globalConversationId) {
      globalConversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log('Created new conversation ID:', globalConversationId);
    }
    return globalConversationId;
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '✨ Welcome to Perfumé! I\'m Sophia, your personal fragrance consultant. 🌸\n\nI\'m here to help you find your perfect scent match! You can ask me about:\n💰 **Prices** - "What\'s the price of Gucci Bloom?"\n📦 **Availability** - "Is Dior Sauvage in stock?"\n🎁 **Recommendations** - "What perfume for work?"\n\nWhat brings you here today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom and focus input when new messages arrive or loading completes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when bot finishes responding
  useEffect(() => {
    if (!loading && inputRef.current) {
      // Small delay to ensure focus works smoothly
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [loading]);

  /**
   * Send message to chatbot
   * Sends conversationId to maintain state across requests
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      // Send to backend with conversationId to maintain state
      const response = await axios.post('/chatbot/chat', {
        message: userInput,
        conversationId: conversationId  // CRITICAL: Send conversationId to maintain session
      });

      if (response.data.status === 'success') {
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: response.data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        toast.error('Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again or contact support@perfumeshop.com',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick suggestion buttons - trigger smart intent-based queries
   */
  const handleQuickSuggestion = async (type) => {
    setShowSuggestions(false);
    setLoading(true);
    
    const suggestionText = {
      'price': 'Show me products under ₹5000',
      'stock': 'What products are in stock?',
      'floral': 'I like floral fragrances',
      'work': 'What perfume for professional work?',
      'romantic': 'Best fragrance for a romantic date?',
      'trending': 'What are your trending products?'
    }[type];

    try {
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        text: suggestionText,
        timestamp: new Date()
      };

      const response = await axios.post('/chatbot/chat', {
        message: suggestionText,
        conversationId: conversationId
      });

      if (response.data.status === 'success') {
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: response.data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);
      }
    } catch (error) {
      console.error('Quick suggestion error:', error);
      toast.error('Failed to process suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgb(217, 119, 6), rgb(180, 83, 9))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            zIndex: 40,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
          aria-label="Open chatbot"
          title="Sophia - Fragrance Assistant"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
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
                <h3 className="font-bold text-lg">Sophia 🌹</h3>
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">BETA</span>
              </div>
              <p className="text-sm text-amber-200 mt-1">Premium Fragrance Assistant ✨</p>
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
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg prose prose-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-none'
                      : 'bg-white border border-amber-200 text-gray-800 rounded-bl-none'
                  }`}
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <span className={`text-xs mt-1 block ${
                    message.type === 'user' ? 'text-amber-100' : 'text-amber-600'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-amber-200 text-gray-800 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Smart Suggestions */}
          {showSuggestions && messages.length <= 1 && !loading && (
            <div className="px-4 py-3 border-t border-amber-200 bg-gradient-to-b from-slate-100 to-slate-50">
              <p className="text-xs font-semibold text-slate-700 mb-3">💡 Try asking me about:</p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickSuggestion('price')}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg transition font-medium border border-amber-300"
                    title="Get products in your budget"
                  >
                    💰 Price & Budget
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('stock')}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-2 rounded-lg transition font-medium border border-emerald-300"
                    title="Check product availability"
                  >
                    📦 Availability
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('work')}
                    className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg transition font-medium border border-slate-400"
                    title="Professional fragrance"
                  >
                    💼 Work / Office
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('romantic')}
                    className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-2 rounded-lg transition font-medium border border-rose-300"
                    title="Special occasion"
                  >
                    💕 Romantic Date
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickSuggestion('floral')}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg transition font-medium border border-amber-300"
                    title="Floral fragrances"
                  >
                    🌸 Floral
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('trending')}
                    className="text-xs bg-amber-150 hover:bg-amber-300 text-amber-900 px-3 py-2 rounded-lg transition font-medium border border-amber-400 font-bold"
                    title="Popular products"
                  >
                    🔥 Trending
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-amber-200 bg-gradient-to-r from-slate-100 to-slate-50 rounded-b-xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="chatbot-input"
                name="message"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about prices, stock, recommendations..."
                className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder-slate-500 bg-white"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 font-medium"
                title="Send message"
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
