export async function fetchProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not connect to Open Food Facts");
  }

  const data = await response.json();

  if (data.status !== 1) {
    return null;
  }

  const product = data.product;

  return {
    barcode,
    name: product.product_name || "Unknown product",
    brand: product.brands || "Unknown brand",
    image: product.image_front_url || product.image_url || null,
    ingredients:
      product.ingredients_text_en ||
      product.ingredients_text ||
      "No ingredients listed",
    allergens: product.allergens_tags || [],
    nutriments: product.nutriments || {},
    novaGroup: product.nova_group || null,
    nutriScore: product.nutriscore_grade || null,
  };
}