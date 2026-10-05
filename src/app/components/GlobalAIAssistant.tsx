import { useState, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { postAiRoute } from "../services/ai-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GlobalAIAssistantProps {
  pageContext?: string;
  userContext?: string;
  userId?: string;
}

// userId is ignored: the server binds chat storage to the session user.
export function GlobalAIAssistant({ pageContext, userContext, userId: _userId }: GlobalAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your KAYA AI assistant powered by Claude. I can help you with Canadian tenant law, property management, LTB procedures, and more. What can I help you with today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Contextual suggestions based on page
  const getContextualSuggestions = () => {
    const baseContext = pageContext?.toLowerCase() || '';
    
    if (baseContext.includes('application')) {
      return [
        "Analyze this tenant application",
        "What are red flags in screening?",
        "Check income-to-rent ratio",
        "Review credit requirements"
      ];
    } else if (baseContext.includes('propert')) {
      return [
        "How do I increase rent legally?",
        "Vacancy prediction tips",
        "Property valuation factors",
        "Optimize occupancy rate"
      ];
    } else if (baseContext.includes('ltb') || baseContext.includes('form')) {
      return [
        "Explain N4 notice process",
        "How to file L2 application",
        "LTB hearing preparation",
        "Eviction timeline Ontario"
      ];
    } else if (baseContext.includes('tenant')) {
      return [
        "Screen this tenant",
        "Tenant rights in Canada",
        "How to handle complaints",
        "Lease renewal process"
      ];
    } else if (baseContext.includes('payment') || baseContext.includes('financ')) {
      return [
        "Late rent collection steps",
        "Tax deductions for landlords",
        "Rental income reporting",
        "Payment plan best practices"
      ];
    } else if (baseContext.includes('mainten')) {
      return [
        "Emergency maintenance protocol",
        "Tenant maintenance requests",
        "Contractor liability",
        "Preventive maintenance plan"
      ];
    } else {
      return [
        "Can I increase rent this year?",
        "How to evict for non-payment?",
        "Best tenant screening practices",
        "Generate N4 notice"
      ];
    }
  };

  const suggestions = getContextualSuggestions();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = newMessages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const data = await postAiRoute('chat', {
        message: input,
        context: userContext || "KAYA landlord platform assistant",
        pageContext: pageContext || "Dashboard",
        conversationHistory: conversationHistory.slice(0, -1)
      });
      
      if (data.success) {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.response
        }]);
      } else {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.error || "I apologize, but I encountered an error. Please try again."
        }]);
      }
    } catch (error) {
      console.error('Global AI chat error:', error);
      setMessages([...newMessages, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-40 size-14 rounded-full bg-gradient-to-br from-[#0A7A52] to-[#085D3D] shadow-2xl flex items-center justify-center text-white hover:shadow-[#0A7A52]/50 transition-all duration-300"
            style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', right: '1.5rem' }}
            aria-label="Open AI Assistant"
          >
            <Sparkles className="size-6" strokeWidth={2.5} />
            {/* Pulsing indicator */}
            <span className="absolute inset-0 rounded-full bg-[#0A7A52] animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[rgba(0,0,0,0.08)] ${
              isMinimized 
                ? 'w-80 h-16' 
                : 'w-96 h-[600px]'
            }`}
            style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', right: '1.5rem', fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-r from-[#0A7A52] to-[#085D3D]">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-white" strokeWidth={2.5} />
                <div>
                  <h3 className="text-sm font-semibold text-white">KAYA AI Assistant</h3>
                  {pageContext && !isMinimized && (
                    <p className="text-xs text-white/80">Helping with: {pageContext}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Minimize2 className="size-4" strokeWidth={2.5} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="size-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          message.role === "user"
                            ? "bg-[#0A7A52] text-white"
                            : "bg-[#F8F7F4] text-[#0E0F0C] border border-[rgba(0,0,0,0.05)]"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#F8F7F4] text-[#0E0F0C] border border-[rgba(0,0,0,0.05)] rounded-2xl px-4 py-2.5 flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-[#0A7A52]" />
                        <p className="text-sm">Claude is thinking...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {messages.length === 1 && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-[#767570] mb-2 font-medium">Quick questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#E5F4EE] border border-[rgba(0,0,0,0.05)] rounded-full text-xs text-[#0E0F0C] transition-all duration-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t border-[rgba(0,0,0,0.08)] p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask anything..."
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-[#F8F7F4] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A7A52] focus:border-transparent transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="px-3 py-2 bg-[#0A7A52] hover:bg-[#085D3D] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
                      ) : (
                        <Send className="size-4" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
