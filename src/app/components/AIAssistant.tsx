import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { postAiRoute } from "../services/ai-client";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant powered by Claude, trained on Canada's Residential Tenancies Act and LTB decisions. Ask me anything about tenancy law, lease generation, or tenant screening."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    "Can I increase rent?",
    "How do I evict for non-payment?",
    "Generate N4 notice",
    "Show risky applications",
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history for API (exclude system message)
      const conversationHistory = newMessages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const data = await postAiRoute('chat', {
        message: input,
        context: "Canadian landlord platform - helping with tenant law and property management",
        pageContext: "AI Chat Sidebar",
        conversationHistory: conversationHistory.slice(0, -1) // Exclude the message we just sent
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
      console.error('AI chat error:', error);
      setMessages([...newMessages, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 lg:p-6">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="relative w-full lg:w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[rgba(0,0,0,0.08)]"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-r from-[#0A7A52] to-[#085D3D]">
          <div className="flex items-center">
            <Sparkles className="size-5 text-white mr-2" strokeWidth={2.5} />
            <h2 
              className="text-lg font-semibold text-white"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              AI Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[#0A7A52] text-white"
                    : "bg-[#F8F7F4] text-[#0E0F0C] border border-[rgba(0,0,0,0.05)]"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F8F7F4] text-[#0E0F0C] border border-[rgba(0,0,0,0.05)] rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-[#0A7A52]" />
                <p className="text-sm">Claude is thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-[#767570] mb-2 font-medium uppercase tracking-wide">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 bg-[#F8F7F4] hover:bg-[#E5F4EE] border border-[rgba(0,0,0,0.05)] rounded-full text-xs text-[#0E0F0C] transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[rgba(0,0,0,0.08)] p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about tenancy law..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#F8F7F4] border border-[rgba(0,0,0,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A7A52] focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-3 bg-[#0A7A52] hover:bg-[#085D3D] text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <Send className="size-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
