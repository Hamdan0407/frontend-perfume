import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Spinner({ className, size = "default" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
}

export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
