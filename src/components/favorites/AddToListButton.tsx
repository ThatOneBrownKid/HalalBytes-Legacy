import { useState } from "react";
import { FolderPlus, Check, Plus, FolderHeart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AddToListButtonProps {
  restaurantId: string;
  variant?: "icon" | "button";
  className?: string;
}

export const AddToListButton = ({
  restaurantId,
  variant = "icon",
  className,
}: AddToListButtonProps) => {
  const { user } = useAuth();
  const { listNames, isFavorited, getFavorite, moveToList, isPending } = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);

  const currentFavorite = getFavorite(restaurantId);
  const currentList = currentFavorite?.list_name;

  const handleSelectList = async (listName: string) => {
    if (!user) {
      toast.error("Please sign in to save to lists");
      return;
    }
    await moveToList(restaurantId, listName);
    setIsOpen(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;
    if (!user) {
      toast.error("Please sign in to create lists");
      return;
    }
    await moveToList(restaurantId, newListName.trim());
    setNewListName("");
    setShowNewListInput(false);
    setIsOpen(false);
  };

  // Default lists that are always available
  const defaultLists = ["Favorites"];
  const allLists = [...new Set([...defaultLists, ...listNames])];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm transition-all",
              isFavorited(restaurantId) && "text-primary",
              className
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className={cn("h-4 w-4", isFavorited(restaurantId) && "fill-current")} />
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <FolderPlus className="h-4 w-4" />
            Add to List
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <p className="text-sm font-medium px-2 py-1.5 text-muted-foreground">
            {currentList ? `In "${currentList}"` : "Save to list"}
          </p>
          
          {allLists.map((list) => (
            <button
              key={list}
              onClick={() => handleSelectList(list)}
              disabled={isPending}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50",
                currentList === list && "bg-accent"
              )}
            >
              <span className="flex items-center gap-2">
                <FolderHeart className="h-4 w-4" />
                {list}
              </span>
              {currentList === list && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}

          <div className="border-t my-2" />

          {showNewListInput ? (
            <div className="p-2 space-y-2">
              <Input
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewListInput(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleCreateAndAdd}
                  disabled={!newListName.trim() || isPending}
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewListInput(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-primary"
            >
              <Plus className="h-4 w-4" />
              Create new list
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
