import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void;
  className?: string;
  size?: 'default' | 'large';
  showLocationButton?: boolean;
}

interface LocationSuggestion {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export const LocationSearchBar = ({ 
  placeholder = "Enter your city or zip code...", 
  onSearch, 
  onLocationSelect,
  className,
  size = 'default',
  showLocationButton = true
}: LocationSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch location suggestions from Nominatim
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedSuggestions: LocationSuggestion[] = data.map((item: any) => ({
          name: item.display_name.split(',').slice(0, 3).join(','),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || 'location'
        }));
        setSuggestions(formattedSuggestions);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    onLocationSelect?.({ 
      name: suggestion.name, 
      lat: suggestion.lat, 
      lng: suggestion.lng 
    });
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    setSuggestions([]);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect?.({
            name: "Current Location",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setQuery("Current Location");
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div 
        className={cn(
          "search-bar relative flex items-center gap-1 sm:gap-2 bg-card rounded-xl sm:rounded-2xl border overflow-hidden",
          isFocused && "ring-2 ring-primary/20",
          size === 'large' ? "px-3 sm:px-5 py-3 sm:py-4" : "px-2 sm:px-4 py-2 sm:py-2.5"
        )}
      >
        <Search className={cn(
          "text-muted-foreground shrink-0",
          size === 'large' ? "h-4 w-4 sm:h-5 sm:w-5" : "h-4 w-4"
        )} />
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className={cn(
            "border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/70 min-w-0",
            size === 'large' ? "text-base sm:text-lg" : "text-sm sm:text-base"
          )}
        />

        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}

        {showLocationButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-primary"
            onClick={handleGetLocation}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        )}

        <Button 
          type="submit"
          size="sm"
          className={cn(
            "shrink-0 text-xs sm:text-sm",
            size === 'large' ? "px-3 sm:px-6" : "px-2 sm:px-4"
          )}
        >
          <Search className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border shadow-elevated overflow-hidden z-50"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm line-clamp-1">{suggestion.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
