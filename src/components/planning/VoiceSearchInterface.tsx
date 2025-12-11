import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Loader2, MessageSquare, MapPin, Star, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { sendYelpChatMessage, textToSpeech } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  restaurants?: Restaurant[];
  timestamp: Date;
}

interface Restaurant {
  yelp_id: string;
  name: string;
  photo_url?: string;
  rating?: number;
  price?: string;
  cuisine?: string;
  address?: string;
  distance?: string;
  url?: string;
  why_this_works?: string;
}

interface VoiceSearchInterfaceProps {
  onRestaurantsFound?: (restaurants: Restaurant[]) => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  location?: string;
}

export default function VoiceSearchInterface({
  onRestaurantsFound,
  onSelectRestaurant,
  location,
}: VoiceSearchInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset conversation on mount to ensure fresh results every time
  useEffect(() => {
    setMessages([]);
    setConversationId(undefined);
    setInputText("");
  }, [location]); // Reset when location changes too

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const {
    isListening,
    isSupported: speechRecognitionSupported,
    interimTranscript,
    toggleListening,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputText(transcript);
    },
    onError: (error) => {
      toast.error(`Voice recognition error: ${error}`);
    },
  });

  // ElevenLabs TTS speak function
  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      const audioBase64 = await textToSpeech(text);
      if (audioBase64) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await sendYelpChatMessage(
        text,
        conversationId,
        undefined,
        location
      );

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const aiResponse = response.ai_response || "Here are some options I found for you:";
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse,
        restaurants: response.restaurants,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Read response aloud if voice is enabled (using ElevenLabs)
      if (voiceEnabled) {
        // Build speech text including restaurant names
        let speechText = aiResponse;
        if (response.restaurants?.length > 0) {
          const restaurantNames = response.restaurants
            .slice(0, 3)
            .map((r: Restaurant) => r.name)
            .join(", ");
          speechText += ` I found ${response.restaurants.length} options including ${restaurantNames}.`;
        }
        speak(speechText);
      }

      if (response.restaurants?.length > 0) {
        onRestaurantsFound?.(response.restaurants);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      
      if (voiceEnabled) {
        speak("Sorry, I had trouble finding that. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      cancelSpeech();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const suggestedQuestions = [
    "Find romantic Italian restaurants nearby",
    "What about something more casual?",
    "Do any of these have outdoor seating?",
    "Can you find places with live music?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header with voice toggle */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Yelp AI Chat</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleVoice}
          className={cn(
            "gap-2",
            voiceEnabled ? "text-primary" : "text-muted-foreground"
          )}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-xs">Voice On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="text-xs">Voice Off</span>
            </>
          )}
        </Button>
      </div>

      {/* Voice Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-lg">
              <div className="relative">
                <Mic className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <span className="font-medium">Listening...</span>
              {interimTranscript && (
                <span className="text-primary-foreground/70 max-w-[200px] truncate">
                  {interimTranscript}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking Indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-primary/10 border-b border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-primary font-medium">Speaking...</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelSpeech}
                className="text-xs h-6 px-2"
              >
                Stop
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Start a Conversation</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Ask me anything about finding the perfect spot for your date!
            </p>
            {voiceEnabled && (
              <p className="text-xs text-primary mb-6">
                🔊 Voice responses are enabled
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.slice(0, 2).map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Restaurant Cards */}
                {message.restaurants && message.restaurants.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.restaurants.map((restaurant) => (
                      <motion.div
                        key={restaurant.yelp_id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-background rounded-xl overflow-hidden border border-border"
                      >
                        {restaurant.photo_url && (
                          <img
                            src={restaurant.photo_url}
                            alt={restaurant.name}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">
                              {restaurant.name}
                            </h4>
                            {restaurant.rating && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">
                                  {restaurant.rating}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                            {restaurant.price && (
                              <>
                                <span>·</span>
                                <span>{restaurant.price}</span>
                              </>
                            )}
                            {restaurant.distance && (
                              <>
                                <span>·</span>
                                <span>{restaurant.distance}</span>
                              </>
                            )}
                          </div>
                          {restaurant.address && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{restaurant.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="romantic"
                              onClick={() => onSelectRestaurant?.(restaurant)}
                              className="flex-1"
                            >
                              Select This
                            </Button>
                            {restaurant.url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <a
                                  href={restaurant.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Searching Yelp...
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up suggestions */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Follow-up questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(1).map((question) => (
              <button
                key={question}
                onClick={() => sendMessage(question)}
                className="px-3 py-1.5 rounded-full bg-secondary/50 text-secondary-foreground text-xs hover:bg-secondary transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          {speechRecognitionSupported && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleListening}
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
          <input
            type="text"
            value={isListening ? interimTranscript || inputText : inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask about restaurants, vibes, or preferences..."}
            className="flex-1 px-4 py-2 rounded-full bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isListening}
          />
          <Button
            type="submit"
            variant="romantic"
            size="icon"
            disabled={!inputText.trim() || isLoading || isListening}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
