import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { session_id, date_label } = await req.json();
    console.log('Itinerary confirm:', { session_id, date_label });

    const { data: session, error: sessionError } = await supabase
      .from('planning_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const restaurant = session.selected_restaurant;
    const activities = session.selected_activities || [];
    const time = session.selected_time || '7:00 PM';

    const timelineBlocks = [];
    
    const beforeActivities = activities.filter((a: any) => a.time_window === 'before');
    beforeActivities.forEach((a: any) => {
      timelineBlocks.push({
        time: '5:30 PM',
        icon: a.icon,
        title: a.name,
        subtitle: a.category,
        hasLocation: true,
        address: a.address,
      });
    });

    timelineBlocks.push({
      time,
      icon: '🍽️',
      title: restaurant.name,
      subtitle: `${restaurant.cuisine} · ${restaurant.price}`,
      extra: restaurant.address,
      hasLocation: true,
    });

    const afterActivities = activities.filter((a: any) => a.time_window === 'after');
    afterActivities.forEach((a: any) => {
      timelineBlocks.push({
        time: '9:30 PM',
        icon: a.icon,
        title: a.name,
        subtitle: a.category,
        hasLocation: true,
        address: a.address,
      });
    });

    const priceMap: Record<string, number> = { '$': 30, '$$': 60, '$$$': 100, '$$$$': 150 };
    const dinnerCost = priceMap[restaurant.price] || 60;
    const activityCost = activities.length * 25;
    const totalMin = (dinnerCost + activityCost) * 0.8;
    const totalMax = (dinnerCost + activityCost) * 1.2;
    const costEstimate = `$${Math.round(totalMin)}-${Math.round(totalMax)}`;

    const { data: itinerary, error: itineraryError } = await supabase
      .from('itineraries')
      .insert({
        user_id: user.id,
        date_label: date_label || new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        headline: `${restaurant.cuisine} Night`,
        restaurant,
        activities,
        timeline_blocks: timelineBlocks,
        cost_estimate: costEstimate,
        status: 'upcoming',
      })
      .select()
      .single();

    if (itineraryError) {
      console.error('Itinerary creation error:', itineraryError);
      throw itineraryError;
    }

    await supabase
      .from('planning_sessions')
      .delete()
      .eq('id', session_id);

    return new Response(JSON.stringify({ itinerary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Itinerary confirm error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
