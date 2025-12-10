import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate time offsets
function calculateTimeOffset(baseTime: string, offsetMinutes: number): string {
  const [timePart, period] = baseTime.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  
  let totalMinutes = hours * 60 + (minutes || 0);
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  
  totalMinutes += offsetMinutes;
  
  // Handle day wraparound
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
  
  let newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  const newPeriod = newHours >= 12 ? 'PM' : 'AM';
  if (newHours > 12) newHours -= 12;
  if (newHours === 0) newHours = 12;
  
  return `${newHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
}

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
    
    console.log('Building timeline with activities:', activities);

    // Determine meal type based on time for labels
    const timeHour = parseInt(time.split(':')[0]);
    const isPM = time.includes('PM');
    const hour24 = isPM && timeHour !== 12 ? timeHour + 12 : timeHour;
    
    let mealType = 'Dinner';
    let beforeLabel = 'Before Dinner';
    let afterLabel = 'After Dinner';
    
    if (hour24 < 11) {
      mealType = 'Breakfast';
      beforeLabel = 'Before Breakfast';
      afterLabel = 'After Breakfast';
    } else if (hour24 < 14) {
      mealType = 'Brunch';
      beforeLabel = 'Before Brunch';
      afterLabel = 'After Brunch';
    } else if (hour24 < 17) {
      mealType = 'Lunch';
      beforeLabel = 'Before Lunch';
      afterLabel = 'After Lunch';
    }

    const timelineBlocks = [];
    
    // Add before meal activities
    const beforeActivities = activities.filter((a: any) => a.time_window === 'before');
    if (beforeActivities.length > 0) {
      beforeActivities.forEach((a: any, index: number) => {
        // Calculate staggered times before the meal
        const minutesBefore = (beforeActivities.length - index) * 60 + 30;
        timelineBlocks.push({
          time: calculateTimeOffset(time, -minutesBefore),
          icon: a.icon || '📍',
          title: a.name,
          subtitle: `${a.category} · ${beforeLabel}`,
          hasLocation: true,
          address: a.address,
        });
      });
    }

    // Add the restaurant/meal
    timelineBlocks.push({
      time,
      icon: '🍽️',
      title: restaurant.name,
      subtitle: `${restaurant.cuisine || 'Restaurant'} · ${restaurant.price || '$$'}`,
      extra: restaurant.address,
      hasLocation: true,
    });

    // Add after meal activities  
    const afterActivities = activities.filter((a: any) => a.time_window === 'after');
    if (afterActivities.length > 0) {
      afterActivities.forEach((a: any, index: number) => {
        // Calculate staggered times after the meal (assuming 90 min for dinner)
        const minutesAfter = 90 + (index * 60);
        timelineBlocks.push({
          time: calculateTimeOffset(time, minutesAfter),
          icon: a.icon || '📍',
          title: a.name,
          subtitle: `${a.category} · ${afterLabel}`,
          hasLocation: true,
          address: a.address,
        });
      });
    }
    
    console.log('Built timeline blocks:', timelineBlocks);

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
        headline: `${restaurant.cuisine || 'Date'} Night`,
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
