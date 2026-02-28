import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StockBadge({ stock, className, variant = 'default' }) {
  // Determine stock status
  const getStockStatus = () => {
    if (stock === 0) {
      return {
        label: 'Out of Stock',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
        dotColor: 'bg-red-500'
      };
    } else if (stock < 10) {
      return {
        label: `Low Stock - Only ${stock} left`,
        icon: AlertCircle,
        className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200',
        dotColor: 'bg-orange-500'
      };
    } else {
      return {
        label: 'In Stock',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
        dotColor: 'bg-green-500'
      };
    }
  };

  const status = getStockStatus();
  const Icon = status.icon;

  if (variant === 'dot') {
    // Simple dot variant for compact spaces
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("h-2 w-2 rounded-full", status.dotColor)} />
        <span className={cn(
          "text-xs font-medium",
          stock === 0 ? "text-red-700" :
          stock < 10 ? "text-orange-700" : "text-green-700"
        )}>
          {status.label}
        </span>
      </div>
    );
  }

  if (variant === 'simple') {
    // Simple text variant
    return (
      <span className={cn(
        "text-xs font-medium",
        stock === 0 ? "text-red-700" :
        stock < 10 ? "text-orange-700" : "text-green-700",
        className
      )}>
        {status.label}
      </span>
    );
  }

  // Default badge variant with icon
  return (
    <Badge className={cn(status.className, "flex items-center gap-1.5", className)}>
      <Icon className="h-3.5 w-3.5" />
      {status.label}
    </Badge>
  );
}
