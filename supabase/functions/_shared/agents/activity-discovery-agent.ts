// ActivityDiscoveryAgent - Discovers activities near a restaurant using Yelp AI API ONLY
// NOTE: This agent ONLY uses the Yelp Conversational AI API (v2)
// DO NOT add fallbacks to the Business Search API v3
import { AgentResponse, Activity, DiscoverActivitiesTask } from './types.ts';

const YELP_API_TOKEN = Deno.env.get('YELP_CLIENT_SECRET');

// Activity category descriptions for AI prompts
const ACTIVITY_TYPES = [
  { type: 'bars and cocktail lounges', icon: '🍸', timeWindow: 'after' as const },
  { type: 'comedy clubs and live entertainment', icon: '🎭', timeWindow: 'after' as const },
  { type: 'bookstores and coffee shops', icon: '📚', timeWindow: 'before' as const },
  { type: 'bowling alleys or mini golf', icon: '🎳', timeWindow: 'after' as const },
  { type: 'wine bars and tasting rooms', icon: '🍷', timeWindow: 'before' as const },
];

export class ActivityDiscoveryAgent {
  private agentId = 'activity-discovery-agent';

  async execute(task: DiscoverActivitiesTask): Promise<AgentResponse<Activity[]>> {
    console.log(`[${this.agentId}] Executing discovery task:`, task);

    if (!YELP_API_TOKEN) {
      console.error(`[${this.agentId}] YELP_CLIENT_SECRET is not configured`);
      return { success: false, error: 'YELP_CLIENT_SECRET is not configured' };
    }

    try {
      const radiusMiles = task.radiusMeters ? (task.radiusMeters / 1609.34).toFixed(1) : '0.75';
      
      // Build a comprehensive AI query for activities
      const activityPrompt = `Find date activities within ${radiusMiles} miles of coordinates ${task.latitude}, ${task.longitude}. 
Looking for: bars, cocktail lounges, comedy clubs, bowling, wine bars, or cozy coffee shops. 
Perfect for before or after dinner on a romantic date. Show me the top rated options.`;

      console.log(`[${this.agentId}] AI Activity query:`, activityPrompt);

      // Use 45 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[${this.agentId}] Yelp AI API timeout after 45s`);
        controller.abort();
      }, 45000);

      const response = await fetch('https://api.yelp.com/ai/chat/v2', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${YELP_API_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: activityPrompt,
          request_context: { return_businesses: true }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[${this.agentId}] Yelp AI responded, status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${this.agentId}] Yelp AI error:`, response.status, errorText);
        return { success: true, data: [] }; // Return empty on error
      }

      const data = await response.json();
      console.log(`[${this.agentId}] Yelp AI response keys:`, Object.keys(data));
      
      const businesses = data.entities?.[0]?.businesses || data.businesses || [];
      console.log(`[${this.agentId}] Found ${businesses.length} activities`);

      const activities = businesses.map((biz: any) => this.transformToActivity(biz, task));

      return { success: true, data: activities };

    } catch (error) {
      console.error(`[${this.agentId}] Error:`, error);
      return { 
        success: true,
        data: [], // Return empty array on error to not block the flow
      };
    }
  }

  private transformToActivity(biz: any, task: DiscoverActivitiesTask): Activity {
    // Calculate walking distance from restaurant
    let walkingMinutes = 10; // default
    if (biz.coordinates?.latitude && biz.coordinates?.longitude && task.latitude && task.longitude) {
      const distanceMiles = this.calculateDistance(
        task.latitude, task.longitude,
        biz.coordinates.latitude, biz.coordinates.longitude
      );
      walkingMinutes = Math.round(distanceMiles * 20); // ~3 mph walking
    } else if (biz.distance) {
      walkingMinutes = Math.round((biz.distance / 1609.34) * 20);
    }

    // Determine icon and time window based on category
    const categoryTitle = biz.categories?.[0]?.title?.toLowerCase() || '';
    const { icon, timeWindow } = this.getActivityMeta(categoryTitle);

    return {
      yelp_id: biz.id,
      name: biz.name,
      icon,
      photo_url: biz.image_url,
      rating: biz.rating,
      category: biz.categories?.[0]?.title || 'Activity',
      walking_minutes: walkingMinutes,
      why_this_works: `${biz.rating >= 4 ? 'Highly rated' : 'Popular'} spot with ${biz.review_count || 'many'} reviews - great for ${timeWindow} dinner`,
      address: biz.location?.display_address?.join(', '),
      time_window: timeWindow,
      latitude: biz.coordinates?.latitude,
      longitude: biz.coordinates?.longitude,
    };
  }

  private getActivityMeta(category: string): { icon: string; timeWindow: 'before' | 'after' } {
    if (category.includes('bar') || category.includes('lounge') || category.includes('cocktail')) {
      return { icon: '🍸', timeWindow: 'after' };
    }
    if (category.includes('comedy') || category.includes('theater') || category.includes('theatre')) {
      return { icon: '🎭', timeWindow: 'after' };
    }
    if (category.includes('book') || category.includes('coffee') || category.includes('cafe')) {
      return { icon: '📚', timeWindow: 'before' };
    }
    if (category.includes('bowl') || category.includes('golf') || category.includes('arcade')) {
      return { icon: '🎳', timeWindow: 'after' };
    }
    if (category.includes('wine') || category.includes('tasting')) {
      return { icon: '🍷', timeWindow: 'before' };
    }
    // Default for unknown categories
    return { icon: '🎯', timeWindow: 'after' };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const activityDiscoveryAgent = new ActivityDiscoveryAgent();
