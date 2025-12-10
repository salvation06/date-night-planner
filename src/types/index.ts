export interface UserProfile {
  id: string;
  location: string;
  budget: "$" | "$$" | "$$$" | "$$$$";
  dietary: string[];
  vibeTags: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  price: string;
  cuisine: string;
  tags: string[];
  whyThisWorks: string;
  availableTimes: string[];
  address: string;
  distance?: string;
}

export interface Activity {
  id: string;
  name: string;
  icon: string;
  photoUrl: string;
  rating: number;
  category: string;
  walkingMinutes: number;
  whyThisWorks: string;
  address: string;
  timeWindow: "before" | "after";
}

export interface TimelineBlock {
  time: string;
  icon: string;
  title: string;
  subtitle: string;
  extra?: string;
  hasLocation: boolean;
}

export interface Itinerary {
  id: string;
  date: string;
  headline: string;
  restaurant: Restaurant;
  activities: Activity[];
  timelineBlocks: TimelineBlock[];
  costEstimate: string;
  shareUrl?: string;
  status: "upcoming" | "past";
  feedback?: {
    rating: "great" | "meh" | "disaster";
    comment?: string;
  };
}

export interface PlanningSession {
  id: string;
  userPrompt: string;
  parsedIntent: {
    date?: string;
    time?: string;
    cuisine?: string;
    vibe?: string;
    budget?: string;
    location?: string;
  };
  stage: "input" | "loading" | "restaurants" | "activities" | "summary";
  selectedRestaurant?: Restaurant;
  selectedTime?: string;
  selectedActivities: Activity[];
}
