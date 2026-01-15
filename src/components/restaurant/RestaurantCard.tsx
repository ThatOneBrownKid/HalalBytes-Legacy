import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  price_range: '$' | '$$' | '$$$' | '$$$$';
  cuisine_type: string;
  halal_status: 'Full Halal' | 'Partial Halal';
  is_sponsored: boolean;
  images: string[];
  rating: number;
  review_count: number;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  isHighlighted?: boolean;
  onSelect?: (id: string) => void;
  onFavorite?: (id: string) => void;
  isFavorited?: boolean;
}

export const RestaurantCard = ({ 
  restaurant, 
  isHighlighted, 
  onSelect, 
  onFavorite,
  isFavorited = false 
}: RestaurantCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovered && restaurant.images && restaurant.images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % restaurant.images.length);
      }, 1500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, restaurant.images]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isHighlighted ? 1.02 : 1,
      }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-xl overflow-hidden bg-card border transition-all duration-300 cursor-pointer",
        isHighlighted && "ring-2 ring-primary shadow-glow animate-pulse",
        restaurant.is_sponsored && "ring-1 ring-gold/50"
      )}
      onClick={() => onSelect?.(restaurant.id)}
    >
      {/* Sponsored Badge */}
      {restaurant.is_sponsored && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="badge-sponsored text-xs font-medium">
            Promoted
          </Badge>
        </div>
      )}

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm transition-all",
          isFavorited && "text-destructive"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onFavorite?.(restaurant.id);
        }}
      >
        <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
      </Button>

      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {restaurant.images && restaurant.images.length > 0 ? (
          <>
            <motion.img
              key={currentImageIndex}
              src={restaurant.images[currentImageIndex]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Image Dots Indicator */}
            {restaurant.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {restaurant.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      idx === currentImageIndex 
                        ? "bg-white w-4" 
                        : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Top Row: Name & Rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-medium text-sm">{restaurant.rating?.toFixed(1) || '—'}</span>
            <span className="text-muted-foreground text-xs">({restaurant.review_count || 0})</span>
          </div>
        </div>

        {/* Cuisine & Price */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{restaurant.cuisine_type}</span>
          <span>•</span>
          <span className="font-medium text-foreground">{restaurant.price_range}</span>
        </div>

        {/* Address */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{restaurant.address}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              restaurant.halal_status === 'Full Halal' 
                ? "bg-halal-full text-halal-full-foreground" 
                : "bg-halal-partial text-halal-partial-foreground"
            )}
          >
            {restaurant.halal_status}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};
