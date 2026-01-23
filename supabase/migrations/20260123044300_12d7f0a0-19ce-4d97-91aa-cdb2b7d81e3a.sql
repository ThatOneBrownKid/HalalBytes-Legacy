-- Add UPDATE policy for favorites so users can change list names
CREATE POLICY "Users can update their favorites"
ON public.favorites
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);