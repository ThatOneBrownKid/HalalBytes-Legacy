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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  image_url: string;
}

const cuisineTypes = [
  "American",
  "Middle Eastern",
  "Indian",
  "Pakistani",
  "Turkish",
  "Malaysian",
  "Mediterranean",
  "Asian Fusion",
  "Chinese",
  "Thai",
  "Mexican",
  "Italian",
  "Other",
];

export const AdminRestaurantForm = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: "",
    address: "",
    cuisine_type: "",
    halal_status: "Full Halal",
    price_range: "$$",
    description: "",
    phone: "",
    website_url: "",
    lat: 40.7128,
    lng: -74.006,
    image_url: "",
  });
  const [imageTab, setImageTab] = useState<"url" | "upload">("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: RestaurantFormData) => {
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
          lat: data.lat,
          lng: data.lng,
        })
        .select()
        .single();

      if (error) throw error;

      // If there's an image URL, add it
      if (data.image_url) {
        const { error: imageError } = await supabase
          .from("restaurant_images")
          .insert({
            restaurant_id: restaurant.id,
            url: data.image_url,
            is_primary: true,
          });

        if (imageError) {
          console.error("Failed to add image:", imageError);
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
        lat: 40.7128,
        lng: -74.006,
        image_url: "",
      });
      setSelectedFile(null);
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
    createRestaurantMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // For now, just show a preview - actual upload would need storage bucket
      const reader = new FileReader();
      reader.onload = () => {
        // This would be replaced with actual upload logic
        toast.info("File selected. Note: File uploads require storage configuration.");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Full street address"
              required
            />
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

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={formData.lat}
            onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={formData.lng}
            onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Restaurant Image</Label>
        <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as "url" | "upload")}>
          <TabsList className="mb-3">
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              Image URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </TabsContent>
          <TabsContent value="upload">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : "Click to upload an image"}
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: File uploads require storage bucket configuration.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createRestaurantMutation.isPending}
      >
        {createRestaurantMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating...
          </>
        ) : (
          "Create Restaurant"
        )}
      </Button>
    </form>
  );
};
