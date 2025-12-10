import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YELP_CLIENT_ID = Deno.env.get('YELP_CLIENT_ID');
const YELP_CLIENT_SECRET = Deno.env.get('YELP_CLIENT_SECRET');

// Get OAuth2 access token from Yelp using v3 endpoint
async function getYelpAccessToken(): Promise<string> {
  const tokenResponse = await fetch('https://api.yelp.com/oauth2/token/v3', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: YELP_CLIENT_ID!,
      client_secret: YELP_CLIENT_SECRET!,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Yelp OAuth2 v3 token error:', errorText);
    throw new Error(`Failed to get Yelp access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  console.log('Yelp OAuth2 v3 token obtained successfully');
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!YELP_CLIENT_ID || !YELP_CLIENT_SECRET) {
      throw new Error('YELP_CLIENT_ID or YELP_CLIENT_SECRET is not configured');
    }

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

    const { prompt, location, date, time, budget } = await req.json();
    console.log('Plan start request:', { prompt, location, date, time, budget, userId: user.id });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: session, error: sessionError } = await supabase
      .from('planning_sessions')
      .insert({
        user_id: user.id,
        user_prompt: prompt,
        parsed_intent: { location, date, time, budget },
        stage: 'loading',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw sessionError;
    }

    const userLocation = location || profile?.location || 'New York, NY';
    const userBudget = budget || profile?.budget || '$$';
    const priceMap: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
    const priceFilter = priceMap[userBudget] || 2;

    // Get OAuth2 access token using v3 endpoint
    const accessToken = await getYelpAccessToken();

    // Build the correct Yelp AI API v2 request structure
    const yelpChatRequest: {
      query: string;
      chat_id?: string;
      user_context?: { latitude?: number; longitude?: number };
      request_context?: { return_businesses?: boolean };
    } = {
      query: `Find romantic restaurants for a date: ${prompt}. Budget: ${userBudget}. Location: ${userLocation}. Looking for dinner options with great ambiance.`,
      request_context: {
        return_businesses: true,
      }
    };

    console.log('Yelp AI v2 Chat request:', yelpChatRequest);

    const yelpResponse = await fetch('https://api.yelp.com/ai/chat/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(yelpChatRequest),
    });

    let restaurants: any[] = [];
    
    if (yelpResponse.ok) {
      const yelpData = await yelpResponse.json();
      console.log('Yelp AI v2 response:', JSON.stringify(yelpData).substring(0, 2000));
      
      const chatId = yelpData.chat_id;
      console.log('Yelp chat_id for follow-ups:', chatId);
      
      const businesses = yelpData.businesses || yelpData.response?.businesses || [];
      const aiMessage = yelpData.message || yelpData.response?.text || '';
      
      if (businesses.length > 0) {
        restaurants = businesses.map((biz: any) => ({
          yelp_id: biz.id,
          name: biz.name,
          photo_url: biz.image_url || biz.photos?.[0],
          rating: biz.rating,
          price: biz.price,
          cuisine: biz.categories?.[0]?.title || 'Restaurant',
          tags: biz.categories?.map((c: any) => c.title) || [],
          why_this_works: aiMessage || `Great for a romantic date with ${biz.rating} stars`,
          available_times: ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
          address: biz.location?.display_address?.join(', ') || biz.location?.address1,
          distance: biz.distance ? `${(biz.distance / 1609.34).toFixed(1)} mi` : null,
          latitude: biz.coordinates?.latitude,
          longitude: biz.coordinates?.longitude,
        }));
      }
    } else {
      console.error('Yelp AI error, falling back to search:', await yelpResponse.text());
      
      const sortOptions = ['rating', 'review_count', 'best_match'];
      const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
      const randomOffset = Math.floor(Math.random() * 20);
      
      const searchParams = new URLSearchParams({
        term: prompt || 'romantic restaurant',
        location: userLocation,
        limit: '10',
        offset: randomOffset.toString(),
        sort_by: randomSort,
        categories: 'restaurants',
        price: priceFilter.toString(),
      });
      
      console.log('Fallback search params:', { term: prompt, location: userLocation, sort: randomSort, offset: randomOffset });
      
      const searchResponse = await fetch(`https://api.yelp.com/v3/businesses/search?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const shuffled = (searchData.businesses || []).sort(() => Math.random() - 0.5);
        restaurants = shuffled.slice(0, 5).map((biz: any) => ({
          yelp_id: biz.id,
          name: biz.name,
          photo_url: biz.image_url,
          rating: biz.rating,
          price: biz.price,
          cuisine: biz.categories?.[0]?.title || 'Restaurant',
          tags: biz.categories?.map((c: any) => c.title) || [],
          why_this_works: `Highly rated ${biz.categories?.[0]?.title || 'restaurant'} with ${biz.review_count} reviews`,
          available_times: ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
          address: biz.location?.display_address?.join(', '),
          distance: biz.distance ? `${(biz.distance / 1609.34).toFixed(1)} mi` : null,
          latitude: biz.coordinates?.latitude,
          longitude: biz.coordinates?.longitude,
        }));
      } else {
        console.error('Yelp search error:', await searchResponse.text());
      }
    }

    if (restaurants.length > 0) {
      const { error: insertError } = await supabase
        .from('restaurant_options')
        .insert(restaurants.map((r: any) => ({
          ...r,
          session_id: session.id,
        })));
      
      if (insertError) {
        console.error('Restaurant insert error:', insertError);
      }
    }

    await supabase
      .from('planning_sessions')
      .update({ stage: 'restaurants' })
      .eq('id', session.id);

    return new Response(JSON.stringify({
      session_id: session.id,
      restaurants,
      stage: 'restaurants',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Plan start error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
