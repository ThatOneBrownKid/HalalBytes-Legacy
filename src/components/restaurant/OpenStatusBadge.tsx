import { cn } from "@/lib/utils";
import { checkIfOpen } from "@/utils/timeFormat";

interface OpenStatusBadgeProps {
  openingHours: unknown;
  className?: string;
  showDetails?: boolean;
}

export const OpenStatusBadge = ({ 
  openingHours, 
  className,
  showDetails = true 
}: OpenStatusBadgeProps) => {
  const { isOpen, status } = checkIfOpen(openingHours);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
        isOpen 
          ? "bg-halal-full/20 text-halal-full dark:bg-halal-full/30" 
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      <span 
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isOpen ? "bg-halal-full animate-pulse" : "bg-muted-foreground"
        )} 
      />
      {showDetails ? status : (isOpen ? 'Open' : 'Closed')}
    </span>
  );
};
