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
  priceLevel?: string; // e.g., "PRICE_LEVEL_MODERATE"
  openingHours?: string[];
  placeId: string;
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

      const fields = "id,displayName,formattedAddress,location,internationalPhoneNumber,websiteUri,priceLevel,regularOpeningHours";
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

      onPlaceSelect({
        placeId: data.id,
        name: data.displayName,
        address: data.formattedAddress,
        lat: data.location.latitude,
        lng: data.location.longitude,
        phone: data.internationalPhoneNumber,
        website: data.websiteUri,
        priceLevel: data.priceLevel,
        openingHours: data.regularOpeningHours?.weekdayDescriptions,
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