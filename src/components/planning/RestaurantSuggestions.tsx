import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, ChevronLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/types";

export default function RestaurantSuggestions() {
  const { restaurants, currentSession, selectRestaurant, resetSession } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleSelect = () => {
    const restaurant = restaurants.find((r) => r.id === selectedId);
    if (restaurant && selectedTime) {
      selectRestaurant(restaurant, selectedTime);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={resetSession} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="font-display text-xl font-semibold flex items-center gap-2">
                <span>🍝</span> Dinner Suggestions
              </h1>
            </div>
          </div>
          {currentSession?.userPrompt && (
            <p className="text-sm text-muted-foreground">Based on "{currentSession.userPrompt}"</p>
          )}
        </div>
      </div>

      {/* Restaurant Cards */}
      <div className="px-6 py-6 space-y-4">
        {restaurants.map((restaurant, i) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            index={i}
            isSelected={selectedId === restaurant.id}
            selectedTime={selectedId === restaurant.id ? selectedTime : null}
            onSelect={() => setSelectedId(restaurant.id)}
            onSelectTime={(time) => setSelectedTime(time)}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <AnimatePresence>
        {selectedId && selectedTime && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t border-border"
          >
            <Button variant="romantic" size="xl" className="w-full" onClick={handleSelect}>
              <Heart className="w-5 h-5" />
              Reserve for {selectedTime}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
  isSelected: boolean;
  selectedTime: string | null;
  onSelect: () => void;
  onSelectTime: (time: string) => void;
}

function RestaurantCard({ restaurant, index, isSelected, selectedTime, onSelect, onSelectTime }: RestaurantCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card
        variant={isSelected ? "romantic" : "elevated"}
        className={cn("overflow-hidden cursor-pointer transition-all duration-300", isSelected && "ring-2 ring-rose")}
        onClick={onSelect}
      >
        <div className="relative h-48 overflow-hidden">
          <img src={restaurant.photoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
          <div className="flex flex-wrap gap-2 mb-3">
            {restaurant.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{restaurant.whyThisWorks}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>{restaurant.address}</span>
            {restaurant.distance && (<><span>·</span><span>{restaurant.distance}</span></>)}
          </div>
          <AnimatePresence>
            {isSelected && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-rose" />
                    <span className="text-sm font-medium">Available Times</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={(e) => { e.stopPropagation(); onSelectTime(time); }}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", selectedTime === time ? "bg-rose text-white shadow-soft" : "bg-secondary hover:bg-secondary/80 text-secondary-foreground")}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
