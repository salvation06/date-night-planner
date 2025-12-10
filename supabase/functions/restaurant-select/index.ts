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

    const { session_id, restaurant, time } = await req.json();
    console.log('Restaurant selection:', { session_id, restaurant: restaurant.name, time });

    const { error: updateError } = await supabase
      .from('planning_sessions')
      .update({
        selected_restaurant: restaurant,
        selected_time: time,
        stage: 'activities',
      })
      .eq('id', session_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Session update error:', updateError);
      throw updateError;
    }

    const lat = restaurant.latitude;
    const lng = restaurant.longitude;
    
    let activities: any[] = [];
    
    if (lat && lng) {
      const activityCategories = [
        'bars,cocktailbars',
        'comedy,comedyclubs',
        'bookstores',
        'bowling,mini_golf',
        'wineries,winetastingroom',
      ];
      
      for (const category of activityCategories) {
        const searchParams = new URLSearchParams({
          latitude: lat.toString(),
          longitude: lng.toString(),
          radius: '1200',
          categories: category,
          limit: '2',
          sort_by: 'rating',
        });
        
        const response = await fetch(`https://api.yelp.com/v3/businesses/search?${searchParams}`, {
          headers: {
            'Authorization': `Bearer ${YELP_API_KEY}`,
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const categoryActivities = data.businesses?.map((biz: any) => {
            const isBeforeActivity = ['bookstores', 'wineries', 'winetastingroom'].some(
              c => category.includes(c)
            );
            
            const distanceInMiles = biz.distance ? biz.distance / 1609.34 : 0.5;
            const walkingMinutes = Math.round(distanceInMiles * 20);
            
            const iconMap: Record<string, string> = {
              'bars': '🍸',
              'cocktailbars': '🍹',
              'comedy': '😂',
              'comedyclubs': '🎭',
              'bookstores': '📚',
              'bowling': '🎳',
              'mini_golf': '⛳',
              'wineries': '🍷',
              'winetastingroom': '🍷',
            };
            const icon = Object.entries(iconMap).find(([key]) => category.includes(key))?.[1] || '🎯';
            
            return {
              yelp_id: biz.id,
              name: biz.name,
              icon,
              photo_url: biz.image_url,
              rating: biz.rating,
              category: biz.categories?.[0]?.title || 'Activity',
              walking_minutes: walkingMinutes,
              why_this_works: `${biz.rating} stars with ${biz.review_count} reviews - perfect for ${isBeforeActivity ? 'before' : 'after'} dinner`,
              address: biz.location?.display_address?.join(', '),
              time_window: isBeforeActivity ? 'before' : 'after',
              latitude: biz.coordinates?.latitude,
              longitude: biz.coordinates?.longitude,
            };
          }) || [];
          
          activities.push(...categoryActivities);
        }
      }
    }

    if (activities.length > 0) {
      const { error: insertError } = await supabase
        .from('activity_options')
        .insert(activities.map((a: any) => ({
          ...a,
          session_id,
        })));
      
      if (insertError) {
        console.error('Activity insert error:', insertError);
      }
    }

    return new Response(JSON.stringify({
      session_id,
      activities,
      stage: 'activities',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Restaurant select error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
