import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Heart, 
  Share2, 
  ChevronDown,
  Check,
  X,
  User
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Mock data - this would come from the database
const mockRestaurant = {
  id: "1",
  name: "Halal Guys",
  description: "Famous halal street food known for their chicken and gyro platters. A New York City institution since 1990, serving authentic halal food with their signature white and red sauces.",
  address: "123 Main St, New York, NY 10001",
  lat: 40.7580,
  lng: -73.9855,
  price_range: "$$" as const,
  cuisine_type: "Middle Eastern",
  halal_status: "Full Halal" as const,
  halal_attributes: ["Hand Slaughtered", "Alcohol Free", "Zabihah Certified"],
  partial_halal_meats: [],
  website_url: "https://thehalalguys.com",
  phone: "+1 (212) 555-0123",
  opening_hours: {
    mon: "10:00 AM - 11:00 PM",
    tue: "10:00 AM - 11:00 PM",
    wed: "10:00 AM - 11:00 PM",
    thu: "10:00 AM - 11:00 PM",
    fri: "10:00 AM - 12:00 AM",
    sat: "10:00 AM - 12:00 AM",
    sun: "11:00 AM - 10:00 PM",
  },
  is_sponsored: false,
  images: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
    "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200",
  ],
  rating: 4.5,
  review_count: 234,
};

const mockReviews = [
  {
    id: "1",
    user: { name: "Ahmed K.", avatar: null },
    rating: 5,
    comment: "Best halal food in NYC! The chicken over rice with white sauce is absolutely amazing. Been coming here for years and the quality is always consistent.",
    created_at: "2024-01-15",
    images: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"],
  },
  {
    id: "2",
    user: { name: "Fatima S.", avatar: null },
    rating: 4,
    comment: "Great food, generous portions. Can get a bit crowded during lunch hours but worth the wait. The lamb is particularly good.",
    created_at: "2024-01-10",
    images: [],
  },
  {
    id: "3",
    user: { name: "Omar M.", avatar: null },
    rating: 5,
    comment: "Finally found a place where I don't have to worry about the halal status. The staff is friendly and the food is delicious. Highly recommend!",
    created_at: "2024-01-05",
    images: [],
  },
];

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const restaurant = mockRestaurant; // In production, fetch based on id
  const reviews = mockReviews;

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[new Date().getDay()];

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
            <img
              src={restaurant.images[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Secondary Images */}
          {restaurant.images.slice(1, 5).map((image, idx) => (
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
              {idx === 3 && restaurant.images.length > 5 && (
                <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                  <span className="text-white font-medium">+{restaurant.images.length - 5} more</span>
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
                      <span className="font-semibold">{restaurant.rating}</span>
                      <span className="text-muted-foreground">({restaurant.review_count} reviews)</span>
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
                {restaurant.halal_attributes.map((attr) => (
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
                        <AvatarImage src={review.user.avatar || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {review.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{review.user.name}</p>
                          <span className="text-sm text-muted-foreground">{review.created_at}</span>
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
                    <p className="text-muted-foreground mb-3">{review.comment}</p>
                    {review.images.length > 0 && (
                      <div className="flex gap-2">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Review"
                            className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
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
                </div>
              </div>

              {/* Hours Card */}
              <div className="p-6 rounded-2xl bg-card border">
                <Accordion type="single" collapsible defaultValue="hours">
                  <AccordionItem value="hours" className="border-none">
                    <AccordionTrigger className="py-0 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="font-medium">Hours</p>
                          <p className="text-sm text-muted-foreground">
                            Today: {restaurant.opening_hours[today as keyof typeof restaurant.opening_hours]}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4 space-y-2">
                        {Object.entries(restaurant.opening_hours).map(([day, hours]) => (
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
        {selectedImageIndex !== null && (
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
              src={restaurant.images[selectedImageIndex]}
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
