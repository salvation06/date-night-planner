// Agent Orchestrator - Coordinates agent interactions
import { yelpSearchAgent } from './yelp-search-agent.ts';
import { yelpChatAgent, ChatResponse } from './yelp-chat-agent.ts';
import { activityDiscoveryAgent } from './activity-discovery-agent.ts';
import { itineraryBuilderAgent } from './itinerary-builder-agent.ts';
import { dataPersistenceAgent } from './data-persistence-agent.ts';
import { AgentResponse, Restaurant, Activity, Itinerary } from './types.ts';

export class AgentOrchestrator {
  private orchestratorId = 'agent-orchestrator';

  // Plan Start: Search restaurants and create session
  async startPlanningSession(
    userId: string,
    prompt: string,
    location: string,
    budget?: string,
    date?: string,
    time?: string
  ): Promise<AgentResponse<{ sessionId: string; restaurants: Restaurant[]; stage: string }>> {
    console.log(`[${this.orchestratorId}] Starting planning session for user:`, userId);

    // Get user profile for defaults
    const profileResult = await dataPersistenceAgent.getProfile(userId);
    const profile = profileResult.data;
    
    const userLocation = location || profile?.location || 'New York, NY';
    const userBudget = budget || profile?.budget || '$$';

    // Create session
    const sessionResult = await dataPersistenceAgent.createSession(userId, prompt, {
      location: userLocation,
      date,
      time,
      budget: userBudget,
    });

    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: sessionResult.error || 'Failed to create session' };
    }

    const sessionId = sessionResult.data.id;

    // Search for restaurants via YelpSearchAgent
    const searchResult = await yelpSearchAgent.execute({
      type: 'search_restaurants',
      prompt,
      location: userLocation,
      budget: userBudget,
    });

    const restaurants = searchResult.data || [];

    // Save restaurants to database
    if (restaurants.length > 0) {
      await dataPersistenceAgent.saveRestaurants(sessionId, restaurants);
    }

    // Update session stage
    await dataPersistenceAgent.updateSessionStage(sessionId, userId, 'restaurants');

    return {
      success: true,
      data: {
        sessionId,
        restaurants,
        stage: 'restaurants',
      },
    };
  }

  // Restaurant Selection: Save selection and discover activities
  async selectRestaurant(
    userId: string,
    sessionId: string,
    restaurant: Restaurant,
    time: string
  ): Promise<AgentResponse<{ sessionId: string; activities: Activity[]; stage: string }>> {
    console.log(`[${this.orchestratorId}] Restaurant selected:`, restaurant.name);

    // Update session with restaurant selection
    await dataPersistenceAgent.updateSessionStage(sessionId, userId, 'activities', {
      selected_restaurant: restaurant,
      selected_time: time,
    });

    // Discover activities near restaurant via ActivityDiscoveryAgent
    let activities: Activity[] = [];
    
    if (restaurant.latitude && restaurant.longitude) {
      const activitiesResult = await activityDiscoveryAgent.execute({
        type: 'discover_activities',
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        radiusMeters: 1200,
      });

      activities = activitiesResult.data || [];

      // Save activities to database
      if (activities.length > 0) {
        await dataPersistenceAgent.saveActivities(sessionId, activities);
      }
    }

    return {
      success: true,
      data: {
        sessionId,
        activities,
        stage: 'activities',
      },
    };
  }

  // Activity Selection: Save selections
  async selectActivities(
    userId: string,
    sessionId: string,
    activities: Activity[],
    skip: boolean = false
  ): Promise<AgentResponse<{ sessionId: string; activities: Activity[]; stage: string }>> {
    console.log(`[${this.orchestratorId}] Activities selected:`, activities.length);

    // Format activities for storage
    const formattedActivities = skip ? [] : activities.map(a => ({
      id: (a as any).id,
      yelp_id: a.yelp_id,
      name: a.name,
      icon: a.icon,
      category: a.category,
      time_window: a.time_window,
      walking_minutes: a.walking_minutes,
      rating: a.rating,
      address: a.address,
    }));

    // Update session
    await dataPersistenceAgent.updateSessionStage(sessionId, userId, 'summary', {
      selected_activities: formattedActivities,
    });

    return {
      success: true,
      data: {
        sessionId,
        activities: formattedActivities,
        stage: 'summary',
      },
    };
  }

  // Confirm Itinerary: Build and save final itinerary
  async confirmItinerary(
    userId: string,
    sessionId: string,
    dateLabel?: string
  ): Promise<AgentResponse<Itinerary>> {
    console.log(`[${this.orchestratorId}] Confirming itinerary for session:`, sessionId);

    // Get session data
    const sessionResult = await dataPersistenceAgent.getSession(sessionId, userId);
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: 'Session not found' };
    }

    const session = sessionResult.data;
    const restaurant = session.selected_restaurant;
    const activities = session.selected_activities || [];
    const time = session.selected_time || '7:00 PM';

    // Build itinerary via ItineraryBuilderAgent
    const buildResult = await itineraryBuilderAgent.execute({
      type: 'build_itinerary',
      restaurant,
      activities,
      time,
      dateLabel,
    }, userId);

    if (!buildResult.success || !buildResult.data) {
      return { success: false, error: buildResult.error || 'Failed to build itinerary' };
    }

    // Save itinerary to database
    const saveResult = await dataPersistenceAgent.createItinerary(buildResult.data);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // Delete the planning session
    await dataPersistenceAgent.deleteSession(sessionId);

    return { success: true, data: saveResult.data };
  }

  // Chat with Yelp: Multi-turn conversations
  async chatWithYelp(
    userId: string,
    message: string,
    conversationId?: string,
    sessionId?: string,
    location?: string
  ): Promise<AgentResponse<ChatResponse>> {
    console.log(`[${this.orchestratorId}] Chat with Yelp:`, message);

    // Get user profile for location
    const profileResult = await dataPersistenceAgent.getProfile(userId);
    const userLocation = location || profileResult.data?.location || 'New York, NY';

    // Execute chat via YelpChatAgent
    const chatResult = await yelpChatAgent.execute({
      type: 'chat_with_yelp',
      message,
      conversationId,
      location: userLocation,
    });

    if (!chatResult.success || !chatResult.data) {
      return { success: false, error: chatResult.error };
    }

    // Save restaurants if session provided
    if (sessionId && chatResult.data.restaurants.length > 0) {
      await dataPersistenceAgent.saveRestaurants(sessionId, chatResult.data.restaurants);
    }

    return chatResult;
  }

  // Get user itineraries
  async getItineraries(userId: string): Promise<AgentResponse<{ itineraries: any[]; upcoming: any[]; past: any[] }>> {
    return dataPersistenceAgent.getItineraries(userId);
  }

  // Submit feedback
  async submitFeedback(
    userId: string,
    itineraryId: string,
    rating: string,
    comment?: string
  ): Promise<AgentResponse<any>> {
    return dataPersistenceAgent.updateItinerary(itineraryId, userId, {
      feedback_rating: rating,
      feedback_comment: comment,
      status: 'past',
    });
  }
}

export const agentOrchestrator = new AgentOrchestrator();
