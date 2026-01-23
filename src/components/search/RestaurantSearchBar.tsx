import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Utensils, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onRestaurantSelect?: (restaurantId: string) => void;
  className?: string;
}

interface RestaurantSuggestion {
  id: string;
  name: string;
  cuisine_type: string;
  address: string;
  halal_status: 'Full Halal' | 'Partial Halal';
}

export const RestaurantSearchBar = ({ 
  placeholder = "Search restaurants...", 
  onSearch, 
  onRestaurantSelect,
  className,
}: RestaurantSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch restaurant suggestions from database
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, cuisine_type, address, halal_status')
        .or(`name.ilike.%${searchQuery}%,cuisine_type.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
        .limit(6);
      
      if (!error && data) {
        setSuggestions(data as RestaurantSuggestion[]);
      }
    } catch (error) {
      console.error('Error fetching restaurant suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch?.(value);
    
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

  const handleSuggestionSelect = (suggestion: RestaurantSuggestion) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    onRestaurantSelect?.(suggestion.id);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    setSuggestions([]);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div 
        className={cn(
          "search-bar relative flex items-center gap-1 sm:gap-2 bg-card rounded-xl sm:rounded-2xl border overflow-hidden px-2 sm:px-4 py-2 sm:py-2.5",
          isFocused && "ring-2 ring-primary/20"
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/70 min-w-0 text-sm sm:text-base"
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
              onSearch?.("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}
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
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <Utensils className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm line-clamp-1">
                      {suggestion.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs shrink-0",
                        suggestion.halal_status === 'Full Halal' 
                          ? "bg-halal-full/20 text-halal-full" 
                          : "bg-halal-partial/20 text-halal-partial"
                      )}
                    >
                      {suggestion.halal_status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {suggestion.cuisine_type} • {suggestion.address}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
