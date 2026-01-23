import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  list_name: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all favorites for the current user
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });

  // Get unique list names
  const listNames = [...new Set(favorites.map((f) => f.list_name))];

  // Check if a restaurant is favorited
  const isFavorited = (restaurantId: string) => {
    return favorites.some((f) => f.restaurant_id === restaurantId);
  };

  // Get the favorite entry for a restaurant
  const getFavorite = (restaurantId: string) => {
    return favorites.find((f) => f.restaurant_id === restaurantId);
  };

  // Add to favorites
  const addFavoriteMutation = useMutation({
    mutationFn: async ({ restaurantId, listName = "Favorites" }: { restaurantId: string; listName?: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          list_name: listName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Added to favorites");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from favorites");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle favorite
  const toggleFavorite = async (restaurantId: string, listName = "Favorites") => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    if (isFavorited(restaurantId)) {
      await removeFavoriteMutation.mutateAsync(restaurantId);
    } else {
      await addFavoriteMutation.mutateAsync({ restaurantId, listName });
    }
  };

  return {
    favorites,
    listNames,
    isLoading,
    isFavorited,
    getFavorite,
    toggleFavorite,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    isPending: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
};
