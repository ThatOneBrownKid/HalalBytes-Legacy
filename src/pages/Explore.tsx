import { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Map, List, ChevronUp } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterBar } from "@/components/filters/FilterBar";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockRestaurants = [
  {
    id: "1",
    name: "Halal Guys",
    description: "Famous halal street food",
    address: "123 Main St, New York, NY 10001",
    lat: 40.7580,
    lng: -73.9855,
    price_range: "$$" as const,
    cuisine_type: "Middle Eastern",
    halal_status: "Full Halal" as const,
    is_sponsored: true,
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800",
    ],
    rating: 4.5,
    review_count: 234,
  },
  {
    id: "2",
    name: "Bismillah Kebab House",
    description: "Authentic Turkish cuisine",
    address: "456 Oak Ave, Brooklyn, NY 11201",
    lat: 40.6892,
    lng: -73.9857,
    price_range: "$" as const,
    cuisine_type: "Turkish",
    halal_status: "Full Halal" as const,
    is_sponsored: false,
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    ],
    rating: 4.8,
    review_count: 156,
  },
  {
    id: "3",
    name: "Saffron Indian Kitchen",
    description: "Traditional Indian flavors",
    address: "789 Spice Lane, Queens, NY 11375",
    lat: 40.7282,
    lng: -73.8317,
    price_range: "$$$" as const,
    cuisine_type: "Indian",
    halal_status: "Partial Halal" as const,
    is_sponsored: false,
    images: [
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800",
    ],
    rating: 4.3,
    review_count: 89,
  },
  {
    id: "4",
    name: "Nusret's Grill",
    description: "Premium steaks and grills",
    address: "321 Grill Street, Manhattan, NY 10019",
    lat: 40.7614,
    lng: -73.9776,
    price_range: "$$$$" as const,
    cuisine_type: "American",
    halal_status: "Full Halal" as const,
    is_sponsored: false,
    images: [
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800",
    ],
    rating: 4.7,
    review_count: 412,
  },
  {
    id: "5",
    name: "Karachi Kitchen",
    description: "Authentic Pakistani cuisine",
    address: "555 Curry Road, Jersey City, NJ 07302",
    lat: 40.7178,
    lng: -74.0431,
    price_range: "$$" as const,
    cuisine_type: "Pakistani",
    halal_status: "Full Halal" as const,
    is_sponsored: false,
    images: [
      "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800",
    ],
    rating: 4.6,
    review_count: 178,
  },
];

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>();
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

  // Filter restaurants based on active filters
  const filteredRestaurants = useMemo(() => {
    return mockRestaurants.filter((restaurant) => {
      if (filters.priceRange.length > 0 && !filters.priceRange.includes(restaurant.price_range)) {
        return false;
      }
      if (filters.cuisineTypes.length > 0 && !filters.cuisineTypes.includes(restaurant.cuisine_type)) {
        return false;
      }
      if (filters.halalStatus.length > 0 && !filters.halalStatus.includes(restaurant.halal_status)) {
        return false;
      }
      return true;
    });
  }, [filters]);

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
            <div className="flex-1">
              <SearchBar
                placeholder="Search restaurants..."
                onSearch={(q) => console.log("Search:", q)}
                showLocationButton={false}
                className="max-w-md"
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
          </div>
        </div>

        {/* Map View */}
        <div 
          className={cn(
            "flex-1 h-[calc(100vh-10rem)]",
            mobileView === 'list' && "hidden lg:block"
          )}
        >
          <RestaurantMap
            restaurants={mapRestaurants}
            selectedId={selectedRestaurantId}
            onMarkerClick={handleMarkerClick}
            onBoundsChange={handleBoundsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Explore;
