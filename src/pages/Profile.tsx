import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const budgetOptions = ["$", "$$", "$$$", "$$$$"] as const;
const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-free", "Kosher", "Halal"];
const vibeOptions = ["Romantic", "Adventurous", "Low-key", "Foodie", "Trendy", "Classic"];

type BudgetType = typeof budgetOptions[number];

export default function Profile() {
  const { profile, setProfile } = useAppStore();
  const [location, setLocation] = useState(profile?.location || "");
  const [budget, setBudget] = useState<BudgetType>(profile?.budget || "$$");
  const [dietary, setDietary] = useState<string[]>(profile?.dietary || []);
  const [vibeTags, setVibeTags] = useState<string[]>(profile?.vibeTags || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed =
      location !== (profile?.location || "") ||
      budget !== (profile?.budget || "$$") ||
      JSON.stringify(dietary) !== JSON.stringify(profile?.dietary || []) ||
      JSON.stringify(vibeTags) !== JSON.stringify(profile?.vibeTags || []);
    setHasChanges(changed);
  }, [location, budget, dietary, vibeTags, profile]);

  const toggleDietary = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const toggleVibe = (item: string) => {
    setVibeTags((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    setProfile({ location, budget, dietary, vibeTags });
    toast.success("Profile updated!");
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center">
            <User className="w-6 h-6 text-rose" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">Your preferences</p>
          </div>
        </motion.div>
      </div>

      {/* Form */}
      <div className="px-6 space-y-6">
        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <label className="block text-sm font-medium mb-3">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Brooklyn, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <label className="block text-sm font-medium mb-3">
                Usual Date Budget
              </label>
              <div className="grid grid-cols-4 gap-2">
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setBudget(option)}
                    className={cn(
                      "h-12 rounded-xl text-lg font-semibold transition-all duration-200",
                      budget === option
                        ? "bg-rose text-white shadow-soft"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dietary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <label className="block text-sm font-medium mb-3">
                Dietary Restrictions
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleDietary(option)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      dietary.includes(option)
                        ? "bg-rose text-white shadow-soft"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    )}
                  >
                    {dietary.includes(option) && <Check className="w-4 h-4" />}
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vibe Tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <label className="block text-sm font-medium mb-3">
                Your Date Style
              </label>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleVibe(option)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      vibeTags.includes(option)
                        ? "bg-rose text-white shadow-soft"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    )}
                  >
                    {vibeTags.includes(option) && <Check className="w-4 h-4" />}
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-20 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t border-border"
        >
          <Button variant="romantic" size="lg" className="w-full" onClick={handleSave}>
            <Save className="w-5 h-5" />
            Save Changes
          </Button>
        </motion.div>
      )}
    </div>
  );
}
