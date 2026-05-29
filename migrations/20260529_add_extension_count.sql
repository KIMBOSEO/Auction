-- Migration: add extension_count to items for sniper protection
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS extension_count integer DEFAULT 0;

-- Optional: create index for end_at queries
CREATE INDEX IF NOT EXISTS idx_items_end_at ON public.items(end_at);
