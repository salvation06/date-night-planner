import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use the API key directly for Yelp Conversational AI
const YELP_API_KEY = Deno.env.get('YELP_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!YELP_API_KEY) {
      throw new Error('YELP_API_KEY is not configured');
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

    const { message, conversation_id, session_id, location } = await req.json();
    console.log('Yelp chat request:', { message, conversation_id, session_id, userId: user.id });

    // Get user profile for location context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const userLocation = location || profile?.location || 'New York, NY';

    // Build the Yelp AI API v2 request structure
    const yelpChatRequest: {
      query: string;
      chat_id?: string;
      user_context?: { latitude?: number; longitude?: number };
      request_context?: { return_businesses?: boolean };
    } = {
      query: message,
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
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(yelpChatRequest),
    });

    if (!yelpResponse.ok) {
      const errorText = await yelpResponse.text();
      console.error('Yelp AI v2 error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Yelp API error',
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const yelpData = await yelpResponse.json();
    console.log('Yelp AI v2 response:', JSON.stringify(yelpData).substring(0, 2000));

    // Extract response data from v2 API structure
    const aiResponse = yelpData.message || yelpData.response?.text || '';
    const newChatId = yelpData.chat_id || conversation_id;
    const businesses = yelpData.businesses || yelpData.response?.businesses || [];

    // Map businesses to our restaurant format
    const restaurants = businesses.map((biz: any) => ({
      yelp_id: biz.id,
      name: biz.name,
      photo_url: biz.image_url || biz.photos?.[0],
      rating: biz.rating,
      price: biz.price,
      cuisine: biz.categories?.[0]?.title || 'Restaurant',
      tags: biz.categories?.map((c: any) => c.title) || [],
      why_this_works: biz.snippet_text || `Great option with ${biz.rating} stars`,
      available_times: ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
      address: biz.location?.display_address?.join(', ') || biz.location?.address1,
      distance: biz.distance ? `${(biz.distance / 1609.34).toFixed(1)} mi` : null,
      latitude: biz.coordinates?.latitude,
      longitude: biz.coordinates?.longitude,
      phone: biz.phone,
      url: biz.url,
    }));

    // If we have a session and restaurants, save them
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
      raw_response: yelpData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Yelp chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
