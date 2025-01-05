import { createInterface } from 'readline';
import { post } from 'axios';
import { processVariants, getBestVariants } from './handle-data.mjs';

// Set up readline interface for user input
const rl = createInterface({
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
  post(
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

      const processedVariants = processVariants(variants);
      const bestVariants = getBestVariants(processedVariants);

      console.log('Best Products with Lowest Price:', bestVariants);

      // Close the readline interface after processing
      rl.close();
    })
    .catch((error) => {
      console.error('Error:', error);
      rl.close(); // Close the readline interface in case of error
    });
});
