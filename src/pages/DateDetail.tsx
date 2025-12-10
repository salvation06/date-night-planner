import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Share2, Sparkles, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";
import type { Itinerary } from "@/types";

export default function DateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { itineraries, loadItineraries, isLoading } = useAppStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  useEffect(() => {
    if (itineraries.length > 0 && id) {
      const found = itineraries.find((it) => it.id === id);
      setItinerary(found || null);
    }
  }, [itineraries, id]);

  const handleShare = () => {
    if (!itinerary) return;
    if (navigator.share) {
      navigator.share({
        title: `Date: ${itinerary.headline}`,
        text: `Check out our date plan: ${itinerary.restaurant.name}`,
      });
    } else {
      navigator.clipboard.writeText(
        `Date: ${itinerary.headline}\n${itinerary.restaurant.name}`
      );
      toast.success("Copied to clipboard!");
    }
  };

  const openDirections = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold mb-4">Date not found</h1>
        <Button variant="outline" onClick={() => navigate("/dates")}>
          Back to My Dates
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose to-rose-dark opacity-90" />
        <div className="relative px-6 pt-12 pb-8">
          <button
            onClick={() => navigate("/dates")}
            className="p-2 -ml-2 rounded-full text-white/80 hover:bg-white/10 transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              {itinerary.status === "upcoming" ? "Upcoming Date" : "Past Date"}
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              {itinerary.headline}
            </h1>
            <p className="text-white/80">{itinerary.date}</p>
          </motion.div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-8">
        <div className="relative">
          <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-border" />
          <div className="space-y-6">
            {itinerary.timelineBlocks.map((block, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex gap-4"
              >
                <div className="relative z-10 w-11 h-11 rounded-xl bg-card border border-border shadow-soft flex items-center justify-center text-xl shrink-0">
                  {block.icon}
                </div>
                <Card variant="elevated" className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{block.title}</h3>
                      <span className="text-sm font-medium text-rose">
                        {block.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {block.subtitle}
                    </p>
                    {block.extra && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{block.extra}</span>
                      </div>
                    )}
                    {block.hasLocation && block.extra && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-2 text-rose"
                        onClick={() => openDirections(block.extra!)}
                      >
                        <MapPin className="w-4 h-4" />
                        Get Directions
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="px-6 pb-8">
        <Card variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Cost</span>
            <span className="font-semibold text-lg">{itinerary.costEstimate}</span>
          </div>
        </Card>
      </div>

      {/* Feedback (if past and has feedback) */}
      {itinerary.feedback && (
        <div className="px-6 pb-8">
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Your Review</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {itinerary.feedback.rating === "great" && "🎉 Great date!"}
              {itinerary.feedback.rating === "meh" && "😐 It was okay"}
              {itinerary.feedback.rating === "disaster" && "😬 Didn't go well"}
              {itinerary.feedback.comment && ` - ${itinerary.feedback.comment}`}
            </p>
          </Card>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="romantic"
            size="lg"
            className="flex-1"
            onClick={() => openDirections(itinerary.restaurant.address)}
          >
            <ExternalLink className="w-4 h-4" />
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
