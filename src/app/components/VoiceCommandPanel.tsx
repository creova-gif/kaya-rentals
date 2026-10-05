import { motion, AnimatePresence } from "motion/react";
import { Mic, X, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { postAiRoute } from "../services/ai-client";

interface VoiceCommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceCommandPanel({ isOpen, onClose }: VoiceCommandPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    "Show me high-risk tenants",
    "What's my total revenue this month?",
    "Show maintenance requests",
    "List pending applications"
  ]);

  useEffect(() => {
    if (isOpen) {
      setIsListening(false);
      setTranscript("");
      setResponse(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleStartListening = () => {
    setIsListening(true);
    // Simulate voice recognition (2.5 seconds)
    setTimeout(() => {
      const command = "Show me high-risk tenants across all properties";
      setTranscript(command);
      setIsListening(false);
      handleProcessCommand(command);
    }, 2500);
  };

  const handleProcessCommand = async (command: string) => {
    setIsLoading(true);
    
    try {
      const data = await postAiRoute('voice-command', {
        command: command,
        userContext: "Voice Commands - Quick AI Actions"
      });
      
      if (data.success) {
        setResponse(data.response);
      } else {
        setResponse(data.error || "I apologize, but I couldn't process that command. Please try again.");
      }
    } catch (error) {
      console.error('Voice command error:', error);
      setResponse("I'm having trouble connecting right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTranscript(suggestion);
    setIsListening(false);
    handleProcessCommand(suggestion);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="size-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Voice AI Assistant</h2>
                  <p className="text-white/80 text-sm">Powered by Claude AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="size-6 text-white" />
              </button>
            </div>

            {/* Voice Input Button */}
            <div className="flex justify-center">
              <button
                onClick={handleStartListening}
                disabled={isListening || isLoading}
                className={`size-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? "bg-red-500 scale-110 animate-pulse"
                    : "bg-white hover:bg-white/90 hover:scale-105"
                } disabled:opacity-50`}
              >
                {isListening ? (
                  <Mic className="size-12 text-white" />
                ) : (
                  <Mic className="size-12 text-indigo-600" />
                )}
              </button>
            </div>
            <p className="text-white/90 text-center mt-3 text-sm">
              {isListening ? "Listening..." : "Click to speak (simulated)"}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
            {/* Transcript */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  You said:
                </p>
                <p className="text-gray-900">{transcript}</p>
              </motion.div>
            )}

            {/* Loading */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-4"
              >
                <Loader2 className="size-6 text-indigo-600 animate-spin" />
                <p className="text-gray-600">Claude is processing your command...</p>
              </motion.div>
            )}

            {/* Response */}
            {response && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Sparkles className="size-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider mb-2">
                      AI Response:
                    </p>
                    <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                      {response}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            {!transcript && !response && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Try these commands:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left text-sm text-gray-700"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            {(transcript || response) && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setTranscript("");
                    setResponse(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  New Command
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Note: Voice recognition is simulated. Type commands using suggestion buttons or the text input in AI Chat.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
