import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, List } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterBar } from "@/components/filters/FilterBar";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { LocationSelector } from "@/components/location/LocationSelector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Lazy load the map to avoid context issues
const RestaurantMap = lazy(() => import("@/components/map/RestaurantMap").then(m => ({ default: m.RestaurantMap })));

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  price_range: '$' | '$$' | '$$$' | '$$$$';
  cuisine_type: string;
  halal_status: 'Full Halal' | 'Partial Halal';
  is_sponsored: boolean;
  images: string[];
  rating: number;
  review_count: number;
}

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("New York, NY");
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [filters, setFilters] = useState({
    priceRange: [] as string[],
    cuisineTypes: [] as string[],
    halalStatus: [] as string[],
    attributes: [] as string[],
  });
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Fetch restaurants from database
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      // Fetch restaurants with their images
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*');

      if (restaurantsError) throw restaurantsError;

      // Fetch images for all restaurants
      const { data: imagesData, error: imagesError } = await supabase
        .from('restaurant_images')
        .select('restaurant_id, url, is_primary')
        .order('is_primary', { ascending: false });

      if (imagesError) throw imagesError;

      // Fetch review stats for each restaurant
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('restaurant_id, rating');

      if (reviewsError) throw reviewsError;

      // Group images by restaurant
      const imagesByRestaurant = imagesData?.reduce((acc, img) => {
        if (!acc[img.restaurant_id]) {
          acc[img.restaurant_id] = [];
        }
        acc[img.restaurant_id].push(img.url);
        return acc;
      }, {} as Record<string, string[]>) || {};

      // Calculate avg rating and review count per restaurant
      const reviewStatsByRestaurant = reviewsData?.reduce((acc, review) => {
        if (!acc[review.restaurant_id]) {
          acc[review.restaurant_id] = { total: 0, count: 0 };
        }
        acc[review.restaurant_id].total += review.rating;
        acc[review.restaurant_id].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>) || {};

      return restaurantsData?.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        price_range: r.price_range as '$' | '$$' | '$$$' | '$$$$',
        cuisine_type: r.cuisine_type,
        halal_status: r.halal_status as 'Full Halal' | 'Partial Halal',
        is_sponsored: r.is_sponsored,
        images: imagesByRestaurant[r.id] || [],
        rating: reviewStatsByRestaurant[r.id] 
          ? reviewStatsByRestaurant[r.id].total / reviewStatsByRestaurant[r.id].count 
          : 0,
        review_count: reviewStatsByRestaurant[r.id]?.count || 0,
      })) as Restaurant[];
    },
  });

  // Filter restaurants based on active filters
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      if (filters.priceRange.length > 0 && !filters.priceRange.includes(restaurant.price_range)) {
        return false;
      }
      if (filters.cuisineTypes.length > 0 && !filters.cuisineTypes.includes(restaurant.cuisine_type)) {
        return false;
      }
      if (filters.halalStatus.length > 0 && !filters.halalStatus.includes(restaurant.halal_status)) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.cuisine_type.toLowerCase().includes(query) ||
          restaurant.address.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [restaurants, filters, searchQuery]);

  // Sort with sponsored first
  const sortedRestaurants = useMemo(() => {
    return [...filteredRestaurants].sort((a, b) => {
      if (a.is_sponsored && !b.is_sponsored) return -1;
      if (!a.is_sponsored && b.is_sponsored) return 1;
      return b.rating - a.rating;
    });
  }, [filteredRestaurants]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedRestaurantId(id);
    // On mobile, switch to list view when marker is clicked
    if (window.innerWidth < 1024) {
      setMobileView('list');
    }
  }, []);

  const handleCardSelect = useCallback((id: string) => {
    navigate(`/restaurant/${id}`);
  }, [navigate]);

  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
  }, []);

  const handleLocationChange = useCallback((location: string, coords?: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    if (coords) {
      setMapCenter(coords);
    }
  }, []);

  const mapRestaurants = useMemo(() => {
    return sortedRestaurants.map(r => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      halal_status: r.halal_status,
      is_sponsored: r.is_sponsored,
    }));
  }, [sortedRestaurants]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Search & Filters Bar */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 max-w-md">
                <SearchBar
                  placeholder="Search restaurants..."
                  onSearch={(q) => setSearchQuery(q)}
                  showLocationButton={false}
                  className="max-w-md"
                />
              </div>
              <LocationSelector
                currentLocation={currentLocation}
                onLocationChange={handleLocationChange}
              />
            </div>
            <FilterBar filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Mobile View Toggle */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="flex bg-card rounded-full shadow-elevated border p-1"
          >
            <Button
              variant={mobileView === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => setMobileView('list')}
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={mobileView === 'map' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => setMobileView('map')}
            >
              <Map className="h-4 w-4" />
              Map
            </Button>
          </motion.div>
        </div>

        {/* List View */}
        <div 
          className={cn(
            "w-full lg:w-[45%] xl:w-[40%] bg-background border-r",
            mobileView === 'map' && "hidden lg:block"
          )}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{sortedRestaurants.length}</span> restaurants found
            </p>
          </div>

          <div className="h-[calc(100vh-13rem)] overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-4 space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <Virtuoso
                data={sortedRestaurants}
                itemContent={(index, restaurant) => (
                  <div className="p-4">
                    <RestaurantCard
                      restaurant={restaurant}
                      isHighlighted={selectedRestaurantId === restaurant.id}
                      onSelect={handleCardSelect}
                      onFavorite={(id) => console.log("Favorite:", id)}
                    />
                  </div>
                )}
                className="scrollbar-thin"
              />
            )}
          </div>
        </div>

        {/* Map View */}
        <div 
          className={cn(
            "flex-1 h-[calc(100vh-10rem)]",
            mobileView === 'list' && "hidden lg:block"
          )}
        >
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Skeleton className="w-full h-full" /></div>}>
            <RestaurantMap
              restaurants={mapRestaurants}
              selectedId={selectedRestaurantId}
              onMarkerClick={handleMarkerClick}
              onBoundsChange={handleBoundsChange}
              center={mapCenter}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Explore;
