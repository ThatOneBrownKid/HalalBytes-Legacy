import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void;
  className?: string;
  size?: 'default' | 'large';
  showLocationButton?: boolean;
}

// Mock suggestions - in production, this would come from an API
const mockSuggestions = [
  { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Brooklyn, NY", lat: 40.6782, lng: -73.9442 },
];

export const SearchBar = ({ 
  placeholder = "Search for halal food...", 
  onSearch, 
  onLocationSelect,
  className,
  size = 'default',
  showLocationButton = true
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof mockSuggestions>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length > 1) {
      setIsLoading(true);
      // Simulate API delay
      setTimeout(() => {
        setSuggestions(
          mockSuggestions.filter(s => 
            s.name.toLowerCase().includes(value.toLowerCase())
          )
        );
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion: typeof mockSuggestions[0]) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    onLocationSelect?.(suggestion);
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
          "search-bar relative flex items-center gap-2 bg-card rounded-2xl border",
          isFocused && "ring-2 ring-primary/20",
          size === 'large' ? "px-5 py-4" : "px-4 py-2.5"
        )}
      >
        <Search className={cn(
          "text-muted-foreground shrink-0",
          size === 'large' ? "h-5 w-5" : "h-4 w-4"
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
            "border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/70",
            size === 'large' ? "text-lg" : "text-base"
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
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
            onClick={handleGetLocation}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        )}

        <Button 
          type="submit"
          className={cn(
            "shrink-0",
            size === 'large' ? "px-6" : "px-4"
          )}
        >
          Search
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
                <span className="text-foreground">{suggestion.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
