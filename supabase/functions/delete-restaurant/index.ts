import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { deleteStorageFolder } from "../utils/deleteStorageFolder.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("authHeader:", authHeader);

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header is missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    console.log("userData:", userData);
    console.log("userError:", userError);

    if (userError) throw userError;
    if (userData.user?.user_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { restaurant_id } = await req.json();

    if (!restaurant_id) {
      return new Response(JSON.stringify({ error: "restaurant_id is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("restaurant_id", restaurant_id);

    // Use a transaction to ensure all or nothing is deleted
    const { error: transactionError } = await supabaseAdmin.rpc('delete_restaurant_with_associations', {
      p_restaurant_id: restaurant_id
    });

    if (transactionError) {
      throw transactionError;
    }
    
    // Delete images from storage after the transaction is successful
    await deleteStorageFolder(supabaseAdmin, "restaurant-images", `${restaurant_id}`);
    
    if (reviewsError) {
      console.warn("Could not fetch reviews for image deletion after restaurant deletion:", reviewsError.message);
    }

    if (reviews && reviews.length > 0) {
      for (const review of reviews) {
        await deleteStorageFolder(supabaseAdmin, "review-images", `${review.id}`);
      }
    }

    return new Response(JSON.stringify({ message: "Restaurant and all associated data deleted successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

