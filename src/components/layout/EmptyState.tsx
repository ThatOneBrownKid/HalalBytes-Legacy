import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
    <div className="mb-4 text-muted-foreground">{icon}</div>
    <h3 className="font-display text-2xl font-semibold mb-2 text-foreground">
      {title}
    </h3>
    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
      {description}
    </p>
    <Button onClick={onAction} className="gap-2">
      <Plus className="h-4 w-4" />
      {actionText}
    </Button>
  </div>
);
