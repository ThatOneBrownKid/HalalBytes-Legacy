import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  name: string;
  onImageClick?: (index: number) => void;
}

export const ImageGallery = ({ images, name, onImageClick }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Check if scroll buttons should be visible
  const checkScrollability = useCallback(() => {
    const container = thumbnailContainerRef.current;
    if (container) {
      setCanScrollUp(container.scrollTop > 0);
      setCanScrollDown(
        container.scrollTop < container.scrollHeight - container.clientHeight - 5
      );
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const container = thumbnailContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      return () => container.removeEventListener("scroll", checkScrollability);
    }
  }, [checkScrollability, images]);

  const scrollThumbnails = (direction: "up" | "down") => {
    const container = thumbnailContainerRef.current;
    if (container) {
      const scrollAmount = 100;
      container.scrollBy({
        top: direction === "up" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="h-[200px] sm:h-[300px] bg-muted rounded-2xl flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
          <p>No images available</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <motion.div
        className="relative cursor-pointer overflow-hidden rounded-2xl h-[200px] sm:h-[400px] group"
        whileHover={{ scale: 1.01 }}
        onClick={() => onImageClick?.(0)}
      >
        <img
          src={images[0]}
          alt={name}
          className="w-full h-full object-cover"
        />
      </motion.div>
    );
  }

  return (
    <div className="flex gap-3 h-[240px] sm:h-[350px] md:h-[400px]">
      {/* Main/Primary Image */}
      <motion.div
        className="flex-1 relative cursor-pointer overflow-hidden rounded-2xl"
        whileHover={{ scale: 1.005 }}
        onClick={() => onImageClick?.(selectedIndex)}
      >
        <img
          src={images[selectedIndex]}
          alt={`${name} - Main`}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Thumbnail Strip with Navigation */}
      <div className="relative flex flex-col w-[70px] sm:w-[90px] md:w-[100px]">
        {/* Scroll Up Button */}
        {canScrollUp && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 h-7 w-7 rounded-full bg-foreground/80 hover:bg-foreground text-background shadow-md"
            onClick={() => scrollThumbnails("up")}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}

        {/* Thumbnails Container - Hide scrollbar */}
        <div
          ref={thumbnailContainerRef}
          className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-none py-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((image, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-lg flex-shrink-0 h-[50px] sm:h-[60px] md:h-[70px] transition-all duration-200",
                selectedIndex === idx 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                  : "opacity-70 hover:opacity-100"
              )}
              onClick={() => setSelectedIndex(idx)}
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={image}
                alt={`${name} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Scroll Down Button */}
        {canScrollDown && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 h-7 w-7 rounded-full bg-foreground/80 hover:bg-foreground text-background shadow-md"
            onClick={() => scrollThumbnails("down")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
