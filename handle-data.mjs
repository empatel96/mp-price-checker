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
        console.log(amountKey);

        if (amountKey.includes('kg') || amountKey.includes('g')) {
          // Extract only the weight part from the key
          const weightMatch = amountKey.match(/(\d+\.?\d*)\s?(kg|g)/i);

          if (weightMatch) {
            const weightValue = parseFloat(weightMatch[1]); // Extract the numeric value
            const weightUnit = weightMatch[2].toLowerCase(); // Extract the unit (kg or g)

            // Convert grams to kilograms if needed
            weight = weightUnit === 'kg' ? weightValue : weightValue / 1000;
          }
        } else if (
          amountKey.includes('servings') ||
          amountKey.includes('tablets')
        ) {
          const servings = numericValue || 1;
          pricePerServing = priceAmount / servings;
          return {
            title,
            total: priceAmount,
            servings,
            sku: variant.sku,
            pricePerUnit: pricePerServing.toFixed(2),
            unit: amountKey.includes('servings') ? 'serving' : 'tablet',
            inStock: inStock ? 'Yes' : 'No',
            images: getImage(variant),
          };
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
          unit: 'kg',
          inStock: inStock ? 'Yes' : 'No',
          images: getImage(variant),
        };
      }

      return null;
    })
    .filter(Boolean);
};

export const extractSku = (url) => {
  const regex = /\/(\d+)(?:\/|\?|$)/; // Match digits followed by /, ?, or end of string
  const match = url.match(regex);
  return match ? match[1] : null; // Return the first captured group or null
};

export const identifyInput = (input) => {
  const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/; // Match valid URLs
  const skuRegex = /^\d+$/; // Match only numeric input

  if (urlRegex.test(input)) {
    return 'url';
  } else if (skuRegex.test(input)) {
    return 'sku';
  } else {
    return 'invalid';
  }
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
