import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  MessageSquare,
  Search,
  Calendar,
  MapPin,
  ChevronDown,
  Utensils,
  Film,
  Wine,
  Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Import images
import heroRestaurant from "@/assets/hero-restaurant.jpg";
import featureMovies from "@/assets/feature-movies.jpg";
import featureNightlife from "@/assets/feature-nightlife.jpg";
import featureActivities from "@/assets/feature-activities.jpg";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const yelpFeatures = [
  {
    icon: Search,
    title: "Natural Language Search",
    description:
      "Just describe your ideal date in plain English. Our AI understands context, preferences, and nuance to find the perfect spots.",
    appFeature: 'Tell us "romantic Italian dinner in Brooklyn under $150" and watch the magic happen.',
    image: heroRestaurant,
  },
  {
    icon: MessageSquare,
    title: "Multi-Turn Conversations",
    description: "Refine your search through natural back-and-forth dialogue. Change your mind? Just say so.",
    appFeature: 'Ask follow-up questions like "Something more casual?" or "Closer to downtown?"',
    image: featureNightlife,
  },
  {
    icon: MapPin,
    title: "Direct Business Queries",
    description: "Get instant answers about specific venues—hours, dress codes, ambiance, and real reviews.",
    appFeature: "Find hidden gems with insider details from thousands of authentic reviews.",
    image: featureActivities,
  },
  {
    icon: Calendar,
    title: "Conversational Reservations",
    description: "Book tables through natural conversation. Check availability and confirm in seconds.",
    appFeature: "Reserve your perfect dinner spot without leaving the app.",
    image: featureMovies,
  },
];

const dateExperiences = [
  { icon: Utensils, label: "Fine Dining", image: heroRestaurant },
  { icon: Film, label: "Movies", image: featureMovies },
  { icon: Wine, label: "Nightlife", image: featureNightlife },
  { icon: Book, label: "Activities", image: featureActivities },
];

export default function Auth() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const authRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Heart className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Impress My Date!",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={heroRestaurant} alt="Romantic dinner date" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by Yelp AI Conversational API</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Impress My Date
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Plan unforgettable dates with AI that understands romance. Just tell us what you want, and we will curate
              the perfect evening.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="romantic" size="xl" onClick={scrollToAuth} className="text-lg px-8">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="glass"
                size="xl"
                onClick={scrollToAuth}
                className="text-lg px-8 text-white border-white/20"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/60"
            >
              <ChevronDown className="w-8 h-8" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Experience Types */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Every Date, Perfectly Planned
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From intimate dinners to exciting adventures, we help you create moments that matter.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dateExperiences.map((exp, i) => (
              <motion.div
                key={exp.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square"
              >
                <img
                  src={exp.image}
                  alt={exp.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-white">
                    <exp.icon className="w-5 h-5" />
                    <span className="font-semibold">{exp.label}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Yelp AI Features */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Yelp AI Conversational API</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Conversational Intelligence
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Our app harnesses the power of Yelp AI API to bring natural language understanding to date
              planning—enabling real-time, contextually relevant recommendations powered by millions of authentic
              reviews.
            </p>
          </motion.div>

          <div className="space-y-24">
            {yelpFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-16 items-center`}
              >
                {/* Image */}
                <div className="flex-1 w-full">
                  <div className="relative rounded-3xl overflow-hidden shadow-elevated aspect-[4/3]">
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-foreground font-medium">
                      <span className="text-primary">In the app:</span> {feature.appFeature}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Three Steps to the Perfect Date
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe Your Vision",
                desc: "Tell us what kind of date you want in natural language. Be as specific or vague as you like.",
              },
              {
                step: "2",
                title: "Review AI Picks",
                desc: "Get curated restaurant and activity suggestions with personalized explanations for each.",
              },
              {
                step: "3",
                title: "Book & Go",
                desc: "Reserve your spots, get your itinerary, and impress your date with a perfectly planned evening.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section ref={authRef} className="py-20 px-6 gradient-warm">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to plan your next memorable date" : "Start planning unforgettable dates today"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated" className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className="pl-12 h-14 text-base rounded-xl"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      className="pl-12 pr-12 h-14 text-base rounded-xl"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" variant="romantic" size="xl" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Heart className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                size="xl"
                className="w-full"
                onClick={async () => {
                  const { error } = await signInWithGoogle();
                  if (error) {
                    toast({
                      title: "Sign in failed",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Demo Login Section */}
              <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Demo Account</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Use these credentials to test the app:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <span className="text-muted-foreground">Email:</span>
                    <code className="text-foreground font-mono">demo@impressmydate.com</code>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <span className="text-muted-foreground">Password:</span>
                    <code className="text-foreground font-mono">demo123456</code>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    setEmail("demo@impressmydate.com");
                    setPassword("demo123");
                    setIsLogin(true);
                  }}
                >
                  Fill Demo Credentials
                </Button>
              </div>

              <div className="mt-6 text-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isLogin ? "login" : "signup"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground"
                  >
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                      }}
                      className="ml-1 text-primary font-medium hover:underline"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </motion.p>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-foreground/5 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            <span className="font-display text-lg font-semibold">Impress My Date</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Yelp AI Conversational API • Creating memorable moments together
          </p>
        </div>
      </footer>
    </div>
  );
}
