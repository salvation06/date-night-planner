// YelpChatAgent - Handles multi-turn conversations with Yelp AI
import { AgentResponse, Restaurant, ChatWithYelpTask } from './types.ts';

const YELP_API_TOKEN = Deno.env.get('YELP_CLIENT_SECRET');
const AVAILABLE_TIMES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM'
];

export interface ChatResponse {
  aiResponse: string;
  conversationId: string;
  restaurants: Restaurant[];
  rawResponse?: any;
}

export class YelpChatAgent {
  private agentId = 'yelp-chat-agent';

  async execute(task: ChatWithYelpTask): Promise<AgentResponse<ChatResponse>> {
    console.log(`[${this.agentId}] Executing chat task:`, task);

    if (!YELP_API_TOKEN) {
      return { success: false, error: 'YELP_CLIENT_SECRET is not configured' };
    }

    try {
      const yelpChatRequest: Record<string, any> = {
        query: task.message,
        request_context: { return_businesses: true }
      };

      // Include chat_id for multi-turn conversations
      if (task.conversationId) {
        yelpChatRequest.chat_id = task.conversationId;
      }

      console.log(`[${this.agentId}] Yelp AI Chat request:`, JSON.stringify(yelpChatRequest));

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
        const errorText = await response.text();
        console.error(`[${this.agentId}] Yelp AI error:`, errorText);
        return { success: false, error: `Yelp API error: ${errorText}` };
      }

      const data = await response.json();
      console.log(`[${this.agentId}] Yelp AI response:`, JSON.stringify(data).substring(0, 2000));

      const aiResponse = data.message || data.response?.text || '';
      const newChatId = data.chat_id || task.conversationId || '';
      
      // Extract businesses from various possible locations in response
      const businesses = data.entities?.[0]?.businesses || data.businesses || data.response?.businesses || [];
      console.log(`[${this.agentId}] Found ${businesses.length} businesses`);

      const restaurants = businesses.map((biz: any) => this.transformToRestaurant(biz));

      return {
        success: true,
        data: {
          aiResponse,
          conversationId: newChatId,
          restaurants,
          rawResponse: data,
        }
      };

    } catch (error) {
      console.error(`[${this.agentId}] Error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private transformToRestaurant(biz: any): Restaurant {
    return {
      yelp_id: biz.id,
      name: biz.name,
      photo_url: biz.image_url || biz.photos?.[0],
      rating: biz.rating,
      price: biz.price,
      cuisine: biz.categories?.[0]?.title || 'Restaurant',
      tags: biz.categories?.map((c: any) => c.title) || [],
      why_this_works: biz.snippet_text || `Great option with ${biz.rating} stars`,
      available_times: AVAILABLE_TIMES,
      address: biz.location?.display_address?.join(', ') || biz.location?.address1,
      distance: biz.distance ? `${(biz.distance / 1609.34).toFixed(1)} mi` : undefined,
      latitude: biz.coordinates?.latitude,
      longitude: biz.coordinates?.longitude,
    };
  }
}

export const yelpChatAgent = new YelpChatAgent();
