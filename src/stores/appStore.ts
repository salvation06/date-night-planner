import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, Itinerary, PlanningSession, Restaurant, Activity } from "@/types";

// Mock restaurants data
const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Lilia",
    photoUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    rating: 4.8,
    price: "$$$",
    cuisine: "Italian",
    tags: ["Romantic", "Pasta", "Wine Bar"],
    whyThisWorks: "Perfect for impressing — Michelin-starred pasta in a stunning converted auto body shop. The housemade mafaldini is legendary.",
    availableTimes: ["6:30 PM", "7:00 PM", "8:30 PM", "9:00 PM"],
    address: "567 Union Ave, Brooklyn",
    distance: "0.8 mi",
  },
  {
    id: "2",
    name: "Le Bernardin",
    photoUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
    rating: 4.9,
    price: "$$$$",
    cuisine: "French Seafood",
    tags: ["Fine Dining", "Seafood", "Romantic"],
    whyThisWorks: "Three Michelin stars of pure elegance. The tasting menu is a love letter to the ocean. Guaranteed to impress.",
    availableTimes: ["5:30 PM", "6:00 PM", "8:00 PM"],
    address: "155 W 51st St, Manhattan",
    distance: "2.1 mi",
  },
  {
    id: "3",
    name: "Rezdôra",
    photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    rating: 4.7,
    price: "$$$",
    cuisine: "Italian",
    tags: ["Cozy", "Pasta", "Intimate"],
    whyThisWorks: "Emilia-Romagna magic in the Flatiron. Hand-rolled tortellini in an intimate space perfect for conversation.",
    availableTimes: ["6:00 PM", "7:30 PM", "8:00 PM", "9:30 PM"],
    address: "27 E 20th St, Manhattan",
    distance: "1.5 mi",
  },
  {
    id: "4",
    name: "Laser Wolf",
    photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    rating: 4.6,
    price: "$$",
    cuisine: "Israeli",
    tags: ["Rooftop", "Lively", "Shared Plates"],
    whyThisWorks: "Rooftop vibes with incredible grilled meats and mezze. Fun, shareable plates that spark conversation.",
    availableTimes: ["5:30 PM", "6:30 PM", "7:00 PM", "8:30 PM"],
    address: "97 Wythe Ave, Brooklyn",
    distance: "1.2 mi",
  },
];

// Mock activities data
const mockActivities: Activity[] = [
  {
    id: "a1",
    name: "Nitehawk Cinema",
    icon: "🎬",
    photoUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    rating: 4.7,
    category: "Movies",
    walkingMinutes: 8,
    whyThisWorks: "Dinner and drinks served during the movie. Perfect for a low-pressure post-dinner activity.",
    address: "136 Metropolitan Ave",
    timeWindow: "after",
  },
  {
    id: "a2",
    name: "Westlight",
    icon: "🍸",
    photoUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800",
    rating: 4.8,
    category: "Rooftop Bar",
    walkingMinutes: 12,
    whyThisWorks: "Panoramic Manhattan views from the 22nd floor. Craft cocktails with a romantic skyline backdrop.",
    address: "111 N 12th St",
    timeWindow: "after",
  },
  {
    id: "a3",
    name: "POWERHOUSE Arena",
    icon: "📚",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    rating: 4.5,
    category: "Bookstore",
    walkingMinutes: 6,
    whyThisWorks: "Browse together before dinner. Indie bookstore with great art books and cozy vibes.",
    address: "28 Adams St",
    timeWindow: "before",
  },
  {
    id: "a4",
    name: "Brooklyn Comedy Collective",
    icon: "😂",
    photoUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800",
    rating: 4.6,
    category: "Comedy Club",
    walkingMinutes: 10,
    whyThisWorks: "Shared laughs build connection. Intimate venue with top local and touring comedians.",
    address: "566 Johnson Ave",
    timeWindow: "after",
  },
  {
    id: "a5",
    name: "Brooklyn Winery",
    icon: "🍷",
    photoUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
    rating: 4.4,
    category: "Wine Tasting",
    walkingMinutes: 5,
    whyThisWorks: "Urban winery with tastings and tours. A sophisticated pre-dinner activity to set the mood.",
    address: "213 N 8th St",
    timeWindow: "before",
  },
];

interface AppState {
  // User profile
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;

