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
  console.log('[yelp-chat] Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (!YELP_API_TOKEN) {
      console.error('[yelp-chat] YELP_CLIENT_SECRET is not configured');
      throw new Error('YELP_CLIENT_SECRET is not configured');
    }

    // Auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[yelp-chat] No auth header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[yelp-chat] Auth failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[yelp-chat] Auth took:', Date.now() - startTime, 'ms');

    // Extract request data
    const { message, session_id, location } = await req.json();
    console.log('[yelp-chat] Request:', { message, session_id, location });

    // Get user profile for location context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const userLocation = location || profile?.location || 'New York, NY';

    // Build a unique query with timestamp to ensure fresh results
    const timestamp = Date.now();
    const randomizer = Math.random().toString(36).substring(7);
    const searchQuery = `Find new and different restaurants for: ${message}. Location: ${userLocation}. Give me unique options I haven't seen. (ref: ${randomizer})`;
    
    console.log('[yelp-chat] Search query:', searchQuery);
    
    // Build the Yelp AI API v2 request - always start fresh conversation for varied results
    const yelpChatRequest: Record<string, any> = {
      query: searchQuery,
      request_context: {
        return_businesses: true,
      }
    };
    
    // Don't include chat_id - we want fresh results each time

    console.log('[yelp-chat] Calling Yelp AI...');
    const yelpStartTime = Date.now();

    // Use a shorter timeout (20 seconds) for the Yelp API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[yelp-chat] Yelp API timeout triggered');
      controller.abort();
    }, 20000);

    let yelpResponse;
    try {
      yelpResponse = await fetch('https://api.yelp.com/ai/chat/v2', {
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
      console.log('[yelp-chat] Yelp API responded in:', Date.now() - yelpStartTime, 'ms, status:', yelpResponse.status);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.error('[yelp-chat] Yelp API fetch error:', errorMsg);
      return new Response(JSON.stringify({ 
        error: 'Yelp API request failed',
        ai_response: `I couldn't reach Yelp right now (${errorMsg}). Please try again.`,
        restaurants: [],
        conversation_id: '',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!yelpResponse.ok) {
      const errorText = await yelpResponse.text();
      console.error('[yelp-chat] Yelp AI error:', yelpResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Yelp API error',
        ai_response: 'Yelp returned an error. Please try a different search.',
        details: errorText,
        restaurants: [],
        conversation_id: '',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const yelpData = await yelpResponse.json();
    console.log('[yelp-chat] Yelp response keys:', Object.keys(yelpData));

    // Extract response data from v2 API structure
    const aiResponse = yelpData.message || yelpData.response?.text || 'Here are some options based on your request:';
    const newChatId = yelpData.chat_id || crypto.randomUUID();
    
    // Extract businesses from various possible locations in the response
    let businesses = yelpData.entities?.[0]?.businesses || yelpData.businesses || yelpData.response?.businesses || [];
    console.log('[yelp-chat] Found', businesses.length, 'businesses');

    // If no businesses found, log the full response for debugging
    if (businesses.length === 0) {
      console.log('[yelp-chat] No businesses found. Full response:', JSON.stringify(yelpData).substring(0, 1000));
    }

    // Map businesses to our restaurant format
    const restaurants = businesses.map(transformToRestaurant);

    // Save to database if session provided and we have restaurants
    if (session_id && restaurants.length > 0) {
      console.log('[yelp-chat] Saving', restaurants.length, 'restaurants to session', session_id);
      
      // Delete old options first to avoid duplicates
      await supabase
        .from('restaurant_options')
        .delete()
        .eq('session_id', session_id);
      
      const { error: insertError } = await supabase
        .from('restaurant_options')
        .insert(restaurants.map((r: any) => ({
          ...r,
          session_id: session_id,
        })));
      
      if (insertError) {
        console.error('[yelp-chat] Restaurant insert error:', insertError);
      }
    }

    console.log('[yelp-chat] Total time:', Date.now() - startTime, 'ms');

    return new Response(JSON.stringify({
      ai_response: aiResponse,
      conversation_id: newChatId,
      restaurants,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[yelp-chat] Error:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      ai_response: 'Something went wrong. Please try again.',
      restaurants: [],
      conversation_id: '',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
