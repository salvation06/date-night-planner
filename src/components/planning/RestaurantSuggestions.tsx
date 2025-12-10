import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, ChevronLeft, Heart, Check, Loader2, CalendarCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ConversationRefiner from "./ConversationRefiner";
import type { Restaurant } from "@/types";

interface ReservationState {
  restaurantId: string;
  time: string;
  status: "pending" | "confirmed";
  confirmationNumber?: string;
}

export default function RestaurantSuggestions() {
  const { restaurants, currentSession, selectRestaurant, resetSession } = useAppStore();
  const [reservation, setReservation] = useState<ReservationState | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const handleReserve = async (restaurant: Restaurant, time: string) => {
    setIsBooking(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const confirmationNumber = `YLP-${Date.now().toString(36).toUpperCase()}`;
      
      setReservation({
        restaurantId: restaurant.id,
        time,
        status: "confirmed",
        confirmationNumber,
      });
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Reservation Confirmed!</span>
          <span className="text-sm text-muted-foreground">
            {restaurant.name} at {time}
          </span>
          <span className="text-xs font-mono">#{confirmationNumber}</span>
        </div>
      );
      
      setTimeout(() => {
        selectRestaurant(restaurant, time);
      }, 1000);
      
    } catch (error) {
      toast.error("Failed to make reservation. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={resetSession} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="font-display text-xl font-semibold flex items-center gap-2">
                <span>🍝</span> Choose Your Restaurant
              </h1>
            </div>
          </div>
          {currentSession?.userPrompt && (
            <p className="text-sm text-muted-foreground">Based on "{currentSession.userPrompt}"</p>
          )}
        </div>
      </div>

      {/* Multi-Turn Conversation Refiner - at top */}
      <ConversationRefiner />

      {/* Restaurant Cards - Grid Layout */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, i) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              index={i}
              isBooking={isBooking && reservation?.restaurantId === restaurant.id}
              isReserved={reservation?.restaurantId === restaurant.id && reservation?.status === "confirmed"}
              reservedTime={reservation?.restaurantId === restaurant.id ? reservation?.time : undefined}
              confirmationNumber={reservation?.restaurantId === restaurant.id ? reservation?.confirmationNumber : undefined}
              onReserve={(time) => handleReserve(restaurant, time)}
            />
          ))}
        </div>
      </div>

      {/* Reservation Info Banner */}
      <AnimatePresence>
        {reservation?.status === "confirmed" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 p-4 bg-green-500/10 border-t border-green-500/20"
          >
            <div className="flex items-center justify-center gap-3">
              <CalendarCheck className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">
                Finding activities near your restaurant...
              </span>
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
  isBooking: boolean;
  isReserved: boolean;
  reservedTime?: string;
  confirmationNumber?: string;
  onReserve: (time: string) => void;
}

function RestaurantCard({ 
  restaurant, 
  index, 
  isBooking,
  isReserved,
  reservedTime,
  confirmationNumber,
  onReserve 
}: RestaurantCardProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Build Yelp URL from yelp_id
  const yelpUrl = restaurant.yelpId 
    ? `https://www.yelp.com/biz/${restaurant.yelpId}`
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        variant={isReserved ? "romantic" : "elevated"}
        className={cn(
          "h-full flex flex-col overflow-hidden transition-all duration-300",
          isReserved && "ring-2 ring-green-500"
        )}
      >
        <CardContent className="p-5 flex flex-col flex-1">
          {/* Header with Name & Rating */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display text-lg font-semibold leading-tight">{restaurant.name}</h3>
              {isReserved && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium shrink-0">
                  <Check className="w-3 h-3" />
                  Reserved
                </span>
              )}
            </div>
            
            {/* Rating, Price, Cuisine */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 text-foreground font-medium">
                <Star className="w-4 h-4 fill-gold text-gold" />
                {restaurant.rating}
              </span>
              {restaurant.price && (
                <>
                  <span>·</span>
                  <span className="text-primary font-medium">{restaurant.price}</span>
                </>
              )}
              {restaurant.cuisine && (
                <>
                  <span>·</span>
                  <span>{restaurant.cuisine}</span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {restaurant.tags && restaurant.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {restaurant.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3 flex-1">
            {restaurant.whyThisWorks}
          </p>
          
          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {restaurant.address}
              {restaurant.distance && <span className="ml-1">· {restaurant.distance}</span>}
            </span>
          </div>

          {/* View on Yelp Button */}
          {yelpUrl && (
            <a
              href={yelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 rounded-lg bg-[#FF1A1A] hover:bg-[#E60000] text-white font-medium text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Yelp
            </a>
          )}

          {/* Reserved State */}
          {isReserved ? (
            <div className="pt-4 border-t border-border mt-auto">
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div>
                  <p className="font-medium text-green-700">Reservation Confirmed</p>
                  <p className="text-sm text-green-600">{reservedTime}</p>
                </div>
                {confirmationNumber && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confirmation</p>
                    <p className="font-mono text-sm text-green-700">#{confirmationNumber}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Time Selection & Reserve */
            <div className="pt-4 border-t border-border mt-auto">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Select a Time</span>
              </div>
              <Select
                value={selectedTime || ""}
                onValueChange={setSelectedTime}
                disabled={isBooking}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Choose a reservation time" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {restaurant.availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Reserve Button */}
              <Button
                variant="romantic"
                className="w-full"
                disabled={!selectedTime || isBooking}
                onClick={() => selectedTime && onReserve(selectedTime)}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Making Reservation...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    {selectedTime ? `Reserve for ${selectedTime}` : "Select a time"}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