  // Planning session
  currentSession: PlanningSession | null;
  startPlanning: (prompt: string) => void;
  setSessionStage: (stage: PlanningSession["stage"]) => void;
  selectRestaurant: (restaurant: Restaurant, time: string) => void;
  toggleActivity: (activity: Activity) => void;
  skipActivities: () => void;
  confirmItinerary: () => void;
  resetSession: () => void;

  // Mock data
  restaurants: Restaurant[];
  activities: Activity[];

  // Itineraries
  itineraries: Itinerary[];
  addFeedback: (itineraryId: string, rating: "great" | "meh" | "disaster", comment?: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      isOnboarded: false,
      currentSession: null,
      restaurants: mockRestaurants,
      activities: mockActivities,
      itineraries: [],

      // Profile actions
      setProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : {
                id: crypto.randomUUID(),
                location: "",
                budget: "$$",
                dietary: [],
                vibeTags: [],
                ...updates,
              },
        })),

      completeOnboarding: () => set({ isOnboarded: true }),

      // Planning actions
      startPlanning: (prompt) => {
        const session: PlanningSession = {
          id: crypto.randomUUID(),
          userPrompt: prompt,
          parsedIntent: {},
          stage: "loading",
          selectedActivities: [],
        };
        set({ currentSession: session });

        // Simulate AI processing
        setTimeout(() => {
          set((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, stage: "restaurants" }
              : null,
          }));
        }, 2000);
      },

      setSessionStage: (stage) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, stage }
            : null,
        })),

      selectRestaurant: (restaurant, time) => {
        set((state) => ({
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                selectedRestaurant: restaurant,
                selectedTime: time,
                stage: "activities",
              }
            : null,
        }));
      },

      toggleActivity: (activity) =>
        set((state) => {
          if (!state.currentSession) return state;
          const current = state.currentSession.selectedActivities;
          const exists = current.find((a) => a.id === activity.id);
          return {
            currentSession: {
              ...state.currentSession,
              selectedActivities: exists
                ? current.filter((a) => a.id !== activity.id)
                : [...current, activity],
            },
          };
        }),

      skipActivities: () =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, selectedActivities: [], stage: "summary" }
            : null,
        })),

      confirmItinerary: () => {
        const state = get();
        if (!state.currentSession?.selectedRestaurant) return;

        const restaurant = state.currentSession.selectedRestaurant;
        const activities = state.currentSession.selectedActivities;
        const time = state.currentSession.selectedTime || "7:00 PM";

        const timelineBlocks: any[] = [];

        // Add before activities
        const beforeActivities = activities.filter((a) => a.timeWindow === "before");
        beforeActivities.forEach((a) => {
          timelineBlocks.push({
            time: "5:30 PM",
            icon: a.icon,
            title: a.name,
            subtitle: a.category,
            hasLocation: true,
          });
        });

        // Add dinner
        timelineBlocks.push({
          time,
          icon: "🍽️",
          title: restaurant.name,
          subtitle: `${restaurant.cuisine} · ${restaurant.price}`,
          extra: restaurant.address,
          hasLocation: true,
        });

        // Add after activities
        const afterActivities = activities.filter((a) => a.timeWindow === "after");
        afterActivities.forEach((a) => {
          timelineBlocks.push({
            time: "9:30 PM",
            icon: a.icon,
            title: a.name,
            subtitle: a.category,
            hasLocation: true,
          });
        });

        const itinerary: Itinerary = {
          id: crypto.randomUUID(),
          date: new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
          headline: `${restaurant.cuisine} Night`,
          restaurant,
          activities,
          timelineBlocks,
          costEstimate: activities.length > 0 ? "$150-200" : "$80-120",
          status: "upcoming",
        };

        set((state) => ({
          itineraries: [itinerary, ...state.itineraries],
          currentSession: { ...state.currentSession!, stage: "summary" },
        }));
      },

      resetSession: () => set({ currentSession: null }),

      addFeedback: (itineraryId, rating, comment) =>
        set((state) => ({
          itineraries: state.itineraries.map((it) =>
            it.id === itineraryId
              ? { ...it, feedback: { rating, comment }, status: "past" as const }
              : it
          ),
        })),
    }),
    {
      name: "impress-my-date-storage",
    }
  )
);
