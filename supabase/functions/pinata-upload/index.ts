import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const PINATA_JWT = Deno.env.get('PINATA_JWT');
    
    if (!PINATA_JWT) {
      console.error('PINATA_JWT not configured');
      throw new Error('PINATA_JWT not configured');
    }

    const { metadata, name } = await req.json();

    if (!metadata) {
      throw new Error('Metadata is required');
    }

    console.log(`📤 Uploading metadata to Pinata IPFS: ${name || 'unnamed'}`);

    // Upload JSON metadata to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: name || `date-memory-${Date.now()}`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata upload failed:', errorText);
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Uploaded to IPFS with CID: ${result.IpfsHash}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        cid: result.IpfsHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in pinata-upload function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});