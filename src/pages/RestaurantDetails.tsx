import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Heart, 
  Share2, 
  X,
  Check
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Fetch restaurant data
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch restaurant images
  const { data: images = [] } = useQuery({
    queryKey: ['restaurant-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_images')
        .select('*')
        .eq('restaurant_id', id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id,
  });

  // Fetch reviews with profile data
  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', id],
    queryFn: async () => {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Fetch profiles for reviewers
      const userIds = reviewsData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string | null; avatar_url: string | null }>);

      return reviewsData.map(review => ({
        ...review,
        profile: profilesMap[review.user_id] || null,
      }));
    },
    enabled: !!id,
  });

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[new Date().getDay()];

  const openingHours = restaurant?.opening_hours as Record<string, string> | null;
  const halalAttributes = (restaurant?.halal_attributes as string[] | null) || [];

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
          <Button onClick={() => navigate('/explore')}>Back to Explore</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Image Gallery */}
      <div className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[300px] md:h-[400px]">
          {/* Main Image */}
          <motion.div 
            className="col-span-4 md:col-span-2 md:row-span-2 relative cursor-pointer overflow-hidden"
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedImageIndex(0)}
          >
            {images[0] ? (
              <img
                src={images[0]}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </motion.div>

          {/* Secondary Images */}
          {images.slice(1, 5).map((image, idx) => (
            <motion.div
              key={idx}
              className="hidden md:block relative cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedImageIndex(idx + 1)}
            >
              <img
                src={image}
                alt={`${restaurant.name} ${idx + 2}`}
                className="w-full h-full object-cover"
              />
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                  <span className="text-white font-medium">+{images.length - 5} more</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {restaurant.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-gold text-gold" />
                      <span className="font-semibold">{avgRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({reviews.length} reviews)</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <span>{restaurant.cuisine_type}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{restaurant.price_range}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={cn(isFavorited && "text-destructive")}
                  >
                    <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Halal Status */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <Badge
                  className={cn(
                    "text-sm px-3 py-1",
                    restaurant.halal_status === 'Full Halal'
                      ? "bg-halal-full text-halal-full-foreground"
                      : "bg-halal-partial text-halal-partial-foreground"
                  )}
                >
                  {restaurant.halal_status}
                </Badge>
                {halalAttributes.map((attr) => (
                  <Badge key={attr} variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    {attr}
                  </Badge>
                ))}
              </div>

              <p className="text-muted-foreground">{restaurant.description}</p>
            </div>

            <Separator />

            {/* Reviews Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">Reviews</h2>
                <Button>Write a Review</Button>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-card border"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={review.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {review.profile?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{review.profile?.username || 'Anonymous'}</p>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={cn(
                                  "h-4 w-4",
                                  idx < review.rating
                                    ? "fill-gold text-gold"
                                    : "fill-muted text-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <div className="p-6 rounded-2xl bg-card border">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground text-sm">{restaurant.address}</p>
                    </div>
                  </div>

                  {restaurant.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <a 
                          href={`tel:${restaurant.phone}`}
                          className="text-primary text-sm hover:underline"
                        >
                          {restaurant.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {restaurant.website_url && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <a 
                          href={restaurant.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          Visit website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hours Card */}
              {openingHours && (
                <div className="p-6 rounded-2xl bg-card border">
                  <Accordion type="single" collapsible defaultValue="hours">
                    <AccordionItem value="hours" className="border-none">
                      <AccordionTrigger className="py-0 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium">Hours</p>
                            <p className="text-sm text-muted-foreground">
                              Today: {openingHours[today] || 'Closed'}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 space-y-2">
                          {Object.entries(openingHours).map(([day, hours]) => (
                            <div 
                              key={day} 
                              className={cn(
                                "flex justify-between text-sm",
                                day === today && "font-medium text-primary"
                              )}
                            >
                              <span className="capitalize">{day}</span>
                              <span>{hours}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* Mini Map */}
              <div className="h-48 rounded-2xl bg-muted overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <MapPin className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && images[selectedImageIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImageIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.img
              key={selectedImageIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={images[selectedImageIndex]}
              alt={restaurant.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetails;
