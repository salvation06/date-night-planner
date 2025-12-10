import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callEdgeFunction(functionName: string, body?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

async function callEdgeFunctionGet(functionName: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

// Profile API
export async function getProfile() {
  return callEdgeFunctionGet('get-profile');
}

export async function updateProfile(profile: {
  location: string;
  budget: string;
  dietary: string[];
  vibe_tags: string[];
}) {
  return callEdgeFunction('update-profile', profile);
}

// Planning API
export async function startPlanningSession(prompt: string, preferences?: {
  location?: string;
  budget?: string;
  dietary?: string[];
  vibeTags?: string[];
}) {
  return callEdgeFunction('plan-start', { prompt, preferences });
}

export async function selectRestaurant(sessionId: string, restaurant: any, selectedTime: string) {
  return callEdgeFunction('restaurant-select', { session_id: sessionId, restaurant, time: selectedTime });
}

export async function selectActivity(sessionId: string, activityIds: string[]) {
  return callEdgeFunction('activity-select', { session_id: sessionId, activity_ids: activityIds });
}

export async function confirmItinerary(sessionId: string) {
  return callEdgeFunction('itinerary-confirm', { session_id: sessionId });
}

// Yelp AI Chat API - Multi-turn conversations
export async function sendYelpChatMessage(
  message: string,
  conversationId?: string,
  sessionId?: string,
  location?: string
) {
  return callEdgeFunction('yelp-chat', {
    message,
    conversation_id: conversationId,
    session_id: sessionId,
    location,
  });
}

// Itineraries API
export async function getItineraries() {
  return callEdgeFunctionGet('get-itineraries');
}

export async function submitFeedback(itineraryId: string, rating: string, comment?: string) {
  return callEdgeFunction('submit-feedback', { itinerary_id: itineraryId, rating, comment });
}
