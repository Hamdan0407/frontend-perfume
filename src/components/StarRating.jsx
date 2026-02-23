// StarRating.jsx - Reusable star rating component with half-star support
import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFull = (hoverValue || value) >= rating;
        const isHalf = !isFull && (hoverValue || value) >= rating - 0.5;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            className={cn(
              "transition-transform duration-100 outline-none",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default"
            )}
          >
            {readOnly && isHalf ? (
              <StarHalf
                className={cn(starSize, "fill-yellow-400 text-yellow-400")}
              />
            ) : (
              <Star
                className={cn(
                  starSize,
                  isFull
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-300"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
