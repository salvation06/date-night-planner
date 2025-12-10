import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

const budgetOptions = ["$", "$$", "$$$", "$$$$"];
const dietaryOptions = ["None", "Vegetarian", "Vegan", "Gluten-free", "Kosher", "Halal"];
const vibeOptions = ["Romantic", "Adventurous", "Low-key", "Foodie", "Trendy", "Classic"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setProfile, completeOnboarding } = useAppStore();
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<string>("$$");
  const [dietary, setDietary] = useState<string[]>([]);
  const [vibeTags, setVibeTags] = useState<string[]>([]);

  const handleComplete = () => {
    setProfile({ location, budget: budget as any, dietary, vibeTags });
    completeOnboarding();
    navigate("/plan");
  };

  const toggleDietary = (item: string) => {
    if (item === "None") {
      setDietary([]);
    } else {
      setDietary((prev) =>
        prev.includes(item) ? prev.filter((d) => d !== item) : [...prev.filter(d => d !== "None"), item]
      );
    }
  };

  const toggleVibe = (item: string) => {
    setVibeTags((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  };

  const steps = [
    {
      title: "Where are you located?",
      subtitle: "We'll find amazing spots near you",
      content: (
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Brooklyn, NY"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-12 h-14 text-lg rounded-xl"
          />
        </div>
      ),
      isValid: location.length > 0,
    },
    {
      title: "What's your usual date budget?",
      subtitle: "Per person, including drinks",
      content: (
        <div className="grid grid-cols-4 gap-3">
          {budgetOptions.map((option) => (
            <button
              key={option}
              onClick={() => setBudget(option)}
              className={cn(
                "h-16 rounded-xl text-xl font-semibold transition-all duration-200",
                budget === option
                  ? "bg-rose text-primary-foreground shadow-card"
                  : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ),
      isValid: true,
    },
    {
      title: "Any dietary restrictions?",
      subtitle: "We'll filter accordingly",
      content: (
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((option) => (
            <button
              key={option}
              onClick={() => toggleDietary(option)}
              className={cn(
                "px-4 py-3 rounded-full text-sm font-medium transition-all duration-200",
                dietary.includes(option) || (option === "None" && dietary.length === 0)
                  ? "bg-rose text-primary-foreground shadow-soft"
                  : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ),
      isValid: true,
    },
    {
      title: "What's your date style?",
      subtitle: "Pick all that apply",
      content: (
        <div className="flex flex-wrap gap-2">
          {vibeOptions.map((option) => (
            <button
              key={option}
              onClick={() => toggleVibe(option)}
              className={cn(
                "px-4 py-3 rounded-full text-sm font-medium transition-all duration-200",
                vibeTags.includes(option)
                  ? "bg-rose text-primary-foreground shadow-soft"
                  : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ),
      isValid: true,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose/10 text-rose mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI-Powered Planning</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-4xl font-bold text-foreground mb-2"
        >
          Impress My Date
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground"
        >
          Let's personalize your experience
        </motion.p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-8">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-rose" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="elevated" className="p-6">
              <h2 className="font-display text-2xl font-semibold mb-2">
                {currentStep.title}
              </h2>
              <p className="text-muted-foreground mb-6">{currentStep.subtitle}</p>
              {currentStep.content}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        <Button
          variant="romantic"
          size="xl"
          className="w-full"
          onClick={() => {
            if (isLastStep) {
              handleComplete();
            } else {
              setStep((s) => s + 1);
            }
          }}
          disabled={!currentStep.isValid}
        >
          {isLastStep ? "Start Planning" : "Continue"}
          <ArrowRight className="w-5 h-5" />
        </Button>
        {step > 0 && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
