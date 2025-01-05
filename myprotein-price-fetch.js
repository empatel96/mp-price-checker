const readline = require('readline');
const axios = require('axios');
const { response } = require('express');

// Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Prompt the user to enter SKU
rl.question('Please enter the SKU: ', (sku) => {
  const requestBody = {
    operationName: 'ProductVariants',
    variables: {
      sku: sku, // Use the user-provided SKU
      currency: 'GBP',
      shippingDestination: 'GB',
      buyNowPayLater: false,
      enableWishlist: false,
      hasSubscriptions: true,
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    Accept: '*/*',
    Host: 'www.myprotein.com',
  };

  // Send the request to MyProtein API
  axios
    .post(
      'https://www.myprotein.com/api/operation/ProductVariants/',
      requestBody,
      { headers }
    )
    .then((response) => {
      const variants = response.data?.data?.product?.variants || [];
      if (!variants.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'No variants found' }),
        };
      }

      // Process variants to calculate price per unit
      const productsWithPrice = variants
        .map((variant) => {
          const title = variant.title;
          const priceAmount = parseFloat(variant.price.price.amount);
          const weightMatch = variant.choices.find(
            (choice) => choice.optionKey === 'Amount'
          );

          let weight = 0;
          let pricePerServing = 0;

          if (weightMatch) {
            const amountKey = weightMatch.key.toLowerCase();
            const numericValue = parseFloat(amountKey.replace(/[^\d.]/g, ''));

            if (
              amountKey.includes('servings') ||
              amountKey.includes('tablets')
            ) {
              // Calculate price per serving
              const servings = numericValue || 1; // Default to 1 if parsing fails
              pricePerServing = priceAmount / servings;
              return {
                title,
                total: priceAmount,
                sku: variant.sku,
                servings,
                pricePerUnit: pricePerServing.toFixed(2),
                inStock: variant.inStock ? 'Yes' : 'No',
              };
            } else if (amountKey.includes('kg') || amountKey.includes('g')) {
              // Calculate price per kg
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
              sku: variant.sku,
              weight,
              pricePerUnit: pricePerKg.toFixed(2),
              inStock: variant.inStock ? 'Yes' : 'No',
            };
          }

          return null; // Filter out invalid entries later
        })
        .filter(Boolean); // Remove null entries

      // Find the best price per unit
      const bestVariants = productsWithPrice.sort(
        (a, b) => parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit)
      );

      const bestPrice = bestVariants[0]?.pricePerUnit;
      const filteredBestVariants = bestVariants.filter(
        (v) => v.pricePerUnit === bestPrice
      );

      console.log('Best Products with Lowest Price:', filteredBestVariants);

      // Close the readline interface after processing
      rl.close();
    })
    .catch((error) => {
      console.error('Error:', error);
      rl.close(); // Close the readline interface in case of error
    });
});
