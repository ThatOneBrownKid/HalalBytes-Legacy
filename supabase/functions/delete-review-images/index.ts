
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { record } = await req.json();
    const reviewId = record.id;

    // First, find all image URLs associated with the review
    const { data: reviewImages, error: selectError } = await supabase
      .from("review_images")
      .select("url")
      .eq("review_id", reviewId);

    if (selectError) {
      console.error("Error fetching review images:", selectError);
      throw selectError;
    }

    if (reviewImages && reviewImages.length > 0) {
      const imageUrls = reviewImages.map((img) => img.url);
      const imageFileNames = imageUrls.map(url => url.split('/').pop());


      // Delete images from storage
      const { error: storageError } = await supabase.storage
        .from("restaurant-images")
        .remove(imageFileNames);

      if (storageError) {
        console.error("Error deleting images from storage:", storageError);
        // Dont throw error, we can still delete the image from the table
      }

      // Delete from restaurant_images table
      const { error: deleteRestError } = await supabase
        .from("restaurant_images")
        .delete()
        .in("url", imageUrls);

      if (deleteRestError) {
        console.error("Error deleting from restaurant_images:", deleteRestError);
        // Dont throw error, we can still delete the image from the table
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
