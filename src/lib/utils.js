import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats backend category enums (e.g., PREMIUM_ATTARS) into display labels (e.g., Premium Attars)
 * @param {string} category The category string from backend
 * @returns {string} Formatted category
 */
export function formatCategory(category) {
  if (!category) return "";

  // Special mapping for common backend enums to specific labels if needed
  const mapping = {
    'PARFUM': 'Parfum',
    'PERFUME': 'Parfum', // Ensuring 'perfume' also maps to 'Parfum'
    'PREMIUM_ATTARS': 'Premium Attars',
    'OUD_RESERVE': 'Oud Reserve',
    'BAKHOOR': 'Bakhoor',
    'AROMA_CHEMICALS': 'Aroma Chemicals'
  };

  if (mapping[category.toUpperCase()]) {
    return mapping[category.toUpperCase()];
  }

  // Generic fallback: PREMIUM_ATTARS -> Premium Attars
  return category
    .toLowerCase()
    .split(/_|\s/) // Split by underscore or space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
/**
 * Normalizes URL-formatted category strings (e.g., "premium attars") 
 * into backend enum format (e.g., "PREMIUM_ATTARS")
 * @param {string} category The category string from URL
 * @returns {string} Normalized enum string
 */
export function toCategoryEnum(category) {
  if (!category) return category;
  return category.trim().toUpperCase().replace(/ /g, "_");
}
