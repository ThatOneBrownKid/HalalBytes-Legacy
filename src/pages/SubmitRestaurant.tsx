import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin, Phone, Globe, Search, PenLine, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

const cuisineTypes = [
  "Middle Eastern", "Mediterranean", "South Asian", "Southeast Asian", 
  "Turkish", "Persian", "American", "Mexican", "Chinese", "Japanese",
  "African", "Caribbean", "Italian", "Fast Food", "Bakery", "Other"
];

const halalAttributes = [
  { id: "hand_slaughtered", label: "Hand Slaughtered" },
  { id: "machine_slaughtered", label: "Machine Slaughtered" },
  { id: "zabiha", label: "Zabiha Certified" },
  { id: "no_alcohol", label: "No Alcohol Served" },
  { id: "halal_certified", label: "Halal Certified" },
];

const meatTypes = [
  { id: "chicken", label: "Chicken" },
  { id: "beef", label: "Beef" },
  { id: "lamb", label: "Lamb" },
  { id: "goat", label: "Goat" },
  { id: "seafood", label: "Seafood" },
];

const SubmitRestaurant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryMode, setEntryMode] = useState<"search" | "manual">("search");
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    website_url: "",
    cuisine_type: "",
    price_range: "$$" as "$" | "$$" | "$$$" | "$$$$",
    halal_status: "Full Halal" as "Full Halal" | "Partial Halal",
    halal_attributes: [] as string[],
    partial_halal_meats: [] as string[],
    lat: 0,
    lng: 0,
    opening_hours: getDefaultOpeningHours(),
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeToggle = (attributeId: string) => {
    setFormData(prev => ({
      ...prev,
      halal_attributes: prev.halal_attributes.includes(attributeId)
        ? prev.halal_attributes.filter(a => a !== attributeId)
        : [...prev.halal_attributes, attributeId]
    }));
  };

  const handleMeatToggle = (meatId: string) => {
    setFormData(prev => ({
      ...prev,
      partial_halal_meats: prev.partial_halal_meats.includes(meatId)
        ? prev.partial_halal_meats.filter(m => m !== meatId)
        : [...prev.partial_halal_meats, meatId]
    }));
  };

  const handlePlaceSelect = (place: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone?: string;
    website?: string;
    priceLevel?: number;
    openingHours?: string[];
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
    }));

    toast.success("Restaurant details filled from search");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to submit a restaurant");
      return;
    }

    if (!formData.name || !formData.address || !formData.cuisine_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if any images are still uploading
    if (images.some(img => img.isUploading)) {
      toast.error("Please wait for all images to finish uploading");
      return;
    }

    setIsSubmitting(true);

    try {
      // Geocode the address if coordinates are not set
      let lat = formData.lat;
      let lng = formData.lng;
      
      if (lat === 0 && lng === 0 && formData.address) {
        const geocoded = await geocodeAddress(formData.address);
        if (geocoded) {
          lat = geocoded.lat;
          lng = geocoded.lng;
        }
      }

      // Get image URLs
      const imageUrls = images
        .filter(img => !img.isUploading && img.url)
        .map(img => img.url);

      const submissionData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        website_url: formData.website_url,
        cuisine_type: formData.cuisine_type,
        price_range: formData.price_range,
        halal_status: formData.halal_status,
        halal_attributes: formData.halal_attributes,
        partial_halal_meats: formData.halal_status === "Partial Halal" ? formData.partial_halal_meats : [],
        image_urls: imageUrls,
        lat,
        lng,
        opening_hours: formData.opening_hours,
      };

      const { error } = await supabase
        .from('restaurant_requests')
        .insert([{
          user_id: user.id,
          submission_data: submissionData as any,
          status: 'pending' as const,
        }]);

      if (error) throw error;

      toast.success("Restaurant submitted for review!", {
        description: "You can track its status in My Requests"
      });
      
      navigate('/my-requests');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error("Failed to submit restaurant", {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Submit a Restaurant</CardTitle>
              <CardDescription>
                Help the community discover halal restaurants in your area. 
                Submissions are reviewed by our team before being published.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Fill in all restaurant details manually below.
                    </p>
                  </TabsContent>
                </Tabs>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Restaurant Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter restaurant name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about this restaurant..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cuisine_type">Cuisine Type *</Label>
                      <Select
                        value={formData.cuisine_type}
                        onValueChange={(value) => handleInputChange("cuisine_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cuisine type" />
                        </SelectTrigger>
                        <SelectContent>
                          {cuisineTypes.map(cuisine => (
                            <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price_range">Price Range</Label>
                      <Select
                        value={formData.price_range}
                        onValueChange={(value) => handleInputChange("price_range", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$">$ - Budget</SelectItem>
                          <SelectItem value="$$">$$ - Moderate</SelectItem>
                          <SelectItem value="$$$">$$$ - Upscale</SelectItem>
                          <SelectItem value="$$$$">$$$$ - Fine Dining</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Location & Contact</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Full street address (will be geocoded)"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Address will be automatically converted to map coordinates
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          placeholder="https://example.com"
                          value={formData.website_url}
                          onChange={(e) => handleInputChange("website_url", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opening Hours */}
                <OpeningHoursEditor
                  value={formData.opening_hours}
                  onChange={(hours) => setFormData(prev => ({ ...prev, opening_hours: hours }))}
                />

                {/* Halal Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Halal Information</h3>
                  
                  <div className="space-y-2">
                    <Label>Halal Status *</Label>
                    <Select
                      value={formData.halal_status}
                      onValueChange={(value) => handleInputChange("halal_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Halal">Full Halal - Entire menu is halal</SelectItem>
                        <SelectItem value="Partial Halal">Partial Halal - Some halal options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.halal_status === "Partial Halal" && (
                    <div className="space-y-2">
                      <Label>Halal Meat Types Available</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {meatTypes.map(meat => (
                          <div
                            key={meat.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={meat.id}
                              checked={formData.partial_halal_meats.includes(meat.id)}
                              onCheckedChange={() => handleMeatToggle(meat.id)}
                            />
                            <Label htmlFor={meat.id} className="cursor-pointer text-sm">
                              {meat.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Halal Attributes</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {halalAttributes.map(attr => (
                        <div
                          key={attr.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={attr.id}
                            checked={formData.halal_attributes.includes(attr.id)}
                            onCheckedChange={() => handleAttributeToggle(attr.id)}
                          />
                          <Label htmlFor={attr.id} className="cursor-pointer text-sm">
                            {attr.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Restaurant Images (up to 10)</h3>
                  <ImageUploadZone
                    images={images}
                    onImagesChange={setImages}
                    maxImages={10}
                    folderPrefix="submissions"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you confirm that the information provided is accurate to the best of your knowledge.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default SubmitRestaurant;
