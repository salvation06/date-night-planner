import { motion } from "framer-motion";
import { Bot, Search, Calendar, Sparkles } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

const steps = [
  { icon: Bot, text: "Understanding your preferences" },
  { icon: Search, text: "Searching for perfect spots" },
  { icon: Calendar, text: "Checking availability" },
  { icon: Sparkles, text: "Curating top picks" },
];

export default function LoadingState() {
  const { currentSession } = useAppStore();

  return (
    <div className="min-h-screen gradient-warm flex flex-col items-center justify-center px-6">
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl gradient-hero shadow-glow flex items-center justify-center">
          <Bot className="w-12 h-12 text-primary-foreground" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 rounded-[2rem] border-2 border-dashed border-rose/30"
        />
      </motion.div>

      {/* Message */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl font-semibold text-center mb-2"
      >
        Finding places that will impress...
      </motion.h2>
      
      {currentSession?.userPrompt && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-center mb-8 max-w-sm"
        >
          "{currentSession.userPrompt}"
        </motion.p>
      )}

      {/* Progress Steps */}
      <div className="space-y-3 w-full max-w-sm">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card shadow-soft"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ delay: 0.5 + i * 0.3, duration: 0.5 }}
                className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center"
              >
                <Icon className="w-4 h-4 text-rose" />
              </motion.div>
              <span className="text-sm font-medium">{step.text}</span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5 + i * 0.3, duration: 0.8 }}
                className="ml-auto h-1 bg-rose/20 rounded-full overflow-hidden max-w-[60px]"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ delay: 0.5 + i * 0.3, duration: 0.8 }}
                  className="h-full w-full bg-rose"
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
