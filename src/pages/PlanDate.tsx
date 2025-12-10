import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Sparkles, Target, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import RestaurantSuggestions from "@/components/planning/RestaurantSuggestions";
import ActivitySuggestions from "@/components/planning/ActivitySuggestions";
import ItinerarySummary from "@/components/planning/ItinerarySummary";
import LoadingState from "@/components/planning/LoadingState";
import VoiceSearchInterface from "@/components/planning/VoiceSearchInterface";
import LocationPicker from "@/components/planning/LocationPicker";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const suggestions = [
  "Romantic Italian in Brooklyn",
  "Fun date under $100",
  "Something adventurous tonight",
  "Impress a foodie",
];

type ViewMode = "quick" | "conversation";

export default function PlanDate() {
  const { currentSession, startPlanning, resetSession, profile, setProfile } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("quick");
  const [userLocation, setUserLocation] = useState(profile?.location || "");

  // Sync location with profile
  useEffect(() => {
    if (userLocation && userLocation !== profile?.location) {
      setProfile({ location: userLocation });
    }
  }, [userLocation, profile?.location, setProfile]);

  const {
    isListening,
    isSupported,
    interimTranscript,
    toggleListening,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setPrompt(transcript);
    },
    onError: (error) => {
      toast.error(`Voice error: ${error}`);
    },
  });

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

  const handleConversationRestaurantSelect = async (restaurant: any) => {
    // Start planning session with the selected restaurant context
    try {
      await startPlanning(`I want to go to ${restaurant.name} - ${restaurant.cuisine || 'restaurant'}`);
    } catch (err) {
      toast.error("Failed to continue planning.");
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
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
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
          Powered by Yelp's Conversational AI
        </motion.p>
      </div>

      {/* Mode Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-6 mb-4"
      >
        <div className="flex rounded-xl bg-card border border-border p-1">
          <button
            onClick={() => setViewMode("quick")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              viewMode === "quick"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Quick Search
          </button>
          <button
            onClick={() => setViewMode("conversation")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              viewMode === "conversation"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {viewMode === "quick" ? (
          <motion.div
            key="quick"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            {/* Voice Listening Indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mx-6 mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="relative">
                      <Mic className="w-6 h-6 text-primary" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">Listening...</p>
                      {interimTranscript && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{interimTranscript}"
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Picker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-6 mb-6"
            >
              <LocationPicker
                value={userLocation}
                onChange={setUserLocation}
              />
            </motion.div>

            {/* Input Area - only show after location is set */}
            {userLocation && (
              <>
                <div className="px-6 mb-8">
                  <div className="relative">
                    <textarea
                      value={isListening ? interimTranscript || prompt : prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Friday night, want somewhere romantic with Italian food..."
                      className="w-full h-28 p-4 pr-24 rounded-2xl bg-card border border-border shadow-card resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      disabled={isListening}
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      {isSupported && (
                        <Button
                          variant={isListening ? "destructive" : "ghost"}
                          size="icon"
                          onClick={toggleListening}
                          className={cn(
                            "transition-all",
                            isListening && "animate-pulse"
                          )}
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                      )}
                      <Button
                        variant="romantic"
                        size="icon"
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || isListening}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="px-6">
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
                </div>
              </>
            )}

            {/* Feature Badges */}
            <div className="mt-auto px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎙️</span>
                    <span className="text-sm font-medium text-foreground">Voice Search</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Speak naturally to find places</p>
                </div>
                <div className="p-3 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <span className="text-sm font-medium text-foreground">Auto Location</span>
                  </div>
                  <p className="text-xs text-muted-foreground">GPS-powered discovery</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <VoiceSearchInterface
              onSelectRestaurant={handleConversationRestaurantSelect}
              location={userLocation || profile?.location}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
