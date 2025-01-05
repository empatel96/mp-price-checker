import { processVariants, getBestVariants } from './handle-data.mjs';

const createHtml = (variants) => {
  let resultHTML = '<h2>Best Products with Lowest Price:</h2>';
  variants.forEach((variant) => {
    resultHTML += `
        <p><strong>${variant.title}</strong> (SKU: ${variant.sku})</p>
        <p>Price: £${variant.total}</p>
        <p>Price per unit: £${variant.pricePerUnit}</p>
        <p>Stock: ${variant.inStock}</p>
        <img src="${variant.images.original}" alt="${variant.title}" height="50" />
        <hr>
      `;
  });
  document.getElementById('result').innerHTML = resultHTML; // Moved outside the loop
};

document
  .getElementById('checkPriceButton')
  .addEventListener('click', function () {
    const sku = document.getElementById('sku').value.trim();

    // Check if SKU is entered
    if (!sku) {
      alert('Please enter a valid SKU.');
      return;
    }
    document.getElementById('result').innerHTML = '<p>Loading...</p>';

    const cachedData = sessionStorage.getItem(sku);
    if (cachedData) {
      const bestVariants = JSON.parse(cachedData);
      createHtml(bestVariants);
      return;
    }

    fetch(
      'https://ycm8zcsfi7.execute-api.eu-west-2.amazonaws.com/get-mp-price?sku=' +
        sku
    )
      .then((response) => response.json())
      .then((data) => {
        const variants = data.data.product.variants;
        if (!variants || variants.length === 0) {
          document.getElementById('result').innerHTML =
            '<p>No products found.</p>';
          return;
        }
        const processedVariants = processVariants(variants);
        const bestVariants = getBestVariants(processedVariants);
        createHtml(bestVariants);
        // sessionStorage.setItem('bestVariants', JSON.stringify(bestVariants));
        sessionStorage.setItem(sku, JSON.stringify(bestVariants));
      })
      .catch((error) => {
        console.error('Error:', error);
        document.getElementById('result').innerHTML =
          '<p>Failed to fetch data. Please try again later.</p>';
      });
  });

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
