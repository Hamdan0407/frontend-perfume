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

  // Special mapping for common backend enums to specific labels if needed
  const mapping = {
    'PREMIUM_ATTARS': 'Premium Oil',
    'PREMIUM_OIL': 'Premium Oil',
    'BAKHOOR': 'Bakhoor',
    'AROMA_CHEMICALS': 'Aroma Chemicals',
    'SAMPLE_COLLECTIONS': 'Sample Collection',
    'BOOSTERS_AND_BASES': 'Boosters & Bases'
  };

  const upperCat = category.toUpperCase().replace(/ /g, "_");
  if (mapping[upperCat]) {
    return mapping[upperCat];
  }

  // Generic fallback: PREMIUM_OIL -> Premium Oil
  return category
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
export function toCategoryEnum(category) {
  if (!category) return category;
  
  const normalized = category.trim().toLowerCase();
  if (normalized === 'premium attars') return 'PREMIUM_OIL';
  
  return category.trim().toUpperCase().replace(/ /g, "_");
}
