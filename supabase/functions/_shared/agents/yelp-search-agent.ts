// YelpSearchAgent - Handles restaurant discovery via Yelp AI API
import { AgentResponse, Restaurant, SearchRestaurantsTask } from './types.ts';

const YELP_API_TOKEN = Deno.env.get('YELP_CLIENT_SECRET');
const AVAILABLE_TIMES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM'
];

export class YelpSearchAgent {
  private agentId = 'yelp-search-agent';

  async execute(task: SearchRestaurantsTask): Promise<AgentResponse<Restaurant[]>> {
    console.log(`[${this.agentId}] Executing search task:`, task);

    if (!YELP_API_TOKEN) {
      return { success: false, error: 'YELP_CLIENT_SECRET is not configured' };
    }

    try {
      // First try Yelp AI Chat API for intelligent recommendations
      const restaurants = await this.searchViaYelpAI(task);
      
      if (restaurants.length > 0) {
        console.log(`[${this.agentId}] Found ${restaurants.length} restaurants via AI`);
        return { success: true, data: restaurants };
      }

      // Fallback to standard search
      console.log(`[${this.agentId}] Falling back to standard search`);
      const fallbackResults = await this.searchViaStandardAPI(task);
      return { success: true, data: fallbackResults };

    } catch (error) {
      console.error(`[${this.agentId}] Error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async searchViaYelpAI(task: SearchRestaurantsTask): Promise<Restaurant[]> {
    const yelpChatRequest = {
      query: `Find romantic restaurants for a date: ${task.prompt}. Budget: ${task.budget || '$$'}. Location: ${task.location}. Looking for dinner options with great ambiance.`,
      request_context: { return_businesses: true }
    };

    console.log(`[${this.agentId}] Yelp AI request:`, yelpChatRequest);

    const response = await fetch('https://api.yelp.com/ai/chat/v2', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${YELP_API_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(yelpChatRequest),
    });

    if (!response.ok) {
      console.error(`[${this.agentId}] Yelp AI error:`, await response.text());
      return [];
    }

    const data = await response.json();
    const businesses = data.entities?.[0]?.businesses || data.businesses || [];

    return businesses.map((biz: any) => this.transformToRestaurant(biz));
  }

  private async searchViaStandardAPI(task: SearchRestaurantsTask): Promise<Restaurant[]> {
    const priceMap: Record<string, string> = { '$': '1', '$$': '2', '$$$': '3', '$$$$': '4' };
    const sortOptions = ['rating', 'review_count', 'best_match'];
    const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
    const randomOffset = Math.floor(Math.random() * 20);

    const searchParams = new URLSearchParams({
      term: task.prompt || 'romantic restaurant',
      location: task.location,
      limit: '10',
      offset: randomOffset.toString(),
      sort_by: randomSort,
      categories: 'restaurants',
      price: priceMap[task.budget || '$$'] || '2',
    });

    const response = await fetch(`https://api.yelp.com/v3/businesses/search?${searchParams}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${YELP_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`[${this.agentId}] Standard search error:`, await response.text());
      return [];
    }

    const data = await response.json();
    const shuffled = (data.businesses || []).sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, 5).map((biz: any) => this.transformToRestaurant(biz));
  }

  private transformToRestaurant(biz: any): Restaurant {
    const categories = biz.categories?.map((c: any) => c.title).join(', ') || 'restaurant';
    const priceDesc = biz.price === '$' ? 'budget-friendly' : biz.price === '$$' ? 'moderately priced' : biz.price === '$$$' ? 'upscale' : 'fine dining';
    const ratingDesc = biz.rating >= 4.5 ? 'exceptional' : biz.rating >= 4 ? 'highly rated' : 'popular';

    return {
      yelp_id: biz.id,
      name: biz.name,
      photo_url: biz.image_url || biz.photos?.[0],
      rating: biz.rating,
      price: biz.price,
      cuisine: biz.categories?.[0]?.title || 'Restaurant',
      tags: biz.categories?.map((c: any) => c.title) || [],
      why_this_works: `${ratingDesc} ${priceDesc} spot known for ${categories}. ${biz.review_count ? `With ${biz.review_count} reviews, it's` : "It's"} a great choice for your date.`,
      available_times: AVAILABLE_TIMES,
      address: biz.location?.display_address?.join(', ') || biz.location?.address1,
      distance: biz.distance ? `${(biz.distance / 1609.34).toFixed(1)} mi` : undefined,
      latitude: biz.coordinates?.latitude,
      longitude: biz.coordinates?.longitude,
    };
  }
}

export const yelpSearchAgent = new YelpSearchAgent();
