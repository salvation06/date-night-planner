import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Loader2, MessageSquare, MapPin, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { sendYelpChatMessage } from "@/lib/api";
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

  const {
    isListening,
    isSupported,
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

  // Auto-send when voice recognition completes with text
  useEffect(() => {
    if (!isListening && inputText.trim() && messages.length === 0) {
      // Don't auto-send, let user review and send manually
    }
  }, [isListening, inputText, messages.length]);

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

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.ai_response || "Here are some options I found for you:",
        restaurants: response.restaurants,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.restaurants?.length > 0) {
        onRestaurantsFound?.(response.restaurants);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const suggestedQuestions = [
    "Find romantic Italian restaurants nearby",
    "What about something more casual?",
    "Do any of these have outdoor seating?",
    "Can you find places with live music?",
  ];

  return (
    <div className="flex flex-col h-full">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Start a Conversation</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Ask me anything about finding the perfect spot for your date!
            </p>
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
          {isSupported && (
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
