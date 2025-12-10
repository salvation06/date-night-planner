import { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Eye, Star, MapPin, Clock, Sparkles, ExternalLink } from "lucide-react";
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
            <div className="px-5 py-8 space-y-8">
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
                  <div className="space-y-4">
                    {upcoming.map((itinerary, i) => (
                      <DateCard key={itinerary.id} itinerary={itinerary} index={i} featured />
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
                  <div className="space-y-3">
                    {past.map((itinerary, i) => (
                      <DateCard key={itinerary.id} itinerary={itinerary} index={i} />
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
  featured?: boolean;
}

function DateCard({ itinerary, index, featured }: DateCardProps) {
  const navigate = useNavigate();
  const isPast = itinerary.status === "past";

  const handleView = () => {
    navigate(`/dates/${itinerary.id}`);
  };

  const openYelpPage = () => {
    if (itinerary.restaurant.yelpId) {
      window.open(`https://www.yelp.com/biz/${itinerary.restaurant.yelpId}`, '_blank');
    }
  };

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        whileHover={{ y: -2 }}
        className="group"
      >
        <Card 
          variant="elevated" 
          className="overflow-hidden border-0 shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer"
          onClick={handleView}
        >
          <CardContent className="p-0">
            {/* Featured Image */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={itinerary.restaurant.photoUrl}
                alt={itinerary.restaurant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Date Badge */}
              <div className="absolute top-3 left-3">
                <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-sm">
                  <p className="text-xs font-semibold text-foreground">{itinerary.date}</p>
                </div>
              </div>
              
              {/* Headline on Image */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-xl font-bold text-white mb-1 drop-shadow-lg">
                  {itinerary.headline}
                </h3>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{itinerary.restaurant.name}</span>
                  {itinerary.activities.length > 0 && (
                    <>
                      <span className="text-white/50">·</span>
                      <span className="text-white/80">+{itinerary.activities.length} activities</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Card Body */}
            <div className="p-4 bg-gradient-to-b from-card to-background/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{itinerary.timelineBlocks[0]?.time || "7:00 PM"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{itinerary.costEstimate}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {itinerary.restaurant.yelpId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-rose hover:text-rose-dark"
                      onClick={(e) => { e.stopPropagation(); openYelpPage(); }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Yelp
                    </Button>
                  )}
                  <Button 
                    variant="soft" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleView(); }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Compact card for past dates
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        variant="elevated" 
        className={cn(
          "overflow-hidden border-0 shadow-soft hover:shadow-card transition-all cursor-pointer",
          isPast && "opacity-80"
        )}
        onClick={handleView}
      >
        <CardContent className="p-0">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-l-xl">
              <img
                src={itinerary.restaurant.photoUrl}
                alt={itinerary.restaurant.name}
                className={cn(
                  "w-full h-full object-cover",
                  isPast && "grayscale"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 py-3 pr-4">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {itinerary.date}
                  </p>
                  <h3 className="font-semibold text-foreground truncate">
                    {itinerary.headline}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {itinerary.restaurant.name}
                  </p>
                </div>
                
                {itinerary.feedback && (
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium ml-2 shrink-0",
                      itinerary.feedback.rating === "great" &&
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      itinerary.feedback.rating === "meh" &&
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      itinerary.feedback.rating === "disaster" &&
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {itinerary.feedback.rating === "great" && "🎉"}
                    {itinerary.feedback.rating === "meh" && "😐"}
                    {itinerary.feedback.rating === "disaster" && "😬"}
                  </div>
                )}
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-2 mt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="-ml-2 h-7 px-2 text-xs"
                  onClick={(e) => { e.stopPropagation(); handleView(); }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View
                </Button>
                {isPast && !itinerary.feedback && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2 text-xs text-gold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Star className="w-3.5 h-3.5 mr-1" />
                    Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
