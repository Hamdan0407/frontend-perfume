/**
 * Single source of truth for product classification.
 * Maps display labels to backend enum values.
 */
export const PRODUCT_CATEGORIES = {
    PARFUM: {
        label: 'Parfum',
        value: 'parfum',
        path: '/products?category=parfum'
    },
    PREMIUM_ATTARS: {
        label: 'Premium Attars',
        value: 'premium attars',
        path: '/products?category=premium attars'
    },
    OUD_RESERVE: {
        label: 'Oud Reserve',
        value: 'oud reserve',
        path: '/products?category=oud reserve'
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
    }
};

export const CATEGORY_LIST = Object.values(PRODUCT_CATEGORIES);

export const mapToCategoryEnum = (input) => {
    if (!input) return null;
    return input.trim().toUpperCase().replace(/ /g, '_');
};
