import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

const SUGGESTION_CHIPS = [
  "Something more casual?",
  "Closer to downtown?",
  "More romantic atmosphere",
  "Better for a first date",
  "With outdoor seating",
  "Something cheaper",
];

export default function ConversationRefiner() {
  const { 
    conversationHistory, 
    isRefining, 
    refineSearch,
    currentSession 
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationHistory.length > 0 && isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory, isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isRefining) return;
    
    const message = input.trim();
    setInput("");
    setIsExpanded(true);
    await refineSearch(message);
  };

  const handleChipClick = async (suggestion: string) => {
    setIsExpanded(true);
    await refineSearch(suggestion);
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border">
      {/* Collapsible Conversation History */}
      <AnimatePresence>
        {isExpanded && conversationHistory.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto px-6 py-3 space-y-3">
              {conversationHistory.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3" />
                        <span>Yelp AI</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button for History */}
      {conversationHistory.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border/50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Hide conversation
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show conversation ({conversationHistory.length} messages)
            </>
          )}
        </button>
      )}

      {/* Input Area */}
      <div className="px-6 py-4">
        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTION_CHIPS.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleChipClick(suggestion)}
              disabled={isRefining}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full",
                "bg-secondary/80 hover:bg-secondary text-secondary-foreground",
                "border border-border/50 hover:border-primary/30",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Refine your search... 'Something more romantic?'"
              disabled={isRefining}
              className="pl-10 pr-4 bg-background/50"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isRefining}
            className="shrink-0"
          >
            {isRefining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Helper Text */}
        <p className="mt-2 text-xs text-muted-foreground text-center">
          <Sparkles className="w-3 h-3 inline-block mr-1" />
          Ask follow-up questions to refine your results
        </p>
      </div>
    </div>
  );
}
