import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, PenLine } from "lucide-react";
import { ImageUploadZone } from "@/components/forms/ImageUploadZone";
import { GooglePlacesAutocomplete } from "@/components/forms/GooglePlacesAutocomplete";
import { OpeningHoursEditor, getDefaultOpeningHours, parseGoogleHours, type OpeningHoursData } from "@/components/forms/OpeningHoursEditor";
import { geocodeAddress } from "@/utils/geocoding";

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  isUploading?: boolean;
}

interface RestaurantFormData {
  name: string;
  address: string;
  cuisine_type: string;
  halal_status: "Full Halal" | "Partial Halal";
  price_range: "$" | "$$" | "$$$" | "$$$$";
  description: string;
  phone: string;
  website_url: string;
  lat: number;
  lng: number;
  opening_hours: OpeningHoursData;
}

const cuisineTypes = [
  "American",
  "Middle Eastern",
  "South Asian",
  "Southeast Asian",
  "Turkish",
  "Persian",
  "Mediterranean",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Vietnamese",
  "Mexican",
  "Italian",
  "African",
  "Caribbean",
  "Seafood",
  "Fast Food",
  "Cafe",
  "Bakery",
  "Bar & Grill",
  "Brunch",
  "Breakfast",
  "Deli",
  "Dessert",
  "Other",
];

