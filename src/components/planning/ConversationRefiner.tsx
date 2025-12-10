import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Mic, MicOff, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUGGESTION_CHIPS = [
  "Something more casual",
  "Closer to downtown",
  "More romantic",
  "Better for a first date",
  "With outdoor seating",
  "Something cheaper",
];

export default function ConversationRefiner() {
  const { 
    isRefining, 
    refineSearch,
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    isSupported: speechRecognitionSupported,
    interimTranscript,
    toggleListening,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setInput(transcript);
      if (transcript.trim()) {
        handleSubmitMessage(transcript.trim());
      }
    },
    onError: (error) => {
      toast.error(`Voice recognition error: ${error}`);
    },
  });

  const handleSubmitMessage = async (message: string) => {
    if (!message.trim() || isRefining) return;
    
    setInput("");
    
    try {
      await refineSearch(message);
      toast.success("Results updated based on your request");
    } catch (error) {
      toast.error("Failed to refine search. Please try again.");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSubmitMessage(input.trim());
  };

  const handleChipClick = async (suggestion: string) => {
    if (isRefining) return;
    
    try {
      await refineSearch(suggestion);
      toast.success("Results updated based on your request");
    } catch (error) {
      toast.error("Failed to refine search. Please try again.");
    }
  };

  return (
    <div className="bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm border-b border-border shadow-lg">
      <div className="px-6 py-4">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Refine Your Search</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Voice Listening Indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3 flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="relative">
                      <Mic className="w-5 h-5 text-primary" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <span className="font-medium text-primary">Listening...</span>
                    {interimTranscript && (
                      <span className="text-primary/70 max-w-[200px] truncate">
                        {interimTranscript}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTION_CHIPS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleChipClick(suggestion)}
                    disabled={isRefining}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full",
                      "bg-secondary/80 hover:bg-primary/10 text-secondary-foreground",
                      "border border-border/50 hover:border-primary/50",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Input Form with Voice */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                {speechRecognitionSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleListening}
                    disabled={isRefining}
                    className={cn(
                      "shrink-0 transition-all",
                      isListening && "animate-pulse"
                    )}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                )}
                <Input
                  ref={inputRef}
                  value={isListening ? interimTranscript || input : input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Ask a follow-up... e.g., 'Something with a view?'"}
                  disabled={isRefining || isListening}
                  className="flex-1 bg-background/50"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isRefining || isListening}
                  className="shrink-0"
                >
                  {isRefining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isRefining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-center justify-center gap-2 text-sm text-primary"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching for better options...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
