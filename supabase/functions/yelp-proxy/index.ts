import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use YELP_CLIENT_SECRET directly as the Bearer token
const YELP_API_TOKEN = Deno.env.get('YELP_CLIENT_SECRET');
const YELP_BASE_URL = 'https://api.yelp.com/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, method = 'GET', body } = await req.json();

    if (!YELP_API_TOKEN) {
      throw new Error('YELP_CLIENT_SECRET is not configured');
    }

    console.log(`Yelp API request: ${method} ${endpoint}`, body);

    const response = await fetch(`${YELP_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${YELP_API_TOKEN}`,
        'content-type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    console.log('Yelp API response:', JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      console.error('Yelp API error:', data);
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Yelp proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
