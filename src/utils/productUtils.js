/**
 * Groups products by their base name (without variant info).
 * Products with identical names are merged, and the first variant is shown
 * as the representative product.
 */
export function groupProducts(products) {
    if (!Array.isArray(products)) return [];

    const groups = {};

    products.forEach(product => {
        // Use the product name as the group key
        const key = product.name?.trim();
        if (!key) return;

        if (!groups[key]) {
            groups[key] = { ...product, variants: [] };
        }

        // Collect variant information if available
        if (product.variants && product.variants.length > 0) {
            groups[key].variants = [...(groups[key].variants || []), ...product.variants];
        } else {
            groups[key].variants.push({
                id: product.id,
                size: product.size || 'Default',
                price: product.price,
                discountPrice: product.discountPrice,
                stock: product.stock,
            });
        }

        // Use the lowest price as the display price
        if (product.price < groups[key].price) {
            groups[key].price = product.price;
            groups[key].discountPrice = product.discountPrice;
        }
    });

    return Object.values(groups);
}
