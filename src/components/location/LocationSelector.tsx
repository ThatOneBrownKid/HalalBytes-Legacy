import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGeolocation } from "@/hooks/useGeolocation";
import { geocodeAddress, reverseGeocode } from "@/utils/geocoding"; // Import geocoding functions

interface LocationSelectorProps {
  currentLocation: string;
  onLocationChange: (location: string, coords?: { lat: number; lng: number }) => void;
}

export const LocationSelector = ({ currentLocation, onLocationChange }: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const { latitude, longitude, loading: geolocationLoading, error, requestLocation } = useGeolocation();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleUseMyLocation = () => {
    requestLocation();
  };

  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude).then(locationName => {
        onLocationChange(locationName || "Current Location", { lat: latitude, lng: longitude });
        setOpen(false);
      });
    }
  }, [latitude, longitude, onLocationChange]);

  const handleZipCodeSubmit = async () => {
    if (zipCode.trim()) {
      setIsGeocoding(true);
      const result = await geocodeAddress(zipCode);
      if (result) {
        onLocationChange(result.formattedAddress || zipCode, { lat: result.lat, lng: result.lng });
      } else {
        // Handle case where geocoding fails (e.g., show a toast notification)
        console.error("Could not find location for zip code:", zipCode);
      }
      setIsGeocoding(false);
      setOpen(false);
      setZipCode("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <MapPin className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{currentLocation || "Set location"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Change location</p>
            <p className="text-xs text-muted-foreground">
              Enter a zip code or use your current location
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={handleUseMyLocation}
            disabled={geolocationLoading}
          >
            {geolocationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Use my current location
          </Button>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleZipCodeSubmit()}
              className="flex-1"
            />
            <Button onClick={handleZipCodeSubmit} disabled={!zipCode.trim() || isGeocoding}>
              {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
