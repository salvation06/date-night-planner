// Yelp Chat - Multi-turn conversation with Yelp AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YELP_API_TOKEN = Deno.env.get('YELP_CLIENT_SECRET');
const AVAILABLE_TIMES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM'
];

function transformToRestaurant(biz: any) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!YELP_API_TOKEN) {
      console.error('YELP_CLIENT_SECRET is not configured');
      throw new Error('YELP_CLIENT_SECRET is not configured');
    }

    // Auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract request data
    const { message, conversation_id, session_id, location } = await req.json();
    console.log('Yelp chat request:', { message, conversation_id, session_id, userId: user.id, location });

    // Get user profile for location context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const userLocation = location || profile?.location || 'New York, NY';

    // Build the Yelp AI API v2 request
    const yelpChatRequest: Record<string, any> = {
      query: `${message}. Location: ${userLocation}`,
      request_context: {
        return_businesses: true,
      }
    };

    // Include chat_id for multi-turn conversations
    if (conversation_id) {
      yelpChatRequest.chat_id = conversation_id;
    }

    console.log('Yelp AI v2 Chat request:', JSON.stringify(yelpChatRequest));

    const yelpResponse = await fetch('https://api.yelp.com/ai/chat/v2', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${YELP_API_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(yelpChatRequest),
    });

    if (!yelpResponse.ok) {
      const errorText = await yelpResponse.text();
      console.error('Yelp AI v2 error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Yelp API error',
        details: errorText,
        restaurants: [] // Return empty array so UI doesn't break
      }), {
        status: 200, // Return 200 so client doesn't fail
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const yelpData = await yelpResponse.json();
    console.log('Yelp AI v2 response:', JSON.stringify(yelpData).substring(0, 2000));

    // Extract response data from v2 API structure
    const aiResponse = yelpData.message || yelpData.response?.text || '';
    const newChatId = yelpData.chat_id || conversation_id || '';
    
    // Extract businesses from various possible locations
    const businesses = yelpData.entities?.[0]?.businesses || yelpData.businesses || yelpData.response?.businesses || [];
    console.log('Found businesses:', businesses.length);

    // Map businesses to our restaurant format
    const restaurants = businesses.map(transformToRestaurant);

    // Save to database if session provided
    if (session_id && restaurants.length > 0) {
      const { error: insertError } = await supabase
        .from('restaurant_options')
        .insert(restaurants.map((r: any) => ({
          ...r,
          session_id: session_id,
        })));
      
      if (insertError) {
        console.error('Restaurant insert error:', insertError);
      }
    }

    return new Response(JSON.stringify({
      ai_response: aiResponse,
      conversation_id: newChatId,
      restaurants,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Yelp chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      restaurants: [] // Return empty so UI doesn't break
    }), {
      status: 200, // Return 200 so client gets response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
