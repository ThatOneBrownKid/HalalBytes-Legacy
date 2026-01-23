-- Add google_data_fetched_at column to track when Google data was last refreshed
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS google_data_fetched_at TIMESTAMP WITH TIME ZONE;

-- Add google_place_id to enable refreshing data from Google
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS google_place_id TEXT;