/**
 * Single source of truth for product classification.
 * Maps display labels to backend enum values.
 */
export const PRODUCT_CATEGORIES = {
    PREMIUM_OIL: {
        label: 'Premium Oil',
        value: 'premium oil',
        path: '/products?category=premium oil'
    },
    BAKHOOR: {
        label: 'Bakhoor',
        value: 'bakhoor',
        path: '/products?category=bakhoor'
    },
    AROMA_CHEMICALS: {
        label: 'Aroma Chemicals',
        value: 'aroma chemicals',
        path: '/products?category=aroma chemicals'
    },
    BOOSTERS_AND_BASES: {
        label: 'Booster & Bases',
        value: 'boosters and bases',
        path: '/products?category=boosters and bases'
    },
    INCENSE: {
        label: 'Incense',
        value: 'incense',
        path: '/products?category=incense'
    }
};

/**
 * Curated order for storefront navigation
 */
export const CATEGORY_ORDER = [
    'AROMA_CHEMICALS',
    'BOOSTERS_AND_BASES',
    'PREMIUM_OIL',
    'BAKHOOR',
    'INCENSE'
];

export const CATEGORY_LIST = Object.values(PRODUCT_CATEGORIES);

export const mapToCategoryEnum = (input) => {
    if (!input) return null;
    const normalized = String(input || '').trim().toLowerCase();
    
    // Exact renames
    if (normalized === 'premium attars') return 'PREMIUM_OIL';
    
    return String(input || '').trim().toUpperCase().replace(/ /g, '_');
};
