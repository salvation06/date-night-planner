import { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Eye, Clock, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Itinerary } from "@/types";

export default function MyDates() {
  const navigate = useNavigate();
  const { itineraries, loadItineraries, isLoading } = useAppStore();

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  const upcoming = itineraries.filter((it) => it.status === "upcoming");
  const past = itineraries.filter((it) => it.status === "past");

  return (
    <div className="min-h-screen gradient-warm pb-32">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-rose-light/10 rounded-full blur-2xl" />
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-6 pt-14 pb-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg mb-5"
          >
            <Heart className="w-8 h-8 text-white fill-white/30" />
          </motion.div>
          
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            My Dates
          </h1>
          <p className="text-white/80 text-sm max-w-xs mx-auto">
            Your collection of memorable moments
          </p>
          
          {/* Stats Row */}
          {itineraries.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-8 mt-6"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{upcoming.length}</p>
                <p className="text-xs text-white/70 uppercase tracking-wide">Upcoming</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{past.length}</p>
                <p className="text-xs text-white/70 uppercase tracking-wide">Memories</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative -mt-4">
        <div className="bg-background/80 backdrop-blur-lg rounded-t-3xl min-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <Heart className="w-10 h-10 text-rose fill-rose/20" />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Heart className="w-10 h-10 text-rose/30" />
                </motion.div>
              </motion.div>
              <p className="mt-4 text-muted-foreground text-sm">Loading your dates...</p>
            </div>
          ) : itineraries.length === 0 ? (
            <EmptyState onPlan={() => navigate("/plan")} />
          ) : (
            <div className="px-6 py-8 space-y-8 max-w-md mx-auto">
              {/* Upcoming Dates */}
              {upcoming.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <h2 className="text-sm font-semibold text-foreground tracking-wide">
                      Coming Up
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {upcoming.map((itinerary, i) => (
                      <DateCard key={itinerary.id} itinerary={itinerary} index={i} />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Past Dates */}
              {past.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-muted-foreground tracking-wide">
                      Sweet Memories
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {past.map((itinerary, i) => (
                      <DateCard key={itinerary.id} itinerary={itinerary} index={i} isPast />
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        className="fixed right-5 bottom-28 z-10"
      >
        <Button
          variant="romantic"
          size="lg"
          className="rounded-full shadow-elevated hover:shadow-glow transition-shadow h-14 px-6 gap-2"
          onClick={() => navigate("/plan")}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Date</span>
        </Button>
      </motion.div>
    </div>
  );
}

function EmptyState({ onPlan }: { onPlan: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-8 py-20 text-center"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-8"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose/20 to-gold/20 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose/30 to-gold/30 flex items-center justify-center">
            <Heart className="w-10 h-10 text-rose fill-rose/20" />
          </div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Sparkles className="w-5 h-5 text-gold absolute -top-1 right-4" />
        </motion.div>
      </motion.div>
      
      <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
        Your love story starts here
      </h2>
      <p className="text-muted-foreground mb-8 max-w-xs leading-relaxed">
        Plan unforgettable dates with AI-powered suggestions tailored just for you
      </p>
      
      <Button 
        variant="romantic" 
        size="lg" 
        onClick={onPlan}
        className="shadow-glow hover:shadow-elevated transition-shadow"
      >
        <Sparkles className="w-5 h-5" />
        Plan Your First Date
      </Button>
    </motion.div>
  );
}

interface DateCardProps {
  itinerary: Itinerary;
  index: number;
  isPast?: boolean;
}

function DateCard({ itinerary, index, isPast }: DateCardProps) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/dates/${itinerary.id}`);
  };

  const openYelpPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itinerary.restaurant.yelpId) {
      window.open(`https://www.yelp.com/biz/${itinerary.restaurant.yelpId}`, '_blank');
    }
  };

  // Generate a gradient based on the headline/cuisine for visual variety
  const gradients = [
    "from-rose/20 via-rose-light/10 to-gold/20",
    "from-gold/20 via-amber-100/10 to-rose/20",
    "from-primary/20 via-rose/10 to-gold/20",
    "from-rose-light/20 via-rose/10 to-primary/20",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group"
    >
      <Card 
        className={cn(
          "overflow-hidden border border-border/50 shadow-soft hover:shadow-card transition-all duration-300 cursor-pointer h-full",
          isPast && "opacity-75"
        )}
        onClick={handleView}
      >
        <CardContent className="p-0 aspect-square flex flex-col">
          {/* Gradient Header */}
          <div className={cn(
            "relative p-3 bg-gradient-to-br flex-shrink-0",
            gradient
          )}>
            {/* Date Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {itinerary.date}
              </span>
              {itinerary.feedback && (
                <span className={cn(
                  "text-sm",
                  itinerary.feedback.rating === "great" && "animate-pulse"
                )}>
                  {itinerary.feedback.rating === "great" && "🎉"}
                  {itinerary.feedback.rating === "meh" && "😐"}
                  {itinerary.feedback.rating === "disaster" && "😬"}
                </span>
              )}
            </div>
          </div>
          
          {/* Theme/Headline */}
          <div className="px-3 pt-2">
            <h3 className="font-display text-sm font-bold text-foreground leading-snug line-clamp-2">
              {itinerary.headline}
            </h3>
          </div>
          
          {/* Details Section */}
          <div className="p-3 pt-2 space-y-2 bg-card flex-1 flex flex-col">
            {/* Restaurant */}
            <div className="flex items-start gap-1.5">
              <span className="text-xs">🍽️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {itinerary.restaurant.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {itinerary.restaurant.cuisine} · {itinerary.restaurant.price}
                </p>
              </div>
            </div>
            
            {/* Activities */}
            {itinerary.activities.length > 0 && (
              <div className="flex items-start gap-1.5">
                <span className="text-xs">✨</span>
                <p className="text-[10px] text-muted-foreground truncate">
                  +{itinerary.activities.length} {itinerary.activities.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
            )}
            
            {/* Spacer */}
            <div className="flex-1" />
            
            {/* Time & Cost */}
            <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />
                <span>{itinerary.timelineBlocks[0]?.time || "7:00 PM"}</span>
              </div>
              <span className="text-[10px] font-medium text-foreground">
                {itinerary.costEstimate}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1.5">
              <Button 
                variant="soft" 
                size="sm"
                className="flex-1 h-6 text-[10px]"
                onClick={(e) => { e.stopPropagation(); handleView(); }}
              >
                <Eye className="w-3 h-3 mr-0.5" />
                View
              </Button>
              {itinerary.restaurant.yelpId && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-[10px] text-rose hover:text-rose-dark"
                  onClick={openYelpPage}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
