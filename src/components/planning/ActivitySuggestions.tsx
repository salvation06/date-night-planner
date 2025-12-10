import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, Check, Footprints, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types";

export default function ActivitySuggestions() {
  const { activities, currentSession, toggleActivity, skipActivities, setSessionStage, confirmItinerary } = useAppStore();
  const selectedActivities = currentSession?.selectedActivities || [];
  const beforeActivities = activities.filter((a) => a.timeWindow === "before");
  const afterActivities = activities.filter((a) => a.timeWindow === "after");

  const handleContinue = () => { confirmItinerary(); setSessionStage("summary"); };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => setSessionStage("restaurants")} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-semibold">Activities near {currentSession?.selectedRestaurant?.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">Add something special before or after dinner</p>
        </div>
      </div>

      <section className="px-6 py-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Before Dinner</h2>
        <div className="space-y-3">
          {beforeActivities.map((activity, i) => (
            <ActivityCard key={activity.id} activity={activity} index={i} isSelected={selectedActivities.some((a) => a.id === activity.id)} onToggle={() => toggleActivity(activity)} />
          ))}
        </div>
      </section>

      <section className="px-6 pb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">After Dinner</h2>
        <div className="space-y-3">
          {afterActivities.map((activity, i) => (
            <ActivityCard key={activity.id} activity={activity} index={i} isSelected={selectedActivities.some((a) => a.id === activity.id)} onToggle={() => toggleActivity(activity)} />
          ))}
        </div>
      </section>

      <div className="fixed bottom-20 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => { skipActivities(); confirmItinerary(); }}>Just Dinner</Button>
          <Button variant="romantic" size="lg" className="flex-1" onClick={handleContinue} disabled={selectedActivities.length === 0}>Continue<ArrowRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity, index, isSelected, onToggle }: { activity: Activity; index: number; isSelected: boolean; onToggle: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card variant={isSelected ? "romantic" : "default"} className={cn("overflow-hidden cursor-pointer transition-all duration-200", isSelected && "ring-2 ring-rose")} onClick={onToggle}>
        <CardContent className="p-0">
          <div className="flex gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20"><span className="text-3xl">{activity.icon}</span></div>
            </div>
            <div className="flex-1 py-3 pr-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-foreground">{activity.name}</h3>
                <AnimatePresence>
                  {isSelected && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-6 h-6 rounded-full bg-rose flex items-center justify-center"><Check className="w-4 h-4 text-white" /></motion.div>)}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" /><span>{activity.rating}</span><span>·</span><span>{activity.category}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground"><Footprints className="w-3.5 h-3.5" /><span>{activity.walkingMinutes} min walk</span></div>
            </div>
          </div>
          <AnimatePresence>
            {isSelected && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="px-4 pb-4"><p className="text-sm text-muted-foreground bg-rose/5 p-3 rounded-lg">{activity.whyThisWorks}</p></div></motion.div>)}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
