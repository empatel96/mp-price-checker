export const getBestVariants = (variants) => {
  let bestPrice = Infinity;
  return variants.reduce((bestVariants, variant) => {
    const pricePerUnit = parseFloat(variant.pricePerUnit);
    if (pricePerUnit < bestPrice) {
      bestPrice = pricePerUnit;
      return [variant]; // Replace with the new best variant
    }
    if (pricePerUnit === bestPrice) {
      bestVariants.push(variant); // Add variant with the same best price
    }
    return bestVariants;
  }, []);
};

export const processVariants = (variants) => {
  return variants
    .map((variant) => {
      const { title, price, choices, inStock, product, images } = variant;
      const priceAmount = parseFloat(price.price.amount);
      const weightMatch = choices.find(
        (choice) => choice.optionKey === 'Amount'
      );

      let weight = 0;
      let pricePerServing = 0;

      if (weightMatch) {
        const amountKey = weightMatch.key.toLowerCase();
        const numericValue = parseFloat(amountKey.replace(/[^\d.]/g, ''));

        if (amountKey.includes('servings') || amountKey.includes('tablets')) {
          const servings = numericValue || 1;
          pricePerServing = priceAmount / servings;
          return {
            title,
            total: priceAmount,
            servings,
            sku: variant.sku,
            pricePerUnit: pricePerServing.toFixed(2),
            inStock: inStock ? 'Yes' : 'No',
            images: getImage(variant),
          };
        } else if (amountKey.includes('kg') || amountKey.includes('g')) {
          weight = amountKey.includes('kg')
            ? numericValue
            : numericValue / 1000;
        }
      }

      if (weight > 0) {
        const pricePerKg = priceAmount / weight;
        return {
          title,
          total: priceAmount,
          weight,
          sku: variant.sku,
          pricePerUnit: pricePerKg.toFixed(2),
          inStock: inStock ? 'Yes' : 'No',
          images: getImage(variant),
        };
      }

      return null;
    })
    .filter(Boolean);
};

const getImage = (product) => {
  return (
    (product.images && product.images.length > 0
      ? product.images[0]
      : product.product &&
        product.product.images &&
        product.product.images[0]) || {
      original:
        'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg',
    }
  );
};
