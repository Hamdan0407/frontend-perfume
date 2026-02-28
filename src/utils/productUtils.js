/**
 * Groups products by their base name to handle multi-size variants in the UI.
 * This ensures that if we have "Gucci Bloom 30ml" and "Gucci Bloom 100ml", 
 * they appear as a single card with size selection.
 */
export const groupProducts = (products) => {
    if (!Array.isArray(products)) return [];

    const groups = {};

    products.forEach(product => {
        // Use brand + name as key to grouping
        const key = `${product.brand || ''}-${product.name}`.trim();

        if (!groups[key]) {
            const productSize = product.size || product.volume || (product.variants && product.variants.length > 0 ? product.variants[0].size : null);
            const productUnit = product.unit || (product.variants && product.variants.length > 0 ? product.variants[0].unit : (product.category === 'aroma chemicals' ? 'g' : 'ml'));

            groups[key] = {
                ...product,
                size: productSize,
                unit: productUnit,
                variants: [
                    {
                        id: product.id,
                        size: productSize,
                        unit: productUnit,
                        price: product.price,
                        discountPrice: product.discountPrice,
                        stock: product.stock,
                        active: product.active
                    }
                ]
            };

            // If the product already has variants from the backend, use those too
            if (product.variants && product.variants.length > 0) {
                groups[key].allVariants = product.variants;
            } else {
                groups[key].allVariants = groups[key].variants;
            }
        } else {
            const variantSize = product.size || product.volume || (product.variants && product.variants.length > 0 ? product.variants[0].size : null);
            const variantUnit = product.unit || (product.variants && product.variants.length > 0 ? product.variants[0].unit : (product.category === 'aroma chemicals' ? 'g' : 'ml'));

            // Add variant to existing group
            groups[key].variants.push({
                id: product.id,
                size: variantSize,
                unit: variantUnit,
                price: product.price,
                discountPrice: product.discountPrice,
                stock: product.stock,
                active: product.active
            });

            // Update allVariants for the card to use for price displaying
            if (product.variants && product.variants.length > 0) {
                const uniqueVariants = [...(groups[key].allVariants || [])];
                product.variants.forEach(v => {
                    if (!uniqueVariants.find(uv => uv.id === v.id)) {
                        uniqueVariants.push(v);
                    }
                });
                groups[key].allVariants = uniqueVariants;
            } else {
                groups[key].allVariants = groups[key].variants;
            }

            // Update group price to lowest available variant price
            if (product.price < groups[key].price) {
                groups[key].price = product.price;
                groups[key].discountPrice = product.discountPrice;
            }
        }
    });

    return Object.values(groups);
};
