import { useRef, useCallback, useState, useEffect } from "react";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

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

// Use a placeholder token - users will need to add their own
const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtN3RxdWRyajBtOGYyanB4c3Bsb2R2OGwifQ.dRVZrqrdOzlQ3xn3ZR0YWw";

export const RestaurantMap = ({
  restaurants,
  selectedId,
  onMarkerClick,
  onBoundsChange,
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
}: RestaurantMapProps) => {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom,
  });

  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: center.lat,
      longitude: center.lng,
    }));
  }, [center.lat, center.lng]);

  const handleMoveEnd = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      onBoundsChange?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
  }, [onBoundsChange]);

  const flyToRestaurant = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1000,
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      const restaurant = restaurants.find(r => r.id === selectedId);
      if (restaurant) {
        flyToRestaurant(restaurant.lat, restaurant.lng);
      }
    }
  }, [selectedId, restaurants, flyToRestaurant]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            latitude={restaurant.lat}
            longitude={restaurant.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onMarkerClick?.(restaurant.id);
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              className={cn(
                "cursor-pointer transition-all duration-200",
                selectedId === restaurant.id && "z-50"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white",
                  restaurant.is_sponsored
                    ? "bg-gold"
                    : restaurant.halal_status === 'Full Halal'
                    ? "bg-halal-full"
                    : "bg-halal-partial",
                  selectedId === restaurant.id && "ring-4 ring-primary/30 scale-110"
                )}
              >
                <MapPin className="h-5 w-5 text-white" />
              </div>
              {selectedId === restaurant.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-card rounded-lg shadow-lg px-3 py-1.5 whitespace-nowrap border"
                >
                  <p className="text-sm font-medium">{restaurant.name}</p>
                </motion.div>
              )}
            </motion.div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};
