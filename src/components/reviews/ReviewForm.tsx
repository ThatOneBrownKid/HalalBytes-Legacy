import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExistingReview {
  id: string;
  rating: number;
  comment: string;
  images: { id: string; url: string }[];
}

interface ReviewFormProps {
  restaurantId: string;
  existingReview?: ExistingReview;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ restaurantId, existingReview, onSuccess, onCancel }: ReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(existingReview?.comment || "");
  const [images, setImages] = useState<{ file?: File; preview: string; id?: string; isExisting?: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!existingReview;

  // Initialize with existing images
  useEffect(() => {
    if (existingReview?.images) {
      setImages(existingReview.images.map(img => ({
        preview: img.url,
        id: img.id,
        isExisting: true,
      })));
    }
  }, [existingReview]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to submit a review");
      if (rating === 0) throw new Error("Please select a rating");

      let reviewId = existingReview?.id;

      if (isEditing && reviewId) {
        // Update existing review
        const { error: updateError } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: content || null,
          })
          .eq('id', reviewId);

        if (updateError) throw updateError;

        // Handle removed existing images
        const existingImageIds = existingReview.images.map(img => img.id);
        const keptImageIds = images.filter(img => img.isExisting && img.id).map(img => img.id);
        const removedImageIds = existingImageIds.filter(id => !keptImageIds.includes(id));

        if (removedImageIds.length > 0) {
          await supabase
            .from('review_images')
            .delete()
            .in('id', removedImageIds);
        }
      } else {
        // Create new review
        const { data: review, error: reviewError } = await supabase
          .from('reviews')
          .insert({
            restaurant_id: restaurantId,
            user_id: user.id,
            rating,
            comment: content || null,
          })
          .select()
          .single();

        if (reviewError) throw reviewError;
        reviewId = review.id;
      }

      // Upload new images
      const newImages = images.filter(img => !img.isExisting && img.file);
      if (newImages.length > 0) {
        setIsUploading(true);
        
        for (const image of newImages) {
          if (!image.file) continue;
          
          const fileName = `review-${reviewId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('restaurant-images')
            .upload(fileName, image.file, {
              contentType: image.file.type,
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('restaurant-images')
            .getPublicUrl(fileName);

          // Save to review_images table
          await supabase.from('review_images').insert({
            review_id: reviewId,
            url: urlData.publicUrl,
            uploaded_by: user.id,
          });

          // Also add to restaurant_images (user-uploaded, not from Google)
          await supabase.from('restaurant_images').insert({
            restaurant_id: restaurantId,
            url: urlData.publicUrl,
            uploaded_by: user.id,
            is_primary: false,
          });
        }
        
        setIsUploading(false);
      }

      return { id: reviewId };
    },
    onSuccess: () => {
      toast.success(isEditing ? "Review updated successfully!" : "Review submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ['restaurant-reviews', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-images', restaurantId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - images.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const image = prev[index];
      if (!image.isExisting && image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  if (!user) {
    return (
      <div className="p-4 sm:p-6 rounded-xl bg-muted/30 text-center">
        <p className="text-muted-foreground mb-3">Sign in to write a review</p>
        <Button onClick={() => window.location.href = '/auth/signin'}>Sign In</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 rounded-xl bg-card border space-y-4"
    >
      {/* Star Rating */}
      <div>
        <p className="text-sm font-medium mb-2">Your Rating</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className="p-0.5"
              onMouseEnter={() => setHoverRating(idx + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(idx + 1)}
            >
              <Star
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                  (hoverRating || rating) > idx
                    ? "fill-gold text-gold"
                    : "fill-muted text-muted"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Rich Text Editor */}
      <div>
        <p className="text-sm font-medium mb-2">Your Review</p>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Share your experience with this restaurant..."
        />
      </div>

      {/* Image Upload */}
      <div>
        <p className="text-sm font-medium mb-2">Add Photos (optional)</p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {images.map((image, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative w-20 h-20 rounded-lg overflow-hidden"
              >
                <img
                  src={image.preview}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-foreground/80 rounded-full text-background hover:bg-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {images.length < 5 && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Up to 5 photos. These will also appear in the restaurant gallery.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || rating === 0}
          className="gap-2"
        >
          {(submitMutation.isPending || isUploading) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isEditing ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </motion.div>
  );
};
