import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Send, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import RestaurantSuggestions from "@/components/planning/RestaurantSuggestions";
import ActivitySuggestions from "@/components/planning/ActivitySuggestions";
import ItinerarySummary from "@/components/planning/ItinerarySummary";
import LoadingState from "@/components/planning/LoadingState";
import { toast } from "sonner";

const suggestions = [
  "Romantic Italian in Brooklyn",
  "Fun date under $100",
  "Something adventurous tonight",
  "Impress a foodie",
];

export default function PlanDate() {
  const { currentSession, startPlanning, resetSession, error } = useAppStore();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    try {
      await startPlanning(prompt);
      setPrompt("");
    } catch (err) {
      toast.error("Failed to start planning. Please try again.");
    }
  };

  const handleSuggestion = async (suggestion: string) => {
    try {
      await startPlanning(suggestion);
    } catch (err) {
      toast.error("Failed to start planning. Please try again.");
    }
  };

  // Render based on session stage
  if (currentSession) {
    switch (currentSession.stage) {
      case "loading":
        return <LoadingState />;
      case "restaurants":
        return <RestaurantSuggestions />;
      case "activities":
        return <ActivitySuggestions />;
      case "summary":
        return <ItinerarySummary />;
    }
  }

  return (
    <div className="min-h-screen gradient-warm">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero shadow-glow mb-6"
        >
          <Target className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl font-bold text-foreground mb-2"
        >
          Plan Your Perfect Date
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground"
        >
          Tell me what you're looking for
        </motion.p>
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 mb-8"
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Friday night, want somewhere romantic in Brooklyn with Italian food..."
            className="w-full h-32 p-4 pr-24 rounded-2xl bg-card border border-border shadow-card resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              variant="romantic"
              size="icon"
              onClick={handleSubmit}
              disabled={!prompt.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-muted-foreground">Or try:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestion(suggestion)}
              className="px-4 py-2.5 rounded-full bg-card border border-border shadow-soft text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
