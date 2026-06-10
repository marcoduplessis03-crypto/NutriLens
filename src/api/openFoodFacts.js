export async function fetchProductByBarcode(barcode) {
  try {
    const cleanBarcode = String(barcode || "").trim();

    if (!cleanBarcode) {
      return null;
    }

    const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NutriLens - Food scanner app",
      },
    });

    if (!response.ok) {
      console.log("Open Food Facts error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;

    return {
      name: product.product_name || product.product_name_en || "Unknown product",
      brand: product.brands || "",
      ingredients: product.ingredients_text || product.ingredients_text_en || "",
      nutriments: product.nutriments || {},
      image:
        product.image_front_url ||
        product.image_url ||
        product.selected_images?.front?.display?.en ||
        null,
    };
  } catch (error) {
    console.log("fetchProductByBarcode failed:", error);
    return null;
  }
}