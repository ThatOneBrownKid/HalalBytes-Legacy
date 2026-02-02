import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCustomCategory } from "@/utils/categoryTagger";
import { cuisineTypeMap } from "@/lib/cuisineTypeMap";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const REFRESH_THRESHOLD_DAYS = 30;

interface RestaurantData {
  id: string;
  google_place_id: string | null;
  google_data_fetched_at: string | null;
}

export const useGoogleDataRefresh = (restaurant: RestaurantData | null) => {
  const queryClient = useQueryClient();

  const refreshMutation = useMutation({
    mutationFn: async (placeId: string) => {
      if (!MAPS_API_KEY) throw new Error("Google API key not configured");

      const fields = "regularOpeningHours,generativeSummary,editorialSummary,photos,primaryType,primaryTypeDisplayName,displayName,types";
      
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': MAPS_API_KEY,
          'X-Goog-FieldMask': fields,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to refresh Google data");
      }

      const data = await response.json();
      
      // Parse opening hours
      let openingHours = null;
      if (data.regularOpeningHours?.weekdayDescriptions) {
        const dayMap: Record<string, string> = {
          'Monday': 'mon', 'Tuesday': 'tue', 'Wednesday': 'wed',
          'Thursday': 'thu', 'Friday': 'fri', 'Saturday': 'sat', 'Sunday': 'sun'
        };
        
        openingHours = {};
        data.regularOpeningHours.weekdayDescriptions.forEach((desc: string) => {
          const [day, ...hours] = desc.split(': ');
          const dayKey = dayMap[day];
          if (dayKey) {
            const hoursStr = hours.join(': ');
            if (hoursStr.toLowerCase() === 'closed') {
              openingHours[dayKey] = { isOpen: false };
            } else {
              const times = hoursStr.split(' – ');
              openingHours[dayKey] = {
                isOpen: true,
                openTime: times[0] || undefined,
                closeTime: times[1] || undefined,
              };
            }
          }
        });
      }

      // Get description
      let description = null;
      if (data.generativeSummary?.overview?.text) {
        description = data.generativeSummary.overview.text;
      } else if (data.generativeSummary?.description?.text) {
        description = data.generativeSummary.description.text;
      } else if (data.editorialSummary?.text) {
        description = data.editorialSummary.text;
      }

      // Get cuisine type using the custom tagger first
      let cuisineType = getCustomCategory(data);

      // Fallback to existing logic if no custom category is found
      if (!cuisineType) {
        if (data.primaryType && cuisineTypeMap[data.primaryType]) {
          cuisineType = cuisineTypeMap[data.primaryType];
        } else if (data.types) {
          for (const type of data.types) {
            if (cuisineTypeMap[type]) {
              cuisineType = cuisineTypeMap[type];
              break;
            }
          }
        }
      }
      
      // If still no type, default to 'Other'
      if (!cuisineType) {
        cuisineType = 'Other';
      }

      // Get new photo URLs directly from Google Places API
      const newPhotoUrls = data.photos?.slice(0, 5).map((photo: any) =>
        `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${MAPS_API_KEY}`
      ) || [];

      return { openingHours, description, newPhotoUrls, cuisineType };
    },
    onSuccess: async (data, placeId) => {
      if (!restaurant) return;

      // Update restaurant with refreshed data
      const updateData: any = {
        google_data_fetched_at: new Date().toISOString(),
      };
      
      if (data.openingHours) {
        updateData.opening_hours = data.openingHours;
      }
      if (data.description) {
        updateData.description = data.description;
      }
      if (data.cuisineType) {
        updateData.cuisine_type = data.cuisineType;
      }

      await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id);

      // Delete old Google photos (those starting with "google-")
      if (data.newPhotoUrls.length > 0) {
        // Get existing images
        const { data: existingImages } = await supabase
          .from('restaurant_images')
          .select('id, url')
          .eq('restaurant_id', restaurant.id);

        // Delete old Google-sourced images (URL contains "google-")
        const googleImages = existingImages?.filter(img => 
          img.url.includes('/google-') || img.url.includes('google-refresh-')
        ) || [];

        if (googleImages.length > 0) {
          await supabase
            .from('restaurant_images')
            .delete()
            .in('id', googleImages.map(img => img.id));
        }

        // Insert new photos
        for (const url of data.newPhotoUrls) {
          await supabase.from('restaurant_images').insert({
            restaurant_id: restaurant.id,
            url,
            is_primary: false,
          });
        }
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-images', restaurant.id] });
    },
  });

  useEffect(() => {
    if (!restaurant?.google_place_id) return;

    // Check if we need to refresh
    const lastFetched = restaurant.google_data_fetched_at 
      ? new Date(restaurant.google_data_fetched_at) 
      : null;

    if (!lastFetched) {
      // Never fetched, refresh now
      refreshMutation.mutate(restaurant.google_place_id);
      return;
    }

    const daysSinceFetch = (Date.now() - lastFetched.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceFetch >= REFRESH_THRESHOLD_DAYS) {
      refreshMutation.mutate(restaurant.google_place_id);
    }
  }, [restaurant?.id, restaurant?.google_place_id, restaurant?.google_data_fetched_at]);

  return {
    isRefreshing: refreshMutation.isPending,
    refreshError: refreshMutation.error,
  };
};
