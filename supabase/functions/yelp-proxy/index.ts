// Yelp AI Proxy - ONLY supports the Yelp Conversational AI API v2
// NOTE: This proxy ONLY uses the Yelp Conversational AI API
// DO NOT add support for the Business Search API v3
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use YELP_CLIENT_SECRET directly as the Bearer token
const YELP_API_TOKEN = Deno.env.get('YELP_CLIENT_SECRET');

serve(async (req) => {
  console.log('[yelp-proxy] Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, chat_id } = await req.json();

    if (!YELP_API_TOKEN) {
      console.error('[yelp-proxy] YELP_CLIENT_SECRET is not configured');
      throw new Error('YELP_CLIENT_SECRET is not configured');
    }

    if (!query) {
      throw new Error('Query is required');
    }

    console.log('[yelp-proxy] Yelp AI Chat request:', { query, chat_id });

    // Build request for Yelp AI Chat API v2
    const yelpRequest: Record<string, any> = {
      query,
      request_context: { return_businesses: true }
    };

    if (chat_id) {
      yelpRequest.chat_id = chat_id;
    }

    // Use 45 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[yelp-proxy] Yelp API timeout after 45s');
      controller.abort();
    }, 45000);

    const response = await fetch('https://api.yelp.com/ai/chat/v2', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${YELP_API_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(yelpRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[yelp-proxy] Yelp AI response status:', response.status);

    const data = await response.json();
    console.log('[yelp-proxy] Yelp AI response keys:', Object.keys(data));

    if (!response.ok) {
      console.error('[yelp-proxy] Yelp AI error:', data);
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[yelp-proxy] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
