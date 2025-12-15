import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      itinerary_id, 
      ipfs_cid, 
      collection_id, 
      item_id, 
      transaction_hash, 
      subscan_url,
      wallet_address,
      status 
    } = await req.json();

    if (!itinerary_id || !ipfs_cid) {
      throw new Error('itinerary_id and ipfs_cid are required');
    }

    console.log(`💾 Saving NFT record for itinerary: ${itinerary_id}`);

    // Check if NFT already exists for this itinerary
    const { data: existing } = await supabase
      .from('date_memory_nfts')
      .select('id')
      .eq('itinerary_id', itinerary_id)
      .eq('user_id', user.id)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('date_memory_nfts')
        .update({
          ipfs_cid,
          collection_id,
          item_id,
          transaction_hash,
          subscan_url,
          wallet_address,
          status: status || 'minted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('date_memory_nfts')
        .insert({
          user_id: user.id,
          itinerary_id,
          ipfs_cid,
          collection_id,
          item_id,
          transaction_hash,
          subscan_url,
          wallet_address,
          status: status || 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log(`✅ NFT record saved with ID: ${result.id}`);

    return new Response(
      JSON.stringify({ success: true, nft: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-nft function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});