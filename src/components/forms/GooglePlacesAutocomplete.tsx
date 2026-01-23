import { useState, useRef, useCallback, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// --- Interfaces for Places API (New) ---

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
  description?: string;
  cuisineType?: string;
  photos?: string[];
}

interface PlacePrediction {
  placeId: string;
  text: {
    text: string;
  };
  structuredFormat: {
    mainText: {
      text: string;
    };
    secondaryText?: {
      text: string;
    };
  };
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceDetails) => void;
  onPhotosFound?: (photoUrls: string[]) => void;
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

  const handleFocus = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = generateSessionToken();
    }
    setIsFocused(true);
    setError(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }
    if (!MAPS_API_KEY) {
      setError("Google Maps API key not configured.");
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/places:autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': MAPS_API_KEY,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: ['restaurant'],
          sessionToken: sessionTokenRef.current,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Places API (New) Autocomplete Error:", data);
        throw new Error(data.error?.message || "Failed to fetch predictions.");
      }
      
      console.log("Places API (New) Autocomplete Response:", data);
      setPredictions(data.suggestions?.map((s: any) => s.placePrediction) || []);

    } catch (err: any) {
      console.error("Places autocomplete error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setQuery(prediction.structuredFormat.mainText.text);
    setPredictions([]);
    setIsFocused(false);
    setIsLoading(true);

    try {
      if (!MAPS_API_KEY) {
        throw new Error("Google Maps API key not configured.");
      }

      const fields = "id,displayName,formattedAddress,location,internationalPhoneNumber,websiteUri,priceLevel,regularOpeningHours,editorialSummary,primaryType,types,photos";
      const params = new URLSearchParams({
        fields: fields,
        sessionToken: sessionTokenRef.current,
      });

      const response = await fetch(`/api/v1/places/${prediction.placeId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': MAPS_API_KEY,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Places API (New) Details Error:", data);
        throw new Error(data.error?.message || "Failed to fetch place details.");
      }
      
      console.log("Places API (New) Details Response:", data);

      // Parse price level from string like "PRICE_LEVEL_MODERATE" to number
      const priceLevelMap: Record<string, number> = {
        'PRICE_LEVEL_FREE': 0,
        'PRICE_LEVEL_INEXPENSIVE': 1,
        'PRICE_LEVEL_MODERATE': 2,
        'PRICE_LEVEL_EXPENSIVE': 3,
        'PRICE_LEVEL_VERY_EXPENSIVE': 4,
      };

      // Map Google primary types to cuisine types
      const cuisineTypeMap: Record<string, string> = {
        'american_restaurant': 'American',
        'chinese_restaurant': 'Chinese',
        'italian_restaurant': 'Italian',
        'indian_restaurant': 'South Asian',
        'japanese_restaurant': 'Japanese',
        'korean_restaurant': 'Korean',
        'mexican_restaurant': 'Mexican',
        'thai_restaurant': 'Thai',
        'vietnamese_restaurant': 'Vietnamese',
        'mediterranean_restaurant': 'Mediterranean',
        'middle_eastern_restaurant': 'Middle Eastern',
        'turkish_restaurant': 'Turkish',
        'seafood_restaurant': 'Seafood',
        'steak_house': 'American',
        'pizza_restaurant': 'Italian',
        'fast_food_restaurant': 'Fast Food',
        'cafe': 'Cafe',
        'bakery': 'Bakery',
        'bar': 'Bar & Grill',
        'brunch_restaurant': 'Brunch',
        'breakfast_restaurant': 'Breakfast',
        'hamburger_restaurant': 'American',
        'sandwich_shop': 'Deli',
        'ice_cream_shop': 'Dessert',
        'coffee_shop': 'Cafe',
        'restaurant': 'Other',
      };

      // Get cuisine type from primary type or types array
      let cuisineType = 'Other';
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

      // Get up to 5 photo URLs
      const photoUrls: string[] = [];
      if (data.photos && Array.isArray(data.photos)) {
        for (let i = 0; i < Math.min(5, data.photos.length); i++) {
          const photo = data.photos[i];
          if (photo.name) {
            // Photos API URL format: https://places.googleapis.com/v1/{name}/media?maxHeightPx=800&key=API_KEY
            const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${MAPS_API_KEY}`;
            photoUrls.push(photoUrl);
          }
        }
      }

      onPlaceSelect({
        placeId: data.id,
        name: typeof data.displayName === 'object' ? data.displayName.text : data.displayName,
        address: data.formattedAddress,
        lat: data.location.latitude,
        lng: data.location.longitude,
        phone: data.internationalPhoneNumber,
        website: data.websiteUri,
        priceLevel: data.priceLevel ? priceLevelMap[data.priceLevel] || 2 : undefined,
        openingHours: data.regularOpeningHours?.weekdayDescriptions,
        description: data.editorialSummary?.text || undefined,
        cuisineType,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
      });

      // Reset session token for the next "session"
      sessionTokenRef.current = "";

    } catch (err: any) {
      console.error("Place details error:", err);
      setError(err.message);
       // Fallback with basic info
       onPlaceSelect({
        placeId: prediction.placeId,
        name: prediction.structuredFormat.mainText.text,
        address: prediction.structuredFormat.secondaryText?.text || prediction.text.text,
        lat: 0,
        lng: 0,
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
      
      {isFocused && (predictions.length > 0 || error) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-auto">
          {error ? (
            <div className="p-3 text-sm text-destructive">{error}</div>
          ) : (
            predictions.map((p) => (
              <button
                key={p.placeId}
                type="button"
                onClick={() => handleSelectPlace(p)}
                className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-sm">
                    {p.structuredFormat.mainText.text}
                  </div>
                  {p.structuredFormat.secondaryText && (
                    <div className="text-xs text-muted-foreground">
                      {p.structuredFormat.secondaryText.text}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};