import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Filters {
  priceRange: string[];
  cuisineTypes: string[];
  halalStatus: string[];
  attributes: string[];
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const priceOptions = ['$', '$$', '$$$', '$$$$'];
const cuisineOptions = ['American', 'Middle Eastern', 'Indian', 'Turkish', 'Pakistani', 'Malaysian', 'Mediterranean', 'Asian Fusion'];
const halalOptions = ['Full Halal', 'Partial Halal'];
const attributeOptions = ['No Pork', 'Hand Slaughtered', 'Alcohol Free', 'Prayer Space Available', 'Zabihah Certified'];

export const FilterBar = ({ filters, onFiltersChange }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const activeFiltersCount = 
    filters.priceRange.length + 
    filters.cuisineTypes.length + 
    filters.halalStatus.length + 
    filters.attributes.length;

  const toggleFilter = (category: keyof Filters, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      priceRange: [],
      cuisineTypes: [],
      halalStatus: [],
      attributes: []
    };
    setTempFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const removeFilter = (category: keyof Filters, value: string) => {
    const newFilters = {
      ...filters,
      [category]: filters[category].filter(v => v !== value)
    };
    onFiltersChange(newFilters);
    setTempFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Button & Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display text-xl">Filters</SheetTitle>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="flex gap-2 flex-wrap">
                  {priceOptions.map((price) => (
                    <Button
                      key={price}
                      variant={tempFilters.priceRange.includes(price) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter('priceRange', price)}
                      className="min-w-[3rem]"
                    >
                      {price}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Halal Status */}
              <div>
                <h3 className="font-medium mb-3">Halal Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {halalOptions.map((status) => (
                    <Button
                      key={status}
                      variant={tempFilters.halalStatus.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter('halalStatus', status)}
                      className={cn(
                        tempFilters.halalStatus.includes(status) && 
                        status === 'Full Halal' && "bg-halal-full hover:bg-halal-full/90",
                        tempFilters.halalStatus.includes(status) && 
                        status === 'Partial Halal' && "bg-halal-partial hover:bg-halal-partial/90 text-halal-partial-foreground"
                      )}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Cuisine Types */}
              <div>
                <h3 className="font-medium mb-3">Cuisine</h3>
                <div className="grid grid-cols-2 gap-2">
                  {cuisineOptions.map((cuisine) => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        id={cuisine}
                        checked={tempFilters.cuisineTypes.includes(cuisine)}
                        onCheckedChange={() => toggleFilter('cuisineTypes', cuisine)}
                      />
                      <Label htmlFor={cuisine} className="text-sm cursor-pointer">
                        {cuisine}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Attributes */}
              <div>
                <h3 className="font-medium mb-3">Attributes</h3>
                <div className="space-y-2">
                  {attributeOptions.map((attr) => (
                    <div key={attr} className="flex items-center space-x-2">
                      <Checkbox
                        id={attr}
                        checked={tempFilters.attributes.includes(attr)}
                        onCheckedChange={() => toggleFilter('attributes', attr)}
                      />
                      <Label htmlFor={attr} className="text-sm cursor-pointer">
                        {attr}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear All
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Quick filter chips for active filters */}
        <AnimatePresence>
          {filters.halalStatus.map((status) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className={cn(
                  "gap-1 cursor-pointer pr-1.5",
                  status === 'Full Halal' && "bg-halal-full/20 text-halal-full border-halal-full/30",
                  status === 'Partial Halal' && "bg-halal-partial/20 text-halal-partial border-halal-partial/30"
                )}
                onClick={() => removeFilter('halalStatus', status)}
              >
                {status}
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          ))}
          {filters.priceRange.map((price) => (
            <motion.div
              key={price}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer pr-1.5"
                onClick={() => removeFilter('priceRange', price)}
              >
                {price}
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          ))}
          {filters.cuisineTypes.map((cuisine) => (
            <motion.div
              key={cuisine}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer pr-1.5"
                onClick={() => removeFilter('cuisineTypes', cuisine)}
              >
                {cuisine}
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
