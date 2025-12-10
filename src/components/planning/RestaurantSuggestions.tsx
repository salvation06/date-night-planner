import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, ChevronLeft, Heart, Check, Loader2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
    
    // Mock the Yelp Reservations API call
    // Real API: POST https://api.yelp.com/v3/transactions/{transaction_type}/push
    // See: https://docs.developer.yelp.com/reference/v3_reservations
    
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock reservation response
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
      
      // Proceed to activities after short delay
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
    <div className="min-h-screen bg-background pb-8">
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

      {/* Restaurant Cards */}
      <div className="px-6 py-6 space-y-6">
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card
        variant={isReserved ? "romantic" : "elevated"}
        className={cn(
          "overflow-hidden transition-all duration-300",
          isReserved && "ring-2 ring-green-500"
        )}
      >
        <div className="relative h-48 overflow-hidden">
          <img src={restaurant.photoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {isReserved && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium">
              <Check className="w-4 h-4" />
              Reserved
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-display text-xl font-semibold text-white mb-1">{restaurant.name}</h3>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-gold text-gold" />
                {restaurant.rating}
              </span>
              <span>·</span>
              <span>{restaurant.price}</span>
              <span>·</span>
              <span>{restaurant.cuisine}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {restaurant.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{restaurant.whyThisWorks}</p>
          
          {/* Address */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>{restaurant.address}</span>
            {restaurant.distance && (<><span>·</span><span>{restaurant.distance}</span></>)}
          </div>

          {/* Reserved State */}
          {isReserved ? (
            <div className="pt-4 border-t border-border">
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
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Select a Time</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {restaurant.availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    disabled={isBooking}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedTime === time 
                        ? "bg-primary text-primary-foreground shadow-soft" 
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                      isBooking && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
              
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
                    {selectedTime ? `Reserve for ${selectedTime}` : "Select a time to reserve"}
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
