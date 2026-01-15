import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Link as LinkIcon, Loader2, MapPin, Phone, Globe, DollarSign, Check } from "lucide-react";
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
  const [imageUploadMethod, setImageUploadMethod] = useState<"url" | "file">("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
    image_url: "",
    lat: 0,
    lng: 0,
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (imageUploadMethod === "url" && formData.image_url) {
      return formData.image_url;
    }
    
    if (imageUploadMethod === "file" && imageFile && user) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, imageFile);
      
      if (error) {
        console.error('Image upload error:', error);
        throw new Error('Failed to upload image');
      }
      
      const { data: publicUrl } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);
      
      return publicUrl.publicUrl;
    }
    
    return null;
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

    setIsSubmitting(true);

    try {
      // Upload image if provided
      const imageUrl = await uploadImage();

      // Geocode the address (basic implementation - in production use a proper geocoding API)
      // For now, we'll use default coordinates and let admins update
      const lat = formData.lat || 40.7128;
      const lng = formData.lng || -74.0060;

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
        image_url: imageUrl,
        lat,
        lng,
      };

      const { error } = await supabase
        .from('restaurant_requests')
        .insert({
          user_id: user.id,
          submission_data: submissionData,
          status: 'pending',
        });

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
                        placeholder="Full street address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
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
                  <h3 className="font-semibold text-lg">Restaurant Image</h3>
                  
                  <Tabs value={imageUploadMethod} onValueChange={(v) => setImageUploadMethod(v as "url" | "file")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Image URL
                      </TabsTrigger>
                      <TabsTrigger value="file" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload File
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input
                          id="image_url"
                          placeholder="https://example.com/image.jpg"
                          value={formData.image_url}
                          onChange={(e) => handleInputChange("image_url", e.target.value)}
                        />
                        {formData.image_url && (
                          <img 
                            src={formData.image_url} 
                            alt="Preview" 
                            className="mt-2 rounded-lg max-h-48 object-cover"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="file" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="image_file">Upload Image</Label>
                        <Input
                          id="image_file"
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="cursor-pointer"
                        />
                        {imagePreview && (
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="mt-2 rounded-lg max-h-48 object-cover"
                          />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Your submission will be reviewed within 24-48 hours
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default SubmitRestaurant;