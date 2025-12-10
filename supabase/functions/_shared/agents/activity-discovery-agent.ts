// ActivityDiscoveryAgent - Discovers activities near a restaurant
import { AgentResponse, Activity, DiscoverActivitiesTask } from './types.ts';

const YELP_API_KEY = Deno.env.get('YELP_API_KEY');

// Activity category configuration
const ACTIVITY_CATEGORIES = [
  { categories: 'bars,cocktailbars', icons: { 'bars': '🍸', 'cocktailbars': '🍹' }, timeWindow: 'after' as const },
  { categories: 'comedy,comedyclubs', icons: { 'comedy': '😂', 'comedyclubs': '🎭' }, timeWindow: 'after' as const },
  { categories: 'bookstores', icons: { 'bookstores': '📚' }, timeWindow: 'before' as const },
  { categories: 'bowling,mini_golf', icons: { 'bowling': '🎳', 'mini_golf': '⛳' }, timeWindow: 'after' as const },
  { categories: 'wineries,winetastingroom', icons: { 'wineries': '🍷', 'winetastingroom': '🍷' }, timeWindow: 'before' as const },
];

export class ActivityDiscoveryAgent {
  private agentId = 'activity-discovery-agent';

  async execute(task: DiscoverActivitiesTask): Promise<AgentResponse<Activity[]>> {
    console.log(`[${this.agentId}] Executing discovery task:`, task);

    if (!YELP_API_KEY) {
      return { success: false, error: 'YELP_API_KEY is not configured' };
    }

    try {
      const activities: Activity[] = [];
      const radiusMeters = task.radiusMeters || 1200;

      // Search each category in parallel for efficiency
      const categoryPromises = ACTIVITY_CATEGORIES.map(config => 
        this.searchCategory(task.latitude, task.longitude, radiusMeters, config)
      );

      const results = await Promise.allSettled(categoryPromises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          activities.push(...result.value);
        }
      }

      console.log(`[${this.agentId}] Found ${activities.length} activities`);
      return { success: true, data: activities };

    } catch (error) {
      console.error(`[${this.agentId}] Error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async searchCategory(
    latitude: number, 
    longitude: number, 
    radiusMeters: number,
    config: typeof ACTIVITY_CATEGORIES[0]
  ): Promise<Activity[]> {
    const searchParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radiusMeters.toString(),
      categories: config.categories,
      limit: '2',
      sort_by: 'rating',
    });

    const response = await fetch(`https://api.yelp.com/v3/businesses/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[${this.agentId}] Category search error for ${config.categories}:`, await response.text());
      return [];
    }

    const data = await response.json();
    
    return (data.businesses || []).map((biz: any) => 
      this.transformToActivity(biz, config)
    );
  }

  private transformToActivity(biz: any, config: typeof ACTIVITY_CATEGORIES[0]): Activity {
    const distanceInMiles = biz.distance ? biz.distance / 1609.34 : 0.5;
    const walkingMinutes = Math.round(distanceInMiles * 20);
    
    // Find matching icon
    const icon = Object.entries(config.icons).find(([key]) => 
      config.categories.includes(key)
    )?.[1] || '🎯';

    return {
      yelp_id: biz.id,
      name: biz.name,
      icon,
      photo_url: biz.image_url,
      rating: biz.rating,
      category: biz.categories?.[0]?.title || 'Activity',
      walking_minutes: walkingMinutes,
      why_this_works: `${biz.rating} stars with ${biz.review_count} reviews - perfect for ${config.timeWindow === 'before' ? 'before' : 'after'} dinner`,
      address: biz.location?.display_address?.join(', '),
      time_window: config.timeWindow,
      latitude: biz.coordinates?.latitude,
      longitude: biz.coordinates?.longitude,
    };
  }
}

export const activityDiscoveryAgent = new ActivityDiscoveryAgent();
