import { useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Eye, Star } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">My Dates</h1>
        </motion.div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Calendar className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
      ) : itineraries.length === 0 ? (
        <EmptyState onPlan={() => navigate("/plan")} />
      ) : (
        <div className="px-6 space-y-8">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((itinerary, i) => (
                  <DateCard key={itinerary.id} itinerary={itinerary} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Past Dates
              </h2>
              <div className="space-y-3">
                {past.map((itinerary, i) => (
                  <DateCard key={itinerary.id} itinerary={itinerary} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* FAB */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="fixed right-6 bottom-28"
      >
        <Button
          variant="romantic"
          size="lg"
          className="rounded-full shadow-elevated"
          onClick={() => navigate("/plan")}
        >
          <Plus className="w-5 h-5" />
          Plan New Date
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
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
        <Calendar className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-display text-xl font-semibold mb-2">No dates yet</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Start planning your first memorable date with AI-powered suggestions
      </p>
      <Button variant="romantic" size="lg" onClick={onPlan}>
        <Plus className="w-5 h-5" />
        Plan Your First Date
      </Button>
    </motion.div>
  );
}

interface DateCardProps {
  itinerary: Itinerary;
  index: number;
}

function DateCard({ itinerary, index }: DateCardProps) {
  const navigate = useNavigate();
  const isPast = itinerary.status === "past";

  const handleView = () => {
    navigate(`/dates/${itinerary.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex gap-4">
            {/* Image */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={itinerary.restaurant.photoUrl}
                alt={itinerary.restaurant.name}
                className={cn(
                  "w-full h-full object-cover",
                  isPast && "grayscale opacity-70"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 py-3 pr-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {itinerary.date}
                  </p>
                  <h3 className="font-semibold text-foreground">
                    {itinerary.headline}
                  </h3>
                </div>
                {itinerary.feedback && (
                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      itinerary.feedback.rating === "great" &&
                        "bg-green-100 text-green-700",
                      itinerary.feedback.rating === "meh" &&
                        "bg-yellow-100 text-yellow-700",
                      itinerary.feedback.rating === "disaster" &&
                        "bg-red-100 text-red-700"
                    )}
                  >
                    {itinerary.feedback.rating === "great" && "🎉 Great!"}
                    {itinerary.feedback.rating === "meh" && "😐 Meh"}
                    {itinerary.feedback.rating === "disaster" && "😬 Disaster"}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {itinerary.restaurant.name}
                {itinerary.activities.length > 0 &&
                  ` + ${itinerary.activities.length} more`}
              </p>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="-ml-2" onClick={handleView}>
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                {isPast && !itinerary.feedback && (
                  <Button variant="soft" size="sm">
                    <Star className="w-4 h-4" />
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
