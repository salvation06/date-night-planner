// YelpSearchAgent - Handles restaurant discovery via Yelp AI API ONLY
// NOTE: This agent ONLY uses the Yelp Conversational AI API (v2)
// DO NOT add fallbacks to the Business Search API v3
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
      console.error(`[${this.agentId}] YELP_CLIENT_SECRET is not configured`);
      return { success: false, error: 'YELP_CLIENT_SECRET is not configured' };
    }

    console.log(`[${this.agentId}] API token found, length: ${YELP_API_TOKEN.length}`);

    try {
      // Use ONLY Yelp AI Chat API for intelligent recommendations
      const restaurants = await this.searchViaYelpAI(task);
      
      if (restaurants.length > 0) {
        console.log(`[${this.agentId}] Found ${restaurants.length} restaurants via AI`);
        return { success: true, data: restaurants };
      }

      // If no results, return empty with helpful message
      console.log(`[${this.agentId}] No restaurants found from Yelp AI API`);
      return { 
        success: true, 
        data: [],
      };

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

    console.log(`[${this.agentId}] Yelp AI request:`, JSON.stringify(yelpChatRequest));

    // Use 45 second timeout for Yelp AI API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[${this.agentId}] Yelp AI API timeout after 45s`);
      controller.abort();
    }, 45000);

    try {
      console.log(`[${this.agentId}] Calling Yelp AI API at https://api.yelp.com/ai/chat/v2`);
      const startTime = Date.now();
      
      const response = await fetch('https://api.yelp.com/ai/chat/v2', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${YELP_API_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(yelpChatRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[${this.agentId}] Yelp AI responded in ${Date.now() - startTime}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${this.agentId}] Yelp AI error ${response.status}:`, errorText);
        return [];
      }

      const data = await response.json();
      console.log(`[${this.agentId}] Yelp AI response keys:`, Object.keys(data));
      
      // Log full response structure for debugging
      if (data.entities) {
        console.log(`[${this.agentId}] entities count:`, data.entities.length);
        if (data.entities[0]) {
          console.log(`[${this.agentId}] entities[0] keys:`, Object.keys(data.entities[0]));
        }
      }
      
      const businesses = data.entities?.[0]?.businesses || data.businesses || [];
      console.log(`[${this.agentId}] Found ${businesses.length} businesses in response`);

      return businesses.map((biz: any) => this.transformToRestaurant(biz));
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      console.error(`[${this.agentId}] Yelp AI fetch error:`, errorMsg);
      return [];
    }
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
