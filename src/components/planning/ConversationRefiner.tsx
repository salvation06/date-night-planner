import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
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
    currentSession,
    restaurants,
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isRefining) return;
    
    const message = input.trim();
    setInput("");
    setLastQuery(message);
    
    try {
      await refineSearch(message);
      toast.success("Results updated based on your request");
    } catch (error) {
      toast.error("Failed to refine search. Please try again.");
    }
  };

  const handleChipClick = async (suggestion: string) => {
    if (isRefining) return;
    setLastQuery(suggestion);
    
    try {
      await refineSearch(suggestion);
      toast.success("Results updated based on your request");
    } catch (error) {
      toast.error("Failed to refine search. Please try again.");
    }
  };

  return (
    <div className="bg-gradient-to-t from-card/95 to-card/80 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Refine Your Search</h3>
          {lastQuery && (
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Last: "{lastQuery}"
            </span>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question... e.g., 'Something with a view?'"
            disabled={isRefining}
            className="flex-1 bg-background/50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isRefining}
            className="shrink-0"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Refine
              </>
            )}
          </Button>
        </form>

        {/* Loading indicator overlay */}
        <AnimatePresence>
          {isRefining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center justify-center gap-2 text-sm text-primary"
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
