-- Create table for storing date memory NFTs
CREATE TABLE public.date_memory_nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  collection_id INTEGER,
  item_id INTEGER,
  ipfs_cid TEXT NOT NULL,
  transaction_hash TEXT,
  subscan_url TEXT,
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.date_memory_nfts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own NFTs"
  ON public.date_memory_nfts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own NFTs"
  ON public.date_memory_nfts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own NFTs"
  ON public.date_memory_nfts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_date_memory_nfts_updated_at
  BEFORE UPDATE ON public.date_memory_nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();