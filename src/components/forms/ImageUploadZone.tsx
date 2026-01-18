import { useState, useRef, useCallback } from "react";
import { Upload, X, Link as LinkIcon, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  isUploading?: boolean;
}

interface ImageUploadZoneProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  bucketName?: string;
  folderPrefix?: string;
}

export const ImageUploadZone = ({
  images,
  onImagesChange,
  maxImages = 10,
  bucketName = "restaurant-images",
  folderPrefix = "uploads",
}: ImageUploadZoneProps) => {
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folderPrefix}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
    
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return publicUrl.publicUrl;
  };

  const downloadUrlToStorage = async (imageUrl: string): Promise<string> => {
    try {
      // Fetch the image from the URL
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const fileExt = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const fileName = `${folderPrefix}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || 'image/jpeg'
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error downloading URL to storage:', error);
      throw error;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added`);
    }
    
    const filesToProcess = fileArray.slice(0, remainingSlots);
    
    // Add placeholder entries for files being uploaded
    const newImages: UploadedImage[] = filesToProcess.map(file => ({
      id: generateId(),
      url: URL.createObjectURL(file),
      file,
      isUploading: true,
    }));
    
    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);
    
    // Upload each file
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      try {
        const uploadedUrl = await uploadFileToStorage(img.file!);
        
        // Update the image with the real URL - need to get fresh state
        onImagesChange(
          updatedImages.map(p => p.id === img.id 
            ? { ...p, url: uploadedUrl, isUploading: false, file: undefined }
            : p
          )
        );
        // Update local reference for next iteration
        const imgIndex = updatedImages.findIndex(p => p.id === img.id);
        if (imgIndex !== -1) {
          updatedImages[imgIndex] = { ...updatedImages[imgIndex], url: uploadedUrl, isUploading: false, file: undefined };
        }
      } catch (error: any) {
        toast.error(`Failed to upload ${img.file?.name}`);
        // Remove the failed upload
        const filtered = updatedImages.filter(p => p.id !== img.id);
        onImagesChange(filtered);
      }
    }
  }, [images, maxImages, onImagesChange, folderPrefix, bucketName]);

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    
    if (images.length >= maxImages) {
      toast.warning(`Maximum of ${maxImages} images allowed`);
      return;
    }
    
    setIsDownloadingUrl(true);
    const newId = generateId();
    
    // Add placeholder
    const updatedImages = [...images, { id: newId, url: urlInput, isUploading: true }];
    onImagesChange(updatedImages);
    
    try {
      const uploadedUrl = await downloadUrlToStorage(urlInput);
      onImagesChange(
        updatedImages.map(p => p.id === newId 
          ? { ...p, url: uploadedUrl, isUploading: false }
          : p
        )
      );
      setUrlInput("");
      toast.success("Image added successfully");
    } catch (error: any) {
      toast.error("Failed to download and upload image");
      onImagesChange(updatedImages.filter(p => p.id !== newId));
    } finally {
      setIsDownloadingUrl(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Check for files
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      return;
    }
    
    // Check for dragged image URL (from another tab/browser)
    const html = e.dataTransfer.getData('text/html');
    const urlMatch = html.match(/src=["']([^"']+)["']/);
    if (urlMatch && urlMatch[1]) {
      const draggedUrl = urlMatch[1];
      await handleUrlDrop(draggedUrl);
      return;
    }
    
    // Check for plain text URL
    const textUrl = e.dataTransfer.getData('text/plain');
    if (textUrl && (textUrl.startsWith('http://') || textUrl.startsWith('https://'))) {
      await handleUrlDrop(textUrl);
    }
  };

  const handleUrlDrop = async (url: string) => {
    if (images.length >= maxImages) {
      toast.warning(`Maximum of ${maxImages} images allowed`);
      return;
    }
    
    setIsDownloadingUrl(true);
    const newId = generateId();
    const updatedImages = [...images, { id: newId, url: url, isUploading: true }];
    onImagesChange(updatedImages);
    
    try {
      const uploadedUrl = await downloadUrlToStorage(url);
      onImagesChange(
        updatedImages.map(p => p.id === newId 
          ? { ...p, url: uploadedUrl, isUploading: false }
          : p
        )
      );
      toast.success("Image added successfully");
    } catch (error) {
      toast.error("Failed to download and upload image");
      onImagesChange(updatedImages.filter(p => p.id !== newId));
    } finally {
      setIsDownloadingUrl(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "url" | "file")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            From URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="file" className="mt-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50",
              images.length >= maxImages && "opacity-50 cursor-not-allowed"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => images.length < maxImages && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              disabled={images.length >= maxImages}
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              {isDragging ? "Drop images here" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to select files ({images.length}/{maxImages})
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isDownloadingUrl || images.length >= maxImages}
            />
            <Button 
              type="button"
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || isDownloadingUrl || images.length >= maxImages}
            >
              {isDownloadingUrl ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Images will be downloaded and stored in our system for reliability.
          </p>
        </TabsContent>
      </Tabs>
      
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div 
              key={img.id} 
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              {img.isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img 
                  src={img.url} 
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(img.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              {index === 0 && !img.isUploading && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
