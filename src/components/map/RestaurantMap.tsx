import { useRef, useCallback, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { Icon, divIcon, LatLngBounds } from "leaflet";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  halal_status: 'Full Halal' | 'Partial Halal';
  is_sponsored: boolean;
  cuisine_type?: string;
  price_range?: string;
  rating?: number;
  review_count?: number;
  image?: string;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId?: string;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onNavigateToRestaurant?: (id: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Custom marker icons
const createMarkerIcon = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? 44 : 36;
  const ringClass = isSelected ? 'ring-4 ring-primary/30' : '';
  
  return divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-[${size}px] h-[${size}px] rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all duration-200 ${ringClass}" style="background-color: ${color}; width: ${size}px; height: ${size}px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const getMarkerColor = (restaurant: Restaurant) => {
  if (restaurant.is_sponsored) return '#d4a853'; // Gold for sponsored
  if (restaurant.halal_status === 'Full Halal') return '#2da05a'; // Green for full halal
  return '#d4a853'; // Gold/amber for partial halal
};

// Component to handle map events
const MapEventHandler = ({ 
  onBoundsChange, 
  selectedId, 
  restaurants 
}: { 
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  selectedId?: string;
  restaurants: Restaurant[];
}) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });

  // Fly to selected restaurant
  useEffect(() => {
    if (selectedId) {
      const restaurant = restaurants.find(r => r.id === selectedId);
      if (restaurant) {
        map.flyTo([restaurant.lat, restaurant.lng], 15, { duration: 1 });
      }
    }
  }, [selectedId, restaurants, map]);

  return null;
};

// Component to handle location - always visible with blue icon
const LocationButton = ({ 
  onLocationFound, 
  hasLocation 
}: { 
  onLocationFound: (lat: number, lng: number) => void;
  hasLocation: boolean;
}) => {
  const map = useMap();
  const { latitude, longitude, loading, error, requestLocation } = useGeolocation();

  useEffect(() => {
    if (latitude && longitude) {
      map.flyTo([latitude, longitude], 14, { duration: 1 });
      onLocationFound(latitude, longitude);
    }
  }, [latitude, longitude, map, onLocationFound]);

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      <Button
        size="icon"
        variant="secondary"
        className={cn(
          "shadow-lg border-2 transition-all h-10 w-10 sm:h-8 sm:w-8",
          hasLocation 
            ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400" 
            : "bg-card hover:bg-accent border-transparent"
        )}
        onClick={requestLocation}
        disabled={loading}
        title={error || "Use my location"}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
        ) : (
          <Navigation className={cn("h-5 w-5 sm:h-4 sm:w-4", hasLocation && "fill-current")} />
        )}
      </Button>
    </div>
  );
};

// User location marker
const userLocationIcon = divIcon({
  className: 'custom-marker',
  html: `
    <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg">
      <div class="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Enhanced popup component for mobile
const RestaurantPopup = ({ 
  restaurant, 
  onNavigate 
}: { 
  restaurant: Restaurant; 
  onNavigate?: (id: string) => void;
}) => {
  return (
    <div className="min-w-[200px] max-w-[280px]">
      {/* Image */}
      {restaurant.image && (
        <div className="w-full h-24 -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-lg">
          <img 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{restaurant.name}</h3>
        
        {/* Rating & cuisine */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {restaurant.rating !== undefined && restaurant.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
              {restaurant.review_count !== undefined && (
                <span className="text-muted-foreground">({restaurant.review_count})</span>
              )}
            </div>
          )}
          {restaurant.cuisine_type && (
            <span className="text-muted-foreground">{restaurant.cuisine_type}</span>
          )}
          {restaurant.price_range && (
            <span className="font-medium">{restaurant.price_range}</span>
          )}
        </div>
        
        {/* Halal badge */}
        <Badge
          variant="secondary"
          className={cn(
            "text-xs",
            restaurant.halal_status === 'Full Halal' 
              ? "bg-halal-full/20 text-halal-full" 
              : "bg-halal-partial/20 text-halal-partial"
          )}
        >
          {restaurant.halal_status}
        </Badge>
        
        {/* View button for mobile */}
        {onNavigate && (
          <Button 
            size="sm" 
            className="w-full mt-2 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(restaurant.id);
            }}
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const RestaurantMap = ({
  restaurants,
  selectedId,
  onMarkerClick,
  onBoundsChange,
  onNavigateToRestaurant,
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
}: RestaurantMapProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ zIndex: 0, minHeight: '300px' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: "100%", height: "100%", minHeight: '300px' }}
        zoomControl={false}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapEventHandler 
          onBoundsChange={onBoundsChange} 
          selectedId={selectedId}
          restaurants={restaurants}
        />

        <LocationButton onLocationFound={handleLocationFound} hasLocation={!!userLocation} />

        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          >
            <Popup>
              <p className="text-sm font-medium">Your location</p>
            </Popup>
          </Marker>
        )}

        {/* Restaurant markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.lat, restaurant.lng]}
            icon={createMarkerIcon(
              getMarkerColor(restaurant),
              selectedId === restaurant.id
            )}
            eventHandlers={{
              click: () => onMarkerClick?.(restaurant.id),
            }}
          >
            <Popup>
              <RestaurantPopup 
                restaurant={restaurant} 
                onNavigate={onNavigateToRestaurant}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;