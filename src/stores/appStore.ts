import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, Itinerary, PlanningSession, Restaurant, Activity } from "@/types";
import * as api from "@/lib/api";

interface AppState {
  // User profile
  profile: UserProfile | null;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Planning session
  currentSession: PlanningSession | null;
  restaurants: Restaurant[];
  activities: Activity[];
  startPlanning: (prompt: string) => Promise<void>;
  setSessionStage: (stage: PlanningSession["stage"]) => void;
  selectRestaurant: (restaurant: Restaurant, time: string) => Promise<void>;
  toggleActivity: (activity: Activity) => void;
  skipActivities: () => Promise<void>;
  confirmItinerary: () => Promise<void>;
  resetSession: () => void;

  // Itineraries
  itineraries: Itinerary[];
  loadItineraries: () => Promise<void>;
  addFeedback: (itineraryId: string, rating: "great" | "meh" | "disaster", comment?: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      isOnboarded: false,
      isLoading: false,
      error: null,
      currentSession: null,
      restaurants: [],
      activities: [] as Activity[],
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

      loadProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          const { profile } = await api.getProfile();
          if (profile) {
            set({
              profile: {
                id: profile.id || profile.user_id,
                location: profile.location || "",
                budget: profile.budget || "$$",
                dietary: profile.dietary || [],
                vibeTags: profile.vibe_tags || [],
              },
              isOnboarded: !!profile.location,
            });
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
          set({ error: error instanceof Error ? error.message : "Failed to load profile" });
        } finally {
          set({ isLoading: false });
        }
      },

