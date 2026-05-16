import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats backend category enums (e.g., PREMIUM_OIL) into display labels (e.g., Premium Oil)
 * @param {string} category The category string from backend
 * @returns {string} Formatted category
 */
export function formatCategory(category) {
  if (!category) return "";

  // If category is an object, extract the string value
  let catStr = category;
  if (typeof category === 'object') {
    catStr = category.name || category.displayName || category.label || category.id || "";
  }

  if (!catStr || typeof catStr !== 'string') return "";

  // Special mapping for common backend enums to specific labels if needed
  const mapping = {
    'PREMIUM_ATTARS': 'Premium Oil',
    'PREMIUM_OIL': 'Premium Oil',
    'BAKHOOR': 'Bakhoor',
    'AROMA_CHEMICALS': 'Aroma Chemicals',
    'SAMPLE_COLLECTIONS': 'Sample Collection',
    'BOOSTERS_AND_BASES': 'Boosters & Bases'
  };

  const upperCat = String(catStr || '').toUpperCase().replace(/ /g, "_");
  if (mapping[upperCat]) {
    return mapping[upperCat];
  }

  // Generic fallback: PREMIUM_OIL -> Premium Oil
  return String(catStr || '')
    .toLowerCase()
    .split(/_|\s/) // Split by underscore or space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Normalizes URL-formatted category strings (e.g., "premium oil") 
 * into backend enum format (e.g., "PREMIUM_OIL")
 * @param {string} category The category string from URL
 * @returns {string} Normalized enum string
 */
export function toCategoryEnum(input) {
  if (!input) return input;
  
  const normalized = String(input || '').trim().toLowerCase();
  
  // Exact renames
  if (normalized === 'premium attars') return 'PREMIUM_OIL';
  
  return String(input || '').trim().toUpperCase().replace(/ /g, "_");
}

/**
 * Sorts product variants numerically by size, handling units (g, kg, ml, l)
 * @param {Array} variants Array of variant objects with size and unit properties
 * @returns {Array} Sorted array
 */
export function sortVariants(variants) {
  if (!Array.isArray(variants)) return [];

  return [...variants].sort((a, b) => {
    const parseSize = (v) => {
      if (!v) return 0;
      
      // If size is already numeric and we have a unit
      const sizeValue = parseFloat(v.size);
      const unit = String(v.unit || '').toLowerCase();
      
      // If size is a string like "1kg" or "500gms"
      if (isNaN(sizeValue) && typeof v.size === 'string') {
        const match = v.size.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
        if (match) {
          const val = parseFloat(match[1]);
          const u = match[2].toLowerCase();
          if (u === 'kg' || u === 'l') return val * 1000;
          return val;
        }
      }

      // Handle unit multiplication
      if (unit === 'kg' || unit === 'l') return sizeValue * 1000;
      return sizeValue;
    };

    return parseSize(a) - parseSize(b);
  });
}
