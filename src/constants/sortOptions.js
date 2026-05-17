export const SORT_TYPES = {
  FEATURED: 'featured',
  NEWEST: 'newest',
  PRICE_ASC: 'price-asc',
  PRICE_DESC: 'price-desc',
  NAME_ASC: 'name-asc',
  RATING_DESC: 'rating-desc',
};

export const SORT_OPTIONS = [
  { value: SORT_TYPES.FEATURED, label: 'Featured' },
  { value: SORT_TYPES.NEWEST, label: 'New Arrivals' },
  { value: SORT_TYPES.PRICE_ASC, label: 'Price: Low to High' },
  { value: SORT_TYPES.PRICE_DESC, label: 'Price: High to Low' },
  { value: SORT_TYPES.NAME_ASC, label: 'Alphabetically: A–Z' },
  { value: SORT_TYPES.RATING_DESC, label: 'Highest Rated' },
];
