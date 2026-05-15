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
    SAMPLE_COLLECTIONS: {
        label: 'Sample Collections',
        value: 'sample collections',
        path: '/products?category=sample collections'
    },
    BOOSTERS_AND_BASES: {
        label: 'Boosters & Bases',
        value: 'boosters and bases',
        path: '/products?category=boosters and bases'
    }
};

export const CATEGORY_LIST = Object.values(PRODUCT_CATEGORIES);

export const mapToCategoryEnum = (input) => {
    if (!input) return null;
    const normalized = input.trim().toLowerCase();
    
    // Exact renames
    if (normalized === 'premium attars') return 'PREMIUM_OIL';
    
    return input.trim().toUpperCase().replace(/ /g, '_');
};
