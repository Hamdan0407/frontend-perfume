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
            groups[key] = {
                ...product,
                variants: [
                    {
                        id: product.id,
                        size: product.size,
                        price: product.price,
                        discountPrice: product.discountPrice,
                        stock: product.stock,
                        active: product.active
                    }
                ]
            };
        } else {
            // Add variant to existing group
            groups[key].variants.push({
                id: product.id,
                size: product.size,
                price: product.price,
                discountPrice: product.discountPrice,
                stock: product.stock,
                active: product.active
            });

            // Update group price to lowest available variant price
            if (product.price < groups[key].price) {
                groups[key].price = product.price;
                groups[key].discountPrice = product.discountPrice;
            }
        }
    });

    return Object.values(groups);
};
