/**
 * Groups products by name and brand to handle variants (different sizes) in a single card.
 */
export const groupProducts = (productsList) => {
    if (!Array.isArray(productsList)) return [];

    const groups = {};

    productsList.forEach(p => {
        if (!p || !p.name) return;

        // Create a unique key for grouping (name + brand)
        const key = `${p.brand?.toLowerCase() || 'unknown'}_${p.name.toLowerCase()}`;

        if (!groups[key]) {
            groups[key] = {
                ...p,
                allVariants: []
            };

            // Ensure variants list is initialized
            const initialVariants = Array.isArray(p.variants) ? [...p.variants] : [];

            // If product doesn't have variants but has volume/price, create a 'virtual' variant
            const hasVolumeInVariants = initialVariants.some(v => v.size === p.volume);
            if (p.volume && !hasVolumeInVariants) {
                initialVariants.push({
                    id: `v_${p.id}`,
                    productId: p.id,
                    size: p.volume,
                    price: p.price,
                    discountPrice: p.discountPrice,
                    stock: p.stock,
                    active: p.active
                });
            }

            groups[key].allVariants = initialVariants;
        } else {
            // Merge variants from the same product record
            const existingVariants = groups[key].allVariants;
            const newVariants = Array.isArray(p.variants) ? p.variants : [];

            // Add new variants if they don't exist by size
            newVariants.forEach(nv => {
                if (!existingVariants.find(ev => ev.size === nv.size)) {
                    existingVariants.push(nv);
                }
            });

            // Add virtual variant for the current product record if its volume isn't covered
            if (p.volume && !existingVariants.find(ev => ev.size === p.volume)) {
                existingVariants.push({
                    id: `v_${p.id}`,
                    productId: p.id,
                    size: p.volume,
                    price: p.price,
                    discountPrice: p.discountPrice,
                    stock: p.stock,
                    active: p.active
                });
            }

            // Update aggregate properties
            // Total stock
            groups[key].stock = (groups[key].stock || 0) + (p.stock || 0);

            // If this record has a better (shorter) description and the current one is placeholder-like
            if (p.description && (!groups[key].description || groups[key].description.length < p.description.length)) {
                groups[key].description = p.description;
            }

            // Keep featured status if any product in group is featured
            if (p.featured) groups[key].featured = true;
        }
    });

    // Post-processing for each group
    Object.values(groups).forEach(group => {
        // 1. Sort variants by size ascending
        group.allVariants.sort((a, b) => (a.size || 0) - (b.size || 0));

        // 2. Set price to the min price of active, in-stock variants
        const activeVariants = group.allVariants.filter(v => v.active && v.stock > 0);
        const targetVariants = activeVariants.length > 0 ? activeVariants : group.allVariants;

        if (targetVariants.length > 0) {
            // Find min price and its corresponding discount price
            const basePrices = targetVariants.map(v => v.price || 0);
            const minPrice = Math.min(...basePrices);

            // Find the variant that has this minPrice to get its discountPrice
            const minPriceVariant = targetVariants.find(v => v.price === minPrice);

            group.price = minPrice;
            group.discountPrice = minPriceVariant?.discountPrice || null;

            // Update individual stock status based on selected display record
            const totalStock = group.allVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
            group.stock = totalStock;
        }
    });

    return Object.values(groups);
};