      saveProfile: async (updates) => {
        try {
          set({ isLoading: true, error: null });
          const currentProfile = get().profile;
          const newProfile = {
            location: updates.location ?? currentProfile?.location ?? "",
            budget: updates.budget ?? currentProfile?.budget ?? "$$",
            dietary: updates.dietary ?? currentProfile?.dietary ?? [],
            vibe_tags: updates.vibeTags ?? currentProfile?.vibeTags ?? [],
          };
          
          await api.updateProfile(newProfile);
          
          set((state) => ({
            profile: state.profile
              ? { ...state.profile, ...updates }
              : {
                  id: crypto.randomUUID(),
                  location: newProfile.location,
                  budget: newProfile.budget,
                  dietary: newProfile.dietary,
                  vibeTags: newProfile.vibe_tags,
                },
          }));
        } catch (error) {
          console.error("Failed to save profile:", error);
          set({ error: error instanceof Error ? error.message : "Failed to save profile" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Planning actions
      startPlanning: async (prompt) => {
        try {
          const profile = get().profile;
          const session: PlanningSession = {
            id: "",
            userPrompt: prompt,
            parsedIntent: {},
            stage: "loading",
            selectedActivities: [],
          };
          set({ currentSession: session, error: null });

          const result = await api.startPlanningSession(prompt, {
            location: profile?.location,
            budget: profile?.budget,
            dietary: profile?.dietary,
            vibeTags: profile?.vibeTags,
          });

          const restaurants: Restaurant[] = (result.restaurants || []).map((r: any) => ({
            id: r.id || r.yelp_id,
            yelpId: r.yelp_id,
            name: r.name,
            photoUrl: r.photo_url || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
            rating: r.rating || 4.5,
            price: r.price || "$$",
            cuisine: r.cuisine || "Restaurant",
            tags: r.tags || [],
            whyThisWorks: r.why_this_works || "Great choice for your date!",
            availableTimes: r.available_times || ["6:00 PM", "7:00 PM", "8:00 PM"],
            address: r.address || "",
            distance: r.distance || "",
            latitude: r.latitude,
            longitude: r.longitude,
          }));

          set({
            currentSession: {
              id: result.session_id,
              userPrompt: prompt,
              parsedIntent: result.parsed_intent || {},
              stage: "restaurants",
              selectedActivities: [],
            },
            restaurants,
          });
        } catch (error) {
          console.error("Failed to start planning:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to start planning",
            currentSession: null 
          });
        }
      },

      setSessionStage: (stage) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, stage }
            : null,
        })),

      selectRestaurant: async (restaurant, time) => {
        try {
          const session = get().currentSession;
          if (!session?.id) return;

          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  selectedRestaurant: restaurant,
                  selectedTime: time,
                  stage: "loading" as const,
                }
              : null,
          }));

          // Pass full restaurant object for geolocation-based activity search
          const result = await api.selectRestaurant(session.id, {
            id: restaurant.id,
            yelp_id: restaurant.yelpId,
            name: restaurant.name,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            cuisine: restaurant.cuisine,
            price: restaurant.price,
          }, time);

          const activities: Activity[] = (result.activities || []).map((a: any) => ({
            id: a.id || a.yelp_id,
            yelpId: a.yelp_id,
            name: a.name,
            icon: a.icon || "📍",
            photoUrl: a.photo_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
            rating: a.rating || 4.5,
            category: a.category || "Activity",
            walkingMinutes: a.walking_minutes || 10,
            whyThisWorks: a.why_this_works || "A great addition to your date!",
            address: a.address || "",
            timeWindow: a.time_window || "after",
          }));

          set((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, stage: "activities" }
              : null,
            activities,
          }));
        } catch (error) {
          console.error("Failed to select restaurant:", error);
          set({ error: error instanceof Error ? error.message : "Failed to select restaurant" });
        }
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

      skipActivities: async () => {
        const session = get().currentSession;
        if (!session?.id) {
          set((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, selectedActivities: [], stage: "summary" }
              : null,
          }));
          return;
        }

        try {
          await api.selectActivity(session.id, [], true);
          set((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, selectedActivities: [], stage: "summary" }
              : null,
          }));
        } catch (error) {
          console.error("Failed to skip activities:", error);
        }
      },

      confirmItinerary: async () => {
        const state = get();
        if (!state.currentSession?.selectedRestaurant) return;

        try {
          const session = state.currentSession;
          
          // If we have a backend session, confirm via API
          if (session.id) {
            // First select activities with full data including time_window
            const activitiesData = session.selectedActivities.map((a) => ({
              id: a.id,
              yelp_id: a.yelpId,
              name: a.name,
              icon: a.icon,
              category: a.category,
              time_window: a.timeWindow,
              walking_minutes: a.walkingMinutes,
              rating: a.rating,
              address: a.address,
            }));
            if (activitiesData.length > 0) {
              await api.selectActivity(session.id, activitiesData, false);
            }
            
            const result = await api.confirmItinerary(session.id);
            
            if (result.itinerary) {
              const itinerary: Itinerary = {
                id: result.itinerary.id,
                date: result.itinerary.date_label,
                headline: result.itinerary.headline,
                restaurant: session.selectedRestaurant,
                activities: session.selectedActivities,
                timelineBlocks: result.itinerary.timeline_blocks || [],
                costEstimate: result.itinerary.cost_estimate || "$100-150",
                status: "upcoming",
              };
              
              set((state) => ({
                itineraries: [itinerary, ...state.itineraries],
                currentSession: { ...state.currentSession!, stage: "summary" },
              }));
            }
          } else {
            // Fallback for local-only session
            const restaurant = session.selectedRestaurant;
            const activities = session.selectedActivities;
            const time = session.selectedTime || "7:00 PM";

            const timelineBlocks: any[] = [];

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

            timelineBlocks.push({
              time,
              icon: "🍽️",
              title: restaurant.name,
              subtitle: `${restaurant.cuisine} · ${restaurant.price}`,
              extra: restaurant.address,
              hasLocation: true,
            });

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
          }
        } catch (error) {
          console.error("Failed to confirm itinerary:", error);
          set({ error: error instanceof Error ? error.message : "Failed to confirm itinerary" });
        }
      },

      resetSession: () => set({ currentSession: null, restaurants: [], activities: [] }),

      loadItineraries: async () => {
        try {
          set({ isLoading: true, error: null });
          const { itineraries } = await api.getItineraries();
          
          const mapped: Itinerary[] = (itineraries || []).map((it: any) => ({
            id: it.id,
            date: it.date_label,
            headline: it.headline,
            restaurant: {
              id: it.restaurant?.id || "",
              yelpId: it.restaurant?.yelp_id || "",
              name: it.restaurant?.name || "Restaurant",
              photoUrl: it.restaurant?.photo_url || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
              rating: it.restaurant?.rating || 4.5,
              price: it.restaurant?.price || "$$",
              cuisine: it.restaurant?.cuisine || "Restaurant",
              tags: it.restaurant?.tags || [],
              whyThisWorks: it.restaurant?.why_this_works || "",
              availableTimes: it.restaurant?.available_times || [],
              address: it.restaurant?.address || "",
              distance: it.restaurant?.distance || "",
            },
            activities: (it.activities || []).map((a: any) => ({
              id: a.id || "",
              yelpId: a.yelp_id || "",
              name: a.name || "Activity",
              icon: a.icon || "📍",
              photoUrl: a.photo_url || "",
              rating: a.rating || 4.5,
              category: a.category || "Activity",
              walkingMinutes: a.walking_minutes || 10,
              whyThisWorks: a.why_this_works || "",
              address: a.address || "",
              timeWindow: a.time_window || "after",
            })),
            timelineBlocks: it.timeline_blocks || [],
            costEstimate: it.cost_estimate || "$100-150",
            status: it.status || "upcoming",
            feedback: it.feedback_rating
              ? { rating: it.feedback_rating, comment: it.feedback_comment }
              : undefined,
          }));

          set({ itineraries: mapped });
        } catch (error) {
          console.error("Failed to load itineraries:", error);
          set({ error: error instanceof Error ? error.message : "Failed to load itineraries" });
        } finally {
          set({ isLoading: false });
        }
      },

      addFeedback: async (itineraryId, rating, comment) => {
        try {
          await api.submitFeedback(itineraryId, rating, comment);
          
          set((state) => ({
            itineraries: state.itineraries.map((it) =>
              it.id === itineraryId
                ? { ...it, feedback: { rating, comment }, status: "past" as const }
                : it
            ),
          }));
        } catch (error) {
          console.error("Failed to submit feedback:", error);
          set({ error: error instanceof Error ? error.message : "Failed to submit feedback" });
        }
      },
    }),
    {
      name: "impress-my-date-storage",
      partialize: (state) => ({
        profile: state.profile,
        isOnboarded: state.isOnboarded,
        itineraries: state.itineraries,
      }),
    }
  )
);
