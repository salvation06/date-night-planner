import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YELP_API_KEY = Deno.env.get('YELP_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const yelpChatRequest = {
      chat_request: {
        chat: {
          user_message: `Find romantic restaurants for a date ${prompt}. Budget: ${userBudget}. Location: ${userLocation}. Looking for dinner options with great ambiance.`,
        },
        search_context: {
          location: userLocation,
          price: priceFilter,
          open_now: false,
        }
      }
    };

    console.log('Yelp AI Chat request:', yelpChatRequest);

    const yelpResponse = await fetch('https://api.yelp.com/v3/ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(yelpChatRequest),
    });

    let restaurants: any[] = [];
    
    if (yelpResponse.ok) {
      const yelpData = await yelpResponse.json();
      console.log('Yelp AI response:', JSON.stringify(yelpData).substring(0, 1000));
      
      if (yelpData.response?.businesses) {
        restaurants = yelpData.response.businesses.map((biz: any) => ({
          yelp_id: biz.id,
          name: biz.name,
          photo_url: biz.image_url || biz.photos?.[0],
          rating: biz.rating,
          price: biz.price,
          cuisine: biz.categories?.[0]?.title || 'Restaurant',
          tags: biz.categories?.map((c: any) => c.title) || [],
          why_this_works: yelpData.response?.ai_response || `Great for a romantic date with ${biz.rating} stars`,
          available_times: ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
          address: biz.location?.display_address?.join(', ') || biz.location?.address1,
          distance: biz.distance ? `${(biz.distance / 1609.34).toFixed(1)} mi` : null,
          latitude: biz.coordinates?.latitude,
          longitude: biz.coordinates?.longitude,
        }));
      }
    } else {
      console.error('Yelp AI error, falling back to search:', await yelpResponse.text());
      
      const searchParams = new URLSearchParams({
        term: `romantic restaurant ${prompt}`,
        location: userLocation,
        limit: '5',
        sort_by: 'rating',
        categories: 'restaurants',
      });
      
      const searchResponse = await fetch(`https://api.yelp.com/v3/businesses/search?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${YELP_API_KEY}`,
          'Accept': 'application/json',
        },
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        restaurants = searchData.businesses?.map((biz: any) => ({
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
        })) || [];
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
