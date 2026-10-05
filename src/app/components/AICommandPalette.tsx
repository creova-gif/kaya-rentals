import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Sparkles, 
  Home, 
  FileText, 
  Users, 
  DollarSign, 
  Wrench,
  MessageSquare,
  TrendingUp,
  Shield,
  ArrowRight,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router";
import { postAiRoute } from "../services/ai-client";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: any;
  category: "navigation" | "ai" | "action";
  action: () => void;
  keywords?: string[];
}

interface AICommandPaletteProps {
  userId?: string;
}

// userId is ignored: voice context is loaded for the session user on the server.
export function AICommandPalette({ userId: _userId }: AICommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Listen for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setSearch("");
        setAiResponse(null);
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setAiResponse(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for openAIWithQuery events from AIContextualHelper suggestions
  useEffect(() => {
    const handleOpenWithQuery = (e: Event) => {
      const query = (e as CustomEvent<{ query: string }>).detail?.query;
      if (!query) return;
      setSearch(query);
      setAiResponse(null);
      setSelectedIndex(0);
      setIsOpen(true);
      // Auto-execute the AI query after palette opens
      setTimeout(() => handleAICommand(query), 200);
    };
    window.addEventListener("openAIWithQuery", handleOpenWithQuery);
    return () => window.removeEventListener("openAIWithQuery", handleOpenWithQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus input + lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) inputRef.current.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const commands: Command[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      description: "View your property overview",
      icon: Home,
      category: "navigation",
      action: () => { navigate("/app"); setIsOpen(false); },
      keywords: ["home", "overview", "main"]
    },
    {
      id: "nav-applications",
      title: "Go to Applications",
      description: "Review tenant applications",
      icon: FileText,
      category: "navigation",
      action: () => { navigate("/app/applications"); setIsOpen(false); },
      keywords: ["tenants", "screen", "review"]
    },
    {
      id: "nav-properties",
      title: "Go to Properties",
      description: "Manage your properties",
      icon: Home,
      category: "navigation",
      action: () => { navigate("/app/properties"); setIsOpen(false); },
      keywords: ["buildings", "units", "portfolio"]
    },
    {
      id: "nav-payments",
      title: "Go to Payments",
      description: "Track rent collection",
      icon: DollarSign,
      category: "navigation",
      action: () => { navigate("/app/payments"); setIsOpen(false); },
      keywords: ["rent", "money", "financial"]
    },
    {
      id: "nav-maintenance",
      title: "Go to Maintenance",
      description: "View maintenance requests",
      icon: Wrench,
      category: "navigation",
      action: () => { navigate("/app/maintenance"); setIsOpen(false); },
      keywords: ["repairs", "contractors", "work orders"]
    },
    {
      id: "nav-ltb",
      title: "Go to LTB Forms",
      description: "Access Ontario LTB forms",
      icon: Shield,
      category: "navigation",
      action: () => { navigate("/app/ltb-forms"); setIsOpen(false); },
      keywords: ["legal", "eviction", "notices", "N4", "N5", "L1", "L2"]
    },
    {
      id: "nav-analytics",
      title: "Go to Analytics",
      description: "View property insights",
      icon: TrendingUp,
      category: "navigation",
      action: () => { navigate("/app/analytics"); setIsOpen(false); },
      keywords: ["reports", "stats", "data"]
    },
    // AI Actions
    {
      id: "ai-screen",
      title: "Screen a Tenant with AI",
      description: "AI-powered risk assessment",
      icon: Shield,
      category: "ai",
      action: () => { navigate("/app/tenant-screening"); setIsOpen(false); },
      keywords: ["analyze", "evaluate", "check"]
    },
    {
      id: "ai-assistant",
      title: "Open AI Chat Assistant",
      description: "Ask Claude about tenant law",
      icon: MessageSquare,
      category: "ai",
      action: () => { navigate("/app/ai-assistant"); setIsOpen(false); },
      keywords: ["chat", "help", "question"]
    },
    {
      id: "ai-demo",
      title: "View All AI Features",
      description: "Explore KAYA's AI capabilities",
      icon: Sparkles,
      category: "ai",
      action: () => { navigate("/ai-demo"); setIsOpen(false); },
      keywords: ["features", "demo", "showcase"]
    },
  ];

  // Process AI command if search starts with specific patterns
  const handleAICommand = async (query: string) => {
    if (!query.trim()) return;

    setIsProcessingAI(true);
    setAiResponse(null);

    try {
      const data = await postAiRoute('voice-command', {
        command: query,
        userContext: "Command Palette - Quick AI Action"
      });
      
      if (data.success) {
        setAiResponse(data.response);
      } else {
        setAiResponse(data.error || "I couldn't process that command. Please try rephrasing.");
      }
    } catch (error) {
      console.error('AI command error:', error);
      setAiResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.includes(searchLower))
    );
  });

  // Detect AI questions (contains "?", "how", "what", "show", etc.)
  const isAIQuery = search.length > 5 && (
    search.includes("?") ||
    search.toLowerCase().startsWith("how ") ||
    search.toLowerCase().startsWith("what ") ||
    search.toLowerCase().startsWith("show ") ||
    search.toLowerCase().startsWith("find ") ||
    search.toLowerCase().startsWith("list ") ||
    search.toLowerCase().startsWith("generate ")
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < (isAIQuery ? 0 : filteredCommands.length - 1) ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isAIQuery) {
        handleAICommand(search);
      } else if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[rgba(0,0,0,0.08)] flex flex-col"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxHeight: "calc(100vh - 10rem)" }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(0,0,0,0.08)] flex-shrink-0">
            <Search className="size-5 text-[#767570]" strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands or ask AI anything..."
              className="flex-1 text-[15px] text-[#0E0F0C] placeholder-[#767570] focus:outline-none bg-transparent"
            />
            <kbd className="px-2 py-1 text-xs font-mono text-[#767570] bg-[#F8F7F4] rounded border border-[rgba(0,0,0,0.08)]">
              ESC
            </kbd>
          </div>

          {/* Results — scrollable */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {/* AI Query Suggestion */}
            {isAIQuery && (
              <button
                onClick={() => handleAICommand(search)}
                disabled={isProcessingAI}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F8F7F4] transition-colors text-left border-b border-[rgba(0,0,0,0.05)]"
              >
                <div className="size-10 rounded-xl bg-gradient-to-br from-[#0A7A52] to-[#085D3D] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="size-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0E0F0C]">
                    {isProcessingAI ? "Processing with AI..." : "Ask AI: "}
                    <span className="text-[#0A7A52]">{search}</span>
                  </p>
                  <p className="text-xs text-[#767570]">
                    {isProcessingAI ? "Claude is thinking..." : "Press Enter or click to get instant AI answer"}
                  </p>
                </div>
                <ArrowRight className="size-4 text-[#0A7A52]" strokeWidth={2.5} />
              </button>
            )}

            {/* AI Response */}
            {aiResponse && (
              <div className="px-5 py-4 bg-[#E5F4EE] border-b border-[rgba(0,0,0,0.05)]">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-[#0A7A52] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="size-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[#0A7A52] mb-1 uppercase tracking-wide">AI Response:</p>
                    <p className="text-sm text-[#0E0F0C] whitespace-pre-line leading-relaxed">{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Commands List */}
            {!isAIQuery && filteredCommands.length > 0 && (
              <div>
                {["navigation", "ai", "action"].map((category) => {
                  const categoryCommands = filteredCommands.filter(cmd => cmd.category === category);
                  if (categoryCommands.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className="px-5 py-2 bg-[#F8F7F4] border-b border-[rgba(0,0,0,0.05)]">
                        <p className="text-xs font-medium text-[#767570] uppercase tracking-wide">
                          {category === "navigation" ? "Navigation" : category === "ai" ? "AI Actions" : "Quick Actions"}
                        </p>
                      </div>
                      {categoryCommands.map((cmd, idx) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F8F7F4] transition-colors text-left ${
                              selectedIndex === globalIndex ? "bg-[#F8F7F4]" : ""
                            }`}
                          >
                            <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              cmd.category === "ai" 
                                ? "bg-gradient-to-br from-[#0A7A52] to-[#085D3D]"
                                : "bg-[#F8F7F4] border border-[rgba(0,0,0,0.08)]"
                            }`}>
                              <Icon className={`size-5 ${cmd.category === "ai" ? "text-white" : "text-[#0A7A52]"}`} strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#0E0F0C]">{cmd.title}</p>
                              {cmd.description && (
                                <p className="text-xs text-[#767570]">{cmd.description}</p>
                              )}
                            </div>
                            <ArrowRight className="size-4 text-[#767570] opacity-0 group-hover:opacity-100" strokeWidth={2} />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {!isAIQuery && filteredCommands.length === 0 && !aiResponse && (
              <div className="px-5 py-12 text-center">
                <div className="size-16 mx-auto mb-4 rounded-full bg-[#F8F7F4] flex items-center justify-center">
                  <Search className="size-8 text-[#767570]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[#767570] mb-2">No commands found</p>
                <p className="text-xs text-[#767570]">
                  Try asking AI by typing a question like "How do I evict a tenant?"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[#F8F7F4] border-t border-[rgba(0,0,0,0.05)] flex items-center justify-between text-xs text-[#767570] flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-[rgba(0,0,0,0.08)]">↑</kbd>
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-[rgba(0,0,0,0.08)]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-[rgba(0,0,0,0.08)]">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Zap className="size-3 text-[#0A7A52]" strokeWidth={2.5} />
              Powered by Claude AI
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
