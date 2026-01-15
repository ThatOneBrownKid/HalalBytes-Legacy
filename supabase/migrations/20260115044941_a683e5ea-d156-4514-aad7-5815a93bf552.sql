-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to restaurant images
CREATE POLICY "Restaurant images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

-- Policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload restaurant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

-- Policy for admins to delete images
CREATE POLICY "Admins can delete restaurant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images' AND public.has_role(auth.uid(), 'admin'));

-- Policy for users to delete their own uploaded images
CREATE POLICY "Users can delete their own uploaded images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);