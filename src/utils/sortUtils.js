import { SORT_TYPES } from '../constants/sortOptions';

/**
 * Reusable, stable, non-mutating sorting function for products.
 * Handles grouped products and all target sort criteria safely.
 *
 * @param {Array} products The final rendered products array
 * @param {string} sortType One of the values in SORT_TYPES
 * @returns {Array} A new, sorted copy of the products array
 */
export const sortProducts = (products, sortType) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  // Always work on a shallow copy to prevent state mutation in React
  const sorted = [...products];

  return sorted.sort((a, b) => {
    switch (sortType) {
      case SORT_TYPES.FEATURED:
        // Featured products first, then fallback to id/createdAt desc
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        // Stable fallback
        return (b.id || 0) - (a.id || 0);

      case SORT_TYPES.NEWEST: {
        // Sort by createdAt / newness
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return (b.id || 0) - (a.id || 0);
      }

      case SORT_TYPES.PRICE_ASC: {
        const priceA = getMinPrice(a);
        const priceB = getMinPrice(b);
        if (priceA !== priceB) {
          return priceA - priceB;
        }
        return (b.id || 0) - (a.id || 0);
      }

      case SORT_TYPES.PRICE_DESC: {
        const priceA = getMinPrice(a);
        const priceB = getMinPrice(b);
        if (priceA !== priceB) {
          return priceB - priceA;
        }
        return (b.id || 0) - (a.id || 0);
      }

      case SORT_TYPES.NAME_ASC: {
        // Localized, case-insensitive, safe name comparison
        const nameA = String(a.name || '').trim();
        const nameB = String(b.name || '').trim();
        const comp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        if (comp !== 0) {
          return comp;
        }
        return (b.id || 0) - (a.id || 0);
      }

      case SORT_TYPES.RATING_DESC: {
        // Sort by average rating
        const ratingA = Number(a.rating || 0);
        const ratingB = Number(b.rating || 0);
        if (ratingA !== ratingB) {
          return ratingB - ratingA;
        }
        return (b.id || 0) - (a.id || 0);
      }

      default:
        // Stable fallback
        return (b.id || 0) - (a.id || 0);
    }
  });
};

/**
 * Safely resolves the minimum price for a product or its variants.
 */
const getMinPrice = (product) => {
  if (!product) return 0;

  // If there are variants, find the lowest active variant price
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const activeVariants = product.variants.filter(v => v.active !== false);
    if (activeVariants.length > 0) {
      return Math.min(...activeVariants.map(v => Number(v.discountPrice || v.price || 0)));
    }
  }

  if (Array.isArray(product.allVariants) && product.allVariants.length > 0) {
    const activeVariants = product.allVariants.filter(v => v.active !== false);
    if (activeVariants.length > 0) {
      return Math.min(...activeVariants.map(v => Number(v.discountPrice || v.price || 0)));
    }
  }

  // Fallback to product properties
  return Number(product.discountPrice || product.price || 0);
};
