// DataPersistenceAgent - Handles all database operations
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AgentResponse, Restaurant, Activity, Itinerary } from './types.ts';

export class DataPersistenceAgent {
  private agentId = 'data-persistence-agent';
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Session operations
  async createSession(userId: string, prompt: string, parsedIntent: Record<string, any>): Promise<AgentResponse<{ id: string }>> {
    console.log(`[${this.agentId}] Creating session for user:`, userId);
    
    const { data, error } = await this.supabase
      .from('planning_sessions')
      .insert({
        user_id: userId,
        user_prompt: prompt,
        parsed_intent: parsedIntent,
        stage: 'loading',
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[${this.agentId}] Session creation error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data: { id: data.id } };
  }

  async updateSessionStage(sessionId: string, userId: string, stage: string, updates?: Record<string, any>): Promise<AgentResponse<void>> {
    console.log(`[${this.agentId}] Updating session stage:`, { sessionId, stage });
    
    const { error } = await this.supabase
      .from('planning_sessions')
      .update({ stage, ...updates })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error(`[${this.agentId}] Session update error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getSession(sessionId: string, userId: string): Promise<AgentResponse<any>> {
    const { data, error } = await this.supabase
      .from('planning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error(`[${this.agentId}] Session fetch error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  async deleteSession(sessionId: string): Promise<AgentResponse<void>> {
    const { error } = await this.supabase
      .from('planning_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error(`[${this.agentId}] Session delete error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Restaurant operations
  async saveRestaurants(sessionId: string, restaurants: Restaurant[]): Promise<AgentResponse<void>> {
    console.log(`[${this.agentId}] Saving ${restaurants.length} restaurants`);
    
    const { error } = await this.supabase
      .from('restaurant_options')
      .insert(restaurants.map(r => ({ ...r, session_id: sessionId })));

    if (error) {
      console.error(`[${this.agentId}] Restaurant save error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Activity operations
  async saveActivities(sessionId: string, activities: Activity[]): Promise<AgentResponse<void>> {
    console.log(`[${this.agentId}] Saving ${activities.length} activities`);
    
    const { error } = await this.supabase
      .from('activity_options')
      .insert(activities.map(a => ({ ...a, session_id: sessionId })));

    if (error) {
      console.error(`[${this.agentId}] Activity save error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Itinerary operations
  async createItinerary(itinerary: Omit<Itinerary, 'id'>): Promise<AgentResponse<Itinerary>> {
    console.log(`[${this.agentId}] Creating itinerary for user:`, itinerary.user_id);
    
    const { data, error } = await this.supabase
      .from('itineraries')
      .insert(itinerary)
      .select()
      .single();

    if (error) {
      console.error(`[${this.agentId}] Itinerary creation error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  async getItineraries(userId: string): Promise<AgentResponse<{ itineraries: any[]; upcoming: any[]; past: any[] }>> {
    console.log(`[${this.agentId}] Fetching itineraries for user:`, userId);
    
    const { data, error } = await this.supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[${this.agentId}] Itinerary fetch error:`, error);
      return { success: false, error: error.message };
    }

    const itineraries = data || [];
    const upcoming = itineraries.filter(it => it.status === 'upcoming');
    const past = itineraries.filter(it => it.status === 'past');

    return { success: true, data: { itineraries, upcoming, past } };
  }

  async updateItinerary(itineraryId: string, userId: string, updates: Record<string, any>): Promise<AgentResponse<any>> {
    console.log(`[${this.agentId}] Updating itinerary:`, itineraryId);
    
    const { data, error } = await this.supabase
      .from('itineraries')
      .update(updates)
      .eq('id', itineraryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[${this.agentId}] Itinerary update error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  // Profile operations
  async getProfile(userId: string): Promise<AgentResponse<any>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore not found
      console.error(`[${this.agentId}] Profile fetch error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }
}

export const dataPersistenceAgent = new DataPersistenceAgent();
