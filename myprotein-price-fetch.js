const readline = require('readline');
const axios = require('axios');

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
      const data = response.data;
      const variants = data.data.product.variants;

      let productsWithPricePerKg = [];

      // Loop through each variant to calculate price per kg and store the data
      variants.forEach((variant) => {
        const title = variant.title;
        const priceAmount = parseFloat(variant.price.price.amount);
        const weightMatch = variant.choices.find(
          (choice) => choice.optionKey === 'Amount'
        );

        let weight = 0;
        let pricePerServing = 0;

        // If the Amount is in servings, calculate cost per serving
        if (weightMatch) {
          const amountKey = weightMatch.key.toLowerCase();

          if (amountKey.includes('servings') || amountKey.includes('tablets')) {
            const servings = parseInt(amountKey.replace(/\D/g, ''), 10);
            pricePerServing = priceAmount / servings; // Calculate cost per serving or tablet
            productsWithPricePerKg.push({
              title: title,
              total: priceAmount,
              servings: servings,
              sku: variant.sku,
              pricePerServing: pricePerServing.toFixed(2),
              inStock: variant.inStock ? 'Yes' : 'No',
              pricePerKg: null, // No price per kg in this case
            });
          } else if (amountKey.includes('kg') || amountKey.includes('g')) {
            // If the Amount is in weight format (kg or g), parse as usual
            weight = parseFloat(amountKey.replace(/[^\d\.]/g, '')) || 0;
            if (!amountKey.includes('kg')) weight = weight / 1000; // Convert grams to kg
          }
        }

        // Calculate price per kg for weight-based variants
        if (weight > 0) {
          const pricePerKg = priceAmount / weight;
          productsWithPricePerKg.push({
            title: title,
            total: priceAmount,
            weight: weight,
            sku: variant.sku,
            pricePerKg: pricePerKg.toFixed(2),
            inStock: variant.inStock ? 'Yes' : 'No',
            pricePerServing: null, // No price per serving in this case
          });
        }
      });

      // Now, filter the best variants by price per kg or per serving
      const bestVariants = productsWithPricePerKg
        .map((variant) => {
          // We will consider price per kg and price per serving separately
          const price = parseFloat(
            variant.pricePerKg || variant.pricePerServing
          );
          return { ...variant, pricePerUnit: price };
        })
        .sort((a, b) => a.pricePerUnit - b.pricePerUnit); // Sort by the lowest price (either per kg or per serving)

      // We are now simply filtering out the lowest price
      const bestPrice = bestVariants[0].pricePerUnit; // Best price per kg or per serving

      const filteredBestVariants = bestVariants.filter(
        (v) => v.pricePerUnit === bestPrice
      );

      // Log filtered best variants
      console.log('Best Products with Lowest Price:', filteredBestVariants);

      // Close the readline interface after processing
      rl.close();
    })
    .catch((error) => {
      console.error('Error:', error);
      rl.close(); // Close the readline interface in case of error
    });
});
