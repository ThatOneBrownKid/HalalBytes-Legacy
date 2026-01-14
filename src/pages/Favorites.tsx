import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Plus, Trash2, FolderHeart, Star, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FavoriteWithRestaurant {
  id: string;
  list_name: string;
  restaurant: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    price_range: "$" | "$$" | "$$$" | "$$$$";
    cuisine_type: string;
    halal_status: "Full Halal" | "Partial Halal";
    is_sponsored: boolean;
  };
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [newListName, setNewListName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          list_name,
          restaurant:restaurants (
            id,
            name,
            description,
            address,
            price_range,
            cuisine_type,
            halal_status,
            is_sponsored
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data as unknown as FavoriteWithRestaurant[];
    },
    enabled: !!user,
  });

  const { data: restaurantImages } = useQuery({
    queryKey: ["restaurant-images-favorites"],
    queryFn: async () => {
      const restaurantIds = favorites?.map((f) => f.restaurant.id) || [];
      if (restaurantIds.length === 0) return {};

      const { data, error } = await supabase
        .from("restaurant_images")
        .select("restaurant_id, url")
        .in("restaurant_id", restaurantIds);

      if (error) throw error;

      return data.reduce((acc, img) => {
        if (!acc[img.restaurant_id]) acc[img.restaurant_id] = [];
        acc[img.restaurant_id].push(img.url);
        return acc;
      }, {} as Record<string, string[]>);
    },
    enabled: !!favorites && favorites.length > 0,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    navigate("/auth/signin");
    return null;
  }

  // Group favorites by list name
  const listNames = [...new Set(favorites?.map((f) => f.list_name) || [])];

  const getRestaurantsInList = (listName: string) => {
    return favorites?.filter((f) => f.list_name === listName) || [];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Favorites & Lists
            </h1>
            <p className="text-muted-foreground mt-1">
              Your saved restaurants organized in lists
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : listNames.length > 0 ? (
          <Tabs defaultValue={listNames[0]} className="space-y-6">
            <TabsList>
              {listNames.map((listName) => (
                <TabsTrigger key={listName} value={listName} className="gap-2">
                  <FolderHeart className="h-4 w-4" />
                  {listName}
                  <Badge variant="secondary" className="ml-1">
                    {getRestaurantsInList(listName).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {listNames.map((listName) => (
              <TabsContent key={listName} value={listName}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getRestaurantsInList(listName).map((fav) => (
                    <div key={fav.id} className="relative">
                      <RestaurantCard
                        restaurant={{
                          ...fav.restaurant,
                          images: restaurantImages?.[fav.restaurant.id] || [],
                          rating: 0,
                          review_count: 0,
                        }}
                        isFavorited={true}
                        onSelect={(id) => navigate(`/restaurant/${id}`)}
                        onFavorite={() => removeFavoriteMutation.mutate(fav.id)}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No favorites yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start exploring and save your favorite restaurants!
                <br />
                Click the heart icon on any restaurant to add it here.
              </p>
              <Button onClick={() => navigate("/explore")} className="gap-2">
                Explore Restaurants
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Favorites;
