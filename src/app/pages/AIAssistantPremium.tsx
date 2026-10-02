import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, TrendingUp, FileText, Building2, Loader2 } from "lucide-react";
import { postAiRoute } from "../services/ai-client";

export function AIAssistantPremium() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant" as const,
      content: "Hello! I'm KAYA AI powered by Claude, your expert property management assistant. I can help you with tenant screening, lease generation, payment tracking, and more. What would you like to know?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    { icon: TrendingUp, text: "Show risky applicants", query: "Show me all high-risk tenant applicants" },
    { icon: FileText, text: "Generate lease", query: "Generate a lease for Unit 4A" },
    { icon: Building2, text: "Property overview", query: "Give me an overview of all my properties" },
  ];

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage = { role: "user" as const, content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage("");
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = newMessages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const data = await postAiRoute('chat', {
        message: userMessage.content,
        context: "Canadian landlord property management platform - assisting with tenant management, legal compliance, and property operations",
        conversationHistory: conversationHistory.slice(0, -1)
      });

      if (data.success) {
        const aiResponse = {
          role: "assistant" as const,
          content: data.response,
        };
        setMessages([...newMessages, aiResponse]);
      } else {
        const errorResponse = {
          role: "assistant" as const,
          content: data.error || "I apologize, but I encountered an error. Please try again.",
        };
        setMessages([...newMessages, errorResponse]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorResponse = {
        role: "assistant" as const,
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages([...newMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    setMessage(query);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-[48px] font-semibold text-[#0A0A0A] leading-tight tracking-tight">
                AI Assistant
              </h1>
            </div>
          </div>
          <p className="text-[14px] text-[#9CA3AF]">
            Powered by Claude AI • Ask anything about tenants, rent, or leases
          </p>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-[12px] text-[#9CA3AF] uppercase tracking-wider mb-4">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon;
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  onClick={() => handleSuggestionClick(suggestion.query)}
                  className="flex items-center gap-3 p-4 bg-white border border-black/[0.08] rounded-xl hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 text-left"
                >
                  <div className="size-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <Icon className="size-5 text-[#0A0A0A]" />
                  </div>
                  <span className="text-[14px] font-medium text-[#0A0A0A]">
                    {suggestion.text}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Chat Messages */}
        <div className="mb-8">
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-start gap-3 max-w-2xl">
                      <div className="size-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="size-5 text-white" />
                      </div>
                      <div className="bg-[#F5F5F5] rounded-2xl rounded-tl-none p-6">
                        <p className="text-[14px] text-[#0A0A0A] leading-relaxed whitespace-pre-line">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div className="bg-[#0A0A0A] text-white rounded-2xl rounded-tr-none p-6 max-w-2xl">
                      <p className="text-[14px] leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="size-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="size-5 text-white" />
                    </div>
                    <div className="bg-[#F5F5F5] rounded-2xl rounded-tl-none p-6 flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-[#6366F1]" />
                      <p className="text-[14px] text-[#0A0A0A]">Claude is thinking...</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area - Minimal & Clean */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-8"
        >
          <div className="bg-white border border-black/[0.08] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything about your properties..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-[14px] text-[#0A0A0A] placeholder:text-[#9CA3AF] disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="size-12 rounded-xl bg-[#0A0A0A] hover:bg-[#1C1C1C] disabled:bg-[#F5F5F5] disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <Send className={`size-5 ${message.trim() ? "text-white" : "text-[#9CA3AF]"}`} />
                )}
              </button>
            </div>
          </div>
          <p className="text-[12px] text-[#9CA3AF] text-center mt-3">
            Powered by Claude AI • Canada RTA compliant
          </p>
        </motion.div>
      </div>
    </div>
  );
}
