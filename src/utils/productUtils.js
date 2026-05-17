import { sortVariants } from '../lib/utils';

/**
 * Groups products by their base name to handle multi-size variants in the UI.
 * This ensures that if we have "Gucci Bloom 30ml" and "Gucci Bloom 100ml", 
 * they appear as a single card with size selection.
 */
export const groupProducts = (products) => {
    if (!Array.isArray(products)) return [];

    const groups = new Map();

    products.filter(p => p && (p.id || p.name)).forEach(product => {
        // Use brand + name as key to grouping
        const key = `${product.brand || ''}-${product.name}`.trim();

        if (!groups.has(key)) {
            const productSize = product.size || product.volume || (product.variants && product.variants.length > 0 ? product.variants[0].size : null);
            const productUnit = product.unit || (product.variants && product.variants.length > 0 ? product.variants[0].unit : (product.category === 'aroma chemicals' ? 'g' : 'ml'));

            const groupedProduct = {
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
                groupedProduct.allVariants = sortVariants(product.variants);
            } else {
                groupedProduct.allVariants = groupedProduct.variants;
            }

            groups.set(key, groupedProduct);
        } else {
            const existing = groups.get(key);
            const variantSize = product.size || product.volume || (product.variants && product.variants.length > 0 ? product.variants[0].size : null);
            const variantUnit = product.unit || (product.variants && product.variants.length > 0 ? product.variants[0].unit : (product.category === 'aroma chemicals' ? 'g' : 'ml'));

            // Add variant to existing group
            existing.variants.push({
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
                const uniqueVariants = [...(existing.allVariants || [])];
                product.variants.forEach(v => {
                    if (!uniqueVariants.find(uv => uv.id === v.id)) {
                        uniqueVariants.push(v);
                    }
                });
                existing.allVariants = sortVariants(uniqueVariants);
            } else {
                existing.allVariants = sortVariants(existing.variants);
            }

            // Update group price to lowest available variant price
            if (product.price < existing.price) {
                existing.price = product.price;
                existing.discountPrice = product.discountPrice;
            }
        }
    });

    return Array.from(groups.values());
};