export const AdminRestaurantForm = () => {
  const queryClient = useQueryClient();
  const [entryMode, setEntryMode] = useState<"search" | "manual">("search");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: "",
    address: "",
    cuisine_type: "",
    halal_status: "Full Halal",
    price_range: "$$",
    description: "",
    phone: "",
    website_url: "",
    lat: 0,
    lng: 0,
    opening_hours: getDefaultOpeningHours(),
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: RestaurantFormData) => {
      // Geocode address if coordinates are not set
      let lat = data.lat;
      let lng = data.lng;
      
      if (lat === 0 && lng === 0 && data.address) {
        setIsGeocoding(true);
        try {
          const geocoded = await geocodeAddress(data.address);
          if (geocoded) {
            lat = geocoded.lat;
            lng = geocoded.lng;
          } else {
            throw new Error("Could not geocode address. Please verify the address is correct.");
          }
        } finally {
          setIsGeocoding(false);
        }
      }

      // Create the restaurant
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .insert({
          name: data.name,
          address: data.address,
          cuisine_type: data.cuisine_type,
          halal_status: data.halal_status,
          price_range: data.price_range,
          description: data.description || null,
          phone: data.phone || null,
          website_url: data.website_url || null,
          lat,
          lng,
          opening_hours: data.opening_hours as any,
        })
        .select()
        .single();

      if (error) throw error;

      // Add images
      const validImages = images.filter(img => !img.isUploading && img.url);
      if (validImages.length > 0) {
        const imageInserts = validImages.map((img, index) => ({
          restaurant_id: restaurant.id,
          url: img.url,
          is_primary: index === 0,
        }));

        const { error: imageError } = await supabase
          .from("restaurant_images")
          .insert(imageInserts);

        if (imageError) {
          console.error("Failed to add images:", imageError);
        }
      }

      return restaurant;
    },
    onSuccess: () => {
      toast.success("Restaurant created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      // Reset form
      setFormData({
        name: "",
        address: "",
        cuisine_type: "",
        halal_status: "Full Halal",
        price_range: "$$",
        description: "",
        phone: "",
        website_url: "",
        lat: 0,
        lng: 0,
        opening_hours: getDefaultOpeningHours(),
      });
      setImages([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.cuisine_type) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Check if any images are still uploading
    if (images.some(img => img.isUploading)) {
      toast.error("Please wait for all images to finish uploading");
      return;
    }
    
    createRestaurantMutation.mutate(formData);
  };

  const handlePlaceSelect = async (place: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone?: string;
    website?: string;
    priceLevel?: number;
    openingHours?: string[];
    description?: string;
    cuisineType?: string;
    photos?: string[];
  }) => {
    const priceMap: Record<number, "$" | "$$" | "$$$" | "$$$$"> = {
      1: "$",
      2: "$$",
      3: "$$$",
      4: "$$$$",
    };

    setFormData(prev => ({
      ...prev,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone || prev.phone,
      website_url: place.website || prev.website_url,
      price_range: place.priceLevel ? priceMap[place.priceLevel] || "$$" : prev.price_range,
      opening_hours: place.openingHours ? parseGoogleHours(place.openingHours) : prev.opening_hours,
      description: place.description || prev.description,
      cuisine_type: place.cuisineType && cuisineTypes.includes(place.cuisineType) ? place.cuisineType : prev.cuisine_type,
    }));

    // Download photos from Google and add to images
    if (place.photos && place.photos.length > 0) {
      toast.info(`Found ${place.photos.length} photos. Downloading...`);
      
      for (const photoUrl of place.photos) {
        const newId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add placeholder
        setImages(prev => [...prev, { id: newId, url: photoUrl, isUploading: true }]);
        
        try {
          // Download and upload to storage
          const response = await fetch(photoUrl);
          if (!response.ok) throw new Error('Failed to fetch photo');
          
          const blob = await response.blob();
          const fileName = `restaurants/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          
          const { error } = await supabase.storage
            .from('restaurant-images')
            .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg'
            });
          
          if (error) throw error;
          
          const { data: publicUrl } = supabase.storage
            .from('restaurant-images')
            .getPublicUrl(fileName);
          
          setImages(prev => prev.map(img => 
            img.id === newId 
              ? { ...img, url: publicUrl.publicUrl, isUploading: false }
              : img
          ));
        } catch (error) {
          console.error('Failed to download photo:', error);
          setImages(prev => prev.filter(img => img.id !== newId));
        }
      }
    }

    toast.success("Restaurant details filled from search");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entry Mode Toggle */}
      <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "search" | "manual")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search to Auto-fill
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <PenLine className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <div className="space-y-2">
            <Label>Search for Restaurant</Label>
            <GooglePlacesAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search by restaurant name or address..."
            />
            <p className="text-xs text-muted-foreground">
              Search will auto-fill name, address, phone, website, hours, and price range.
              You can edit any field after selection.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Fill in all restaurant details manually below.
          </p>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address (will be geocoded)"
              required
            />
            <p className="text-xs text-muted-foreground">
              Address will be automatically converted to coordinates
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine Type *</Label>
            <Select
              value={formData.cuisine_type}
              onValueChange={(value) => setFormData({ ...formData, cuisine_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cuisine type" />
              </SelectTrigger>
              <SelectContent>
                {cuisineTypes.map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Halal Status</Label>
              <Select
                value={formData.halal_status}
                onValueChange={(value: "Full Halal" | "Partial Halal") =>
                  setFormData({ ...formData, halal_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Halal">Full Halal</SelectItem>
                  <SelectItem value="Partial Halal">Partial Halal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <Select
                value={formData.price_range}
                onValueChange={(value: "$" | "$$" | "$$$" | "$$$$") =>
                  setFormData({ ...formData, price_range: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ (Budget)</SelectItem>
                  <SelectItem value="$$">$$ (Moderate)</SelectItem>
                  <SelectItem value="$$$">$$$ (Upscale)</SelectItem>
                  <SelectItem value="$$$$">$$$$ (Fine Dining)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the restaurant..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      <OpeningHoursEditor
        value={formData.opening_hours}
        onChange={(hours) => setFormData({ ...formData, opening_hours: hours })}
      />

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Restaurant Images (up to 10)</Label>
        <ImageUploadZone
          images={images}
          onImagesChange={setImages}
          maxImages={10}
          folderPrefix="restaurants"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createRestaurantMutation.isPending || isGeocoding}
      >
        {createRestaurantMutation.isPending || isGeocoding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {isGeocoding ? "Geocoding address..." : "Creating..."}
          </>
        ) : (
          "Create Restaurant"
        )}
      </Button>
    </form>
  );
};
