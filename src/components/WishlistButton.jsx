import { Heart } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function WishlistButton({ productId, className = '', size = 20 }) {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const inWishlist = isInWishlist(productId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsAnimating(true);
    await toggleWishlist(productId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        group relative p-2 rounded-full transition-all duration-200
        ${inWishlist 
          ? 'bg-red-50 hover:bg-red-100' 
          : 'bg-white/80 hover:bg-white backdrop-blur-sm'
        }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        ${className}
      `}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        size={size}
        className={`
          transition-all duration-200
          ${inWishlist 
            ? 'fill-red-500 stroke-red-500' 
            : 'stroke-slate-600 group-hover:stroke-red-500'
          }
        `}
      />
    </button>
  );
}
