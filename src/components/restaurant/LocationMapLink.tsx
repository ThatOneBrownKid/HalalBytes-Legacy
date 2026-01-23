import { useState } from "react";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface LocationMapLinkProps {
  lat: number;
  lng: number;
  address: string;
  name: string;
}

export const LocationMapLink = ({ lat, lng, address, name }: LocationMapLinkProps) => {
  const isMobile = useIsMobile();
  const [showMapOptions, setShowMapOptions] = useState(false);
  const [imageError, setImageError] = useState(false);

  const encodedAddress = encodeURIComponent(address);
  const encodedName = encodeURIComponent(name);

  const mapLinks = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedAddress}`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodedName}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${encodedName}`,
  };

  // Use multiple static map providers as fallbacks
  const mapImageUrls = [
    // OpenStreetMap static map via MapBox-like service
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`,
  ];

  const handleClick = () => {
    if (isMobile) {
      setShowMapOptions(true);
    } else {
      // On desktop, open Google Maps directly
      window.open(mapLinks.google, "_blank");
    }
  };

  const openMap = (service: "google" | "apple" | "waze") => {
    window.open(mapLinks[service], "_blank");
    setShowMapOptions(false);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="relative w-full h-48 rounded-xl overflow-hidden cursor-pointer group border"
      >
        {/* Use an iframe for OSM embed which works more reliably */}
        {!imageError ? (
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.003}%2C${lng + 0.005}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`}
            className="w-full h-full border-0 pointer-events-none"
            title={`Map location of ${name}`}
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback to a simple visual with coordinates
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            <span className="text-sm text-muted-foreground">View on Map</span>
          </div>
        )}
        
        {/* Overlay with directions button - click through */}
        <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Button className="gap-2 pointer-events-auto">
            <Navigation className="h-4 w-4" />
            Get Directions
          </Button>
        </div>

        {/* Corner badge */}
        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">Directions</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>

      {/* Mobile map service selection dialog */}
      <Dialog open={showMapOptions} onOpenChange={setShowMapOptions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Get Directions</DialogTitle>
            <DialogDescription>
              Choose your preferred map app
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => openMap("google")}
            >
              <div className="w-8 h-8 rounded-full bg-[#4285f4] flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Google Maps</div>
                <div className="text-xs text-muted-foreground">Navigate with Google</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => openMap("apple")}
            >
              <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-sm">🍎</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Apple Maps</div>
                <div className="text-xs text-muted-foreground">Navigate with Apple</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => openMap("waze")}
            >
              <div className="w-8 h-8 rounded-full bg-[#33ccff] flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Waze</div>
                <div className="text-xs text-muted-foreground">Navigate with Waze</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
