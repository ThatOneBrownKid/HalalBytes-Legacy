import { useState, useRef, useCallback, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Placeholder for Google Maps API Key - replace with your actual key
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

interface PlaceDetails {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  priceLevel?: number;
  openingHours?: string[];
  placeId: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
}

// Generate a unique session token for cost optimization
const generateSessionToken = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const GooglePlacesAutocomplete = ({
  onPlaceSelect,
  placeholder = "Search for a restaurant...",
  className,
}: GooglePlacesAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionTokenRef = useRef<string>("");
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate new session token on focus
  const handleFocus = () => {
    sessionTokenRef.current = generateSessionToken();
    setIsFocused(true);
    setError(null);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch predictions as user types
  const fetchPredictions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    if (!MAPS_API_KEY) {
      setError("Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment.");
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Using Places Autocomplete API
      const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      url.searchParams.append("input", input);
      url.searchParams.append("types", "establishment");
      url.searchParams.append("key", MAPS_API_KEY);
      url.searchParams.append("sessiontoken", sessionTokenRef.current);
      
      // Note: This will need a proxy/edge function in production due to CORS
      // For now, we'll simulate the response structure
      const response = await fetch(`/api/places/autocomplete?${url.searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch predictions");
      }
      
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (err) {
      console.error("Places autocomplete error:", err);
      // For development, show mock predictions when API isn't configured
      if (!MAPS_API_KEY) {
        setError("Configure VITE_GOOGLE_MAPS_API_KEY to enable search");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  // Fetch place details when selected
  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setQuery(prediction.structured_formatting.main_text);
    setPredictions([]);
    setIsFocused(false);
    setIsLoading(true);

    try {
      if (!MAPS_API_KEY) {
        // Return mock data for development
        onPlaceSelect({
          name: prediction.structured_formatting.main_text,
          address: prediction.structured_formatting.secondary_text,
          lat: 40.7128,
          lng: -74.0060,
          placeId: prediction.place_id,
        });
        setIsLoading(false);
        return;
      }

      // Fetch place details using the same session token
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.append("place_id", prediction.place_id);
      url.searchParams.append("fields", "name,formatted_address,geometry,formatted_phone_number,website,price_level,opening_hours");
      url.searchParams.append("key", MAPS_API_KEY);
      url.searchParams.append("sessiontoken", sessionTokenRef.current);

      const response = await fetch(`/api/places/details?${url.searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch place details");
      }
      
      const data = await response.json();
      const result = data.result;

      onPlaceSelect({
        name: result.name,
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        phone: result.formatted_phone_number,
        website: result.website,
        priceLevel: result.price_level,
        openingHours: result.opening_hours?.weekday_text,
        placeId: prediction.place_id,
      });

      // Generate new session token for next search
      sessionTokenRef.current = generateSessionToken();
    } catch (err) {
      console.error("Place details error:", err);
      // Fallback with basic info
      onPlaceSelect({
        name: prediction.structured_formatting.main_text,
        address: prediction.structured_formatting.secondary_text,
        lat: 0,
        lng: 0,
        placeId: prediction.place_id,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {/* Predictions Dropdown */}
      {isFocused && (predictions.length > 0 || error) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-auto">
          {error ? (
            <div className="p-3 text-sm text-muted-foreground">{error}</div>
          ) : (
            predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPlace(prediction)}
                className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-sm">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
