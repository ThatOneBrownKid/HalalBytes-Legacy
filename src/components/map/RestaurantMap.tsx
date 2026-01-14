import { useRef, useCallback, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { Icon, divIcon, LatLngBounds } from "leaflet";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId?: string;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
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

// Component to handle location
const LocationButton = ({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) => {
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
        className="shadow-lg bg-card hover:bg-accent"
        onClick={requestLocation}
        disabled={loading}
        title={error || "Use my location"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
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

export const RestaurantMap = ({
  restaurants,
  selectedId,
  onMarkerClick,
  onBoundsChange,
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
}: RestaurantMapProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
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

        <LocationButton onLocationFound={handleLocationFound} />

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
              <div className="min-w-[150px]">
                <p className="font-semibold text-sm text-foreground">{restaurant.name}</p>
                <p className={cn(
                  "text-xs mt-1 inline-block px-2 py-0.5 rounded-full",
                  restaurant.halal_status === 'Full Halal' 
                    ? "bg-halal-full/20 text-halal-full" 
                    : "bg-halal-partial/20 text-halal-partial"
                )}>
                  {restaurant.halal_status}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;
