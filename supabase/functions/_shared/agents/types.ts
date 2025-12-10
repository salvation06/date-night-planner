// Agent2Agent Framework Types

export interface AgentMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  userId?: string;
  sessionId?: string;
  conversationId?: string;
  location?: string;
  preferences?: Record<string, any>;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Yelp Types
export interface Restaurant {
  yelp_id: string;
  name: string;
  photo_url?: string;
  rating?: number;
  price?: string;
  cuisine?: string;
  tags?: string[];
  why_this_works?: string;
  available_times?: string[];
  address?: string;
  distance?: string;
  latitude?: number;
  longitude?: number;
}

export interface Activity {
  yelp_id: string;
  name: string;
  icon?: string;
  photo_url?: string;
  rating?: number;
  category?: string;
  walking_minutes?: number;
  why_this_works?: string;
  address?: string;
  time_window?: 'before' | 'after';
  latitude?: number;
  longitude?: number;
}

export interface TimelineBlock {
  time: string;
  icon: string;
  title: string;
  subtitle?: string;
  extra?: string;
  hasLocation?: boolean;
  address?: string;
}

export interface Itinerary {
  id?: string;
  user_id: string;
  date_label: string;
  headline: string;
  restaurant: Restaurant;
  activities: Activity[];
  timeline_blocks: TimelineBlock[];
  cost_estimate?: string;
  status?: string;
}

// Agent Task Types
export interface SearchRestaurantsTask {
  type: 'search_restaurants';
  prompt: string;
  location: string;
  budget?: string;
  preferences?: Record<string, any>;
}

export interface ChatWithYelpTask {
  type: 'chat_with_yelp';
  message: string;
  conversationId?: string;
  location?: string;
}

export interface DiscoverActivitiesTask {
  type: 'discover_activities';
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface BuildItineraryTask {
  type: 'build_itinerary';
  restaurant: Restaurant;
  activities: Activity[];
  time: string;
  dateLabel?: string;
}

export type AgentTask = 
  | SearchRestaurantsTask 
  | ChatWithYelpTask 
  | DiscoverActivitiesTask 
  | BuildItineraryTask;
