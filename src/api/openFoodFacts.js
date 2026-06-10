const OPEN_FOOD_FACTS_URL =
  "https://world.openfoodfacts.org/api/v2/product";

const REQUEST_TIMEOUT_MS = 12000;

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function cleanBarcode(value) {
  return String(value || "").replace(/\D/g, "");
}

function getBarcodeVariants(barcode) {
  const clean = cleanBarcode(barcode);
  const variants = new Set();

  if (clean) {
    variants.add(clean);
  }

  if (clean.length === 12) {
    variants.add(`0${clean}`);
  }

  if (clean.length === 13 && clean.startsWith("0")) {
    variants.add(clean.substring(1));
  }

  return [...variants];
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeOpenFoodFactsProduct(barcode, product) {
  const nutriments = product?.nutriments || {};

  return {
    barcode: String(product?.code || barcode),
    name: String(
      product?.product_name ||
        product?.product_name_en ||
        product?.generic_name ||
        "Unknown product"
    ),
    brand: String(product?.brands || ""),
    ingredients: String(
      product?.ingredients_text ||
        product?.ingredients_text_en ||
        ""
    ),
    image:
      product?.image_front_url ||
      product?.image_front_small_url ||
      product?.image_url ||
      null,
    source: "Open Food Facts",
    nutriments: {
      sodium_100g: toOptionalNumber(nutriments.sodium_100g),
      salt_100g: toOptionalNumber(nutriments.salt_100g),
      potassium_100g: toOptionalNumber(
        nutriments.potassium_100g
      ),
      sugars_100g: toOptionalNumber(nutriments.sugars_100g),
      carbohydrates_100g: toOptionalNumber(
        nutriments.carbohydrates_100g
      ),
      proteins_100g: toOptionalNumber(
        nutriments.proteins_100g
      ),
      fat_100g: toOptionalNumber(nutriments.fat_100g),
      "saturated-fat_100g": toOptionalNumber(
        nutriments["saturated-fat_100g"]
      ),
      energy_kcal_100g: toOptionalNumber(
        nutriments["energy-kcal_100g"]
      ),
    },
  };
}

function hasUsefulProductData(product) {
  if (!product) return false;

  return Boolean(
    product.product_name ||
      product.product_name_en ||
      product.generic_name ||
      product.brands ||
      product.ingredients_text ||
      product.ingredients_text_en ||
      product.nutriments ||
      product.image_front_url ||
      product.image_url
  );
}

export async function fetchFromOpenFoodFacts(scannedBarcode) {
  const barcodeVariants = getBarcodeVariants(scannedBarcode);

  if (!barcodeVariants.length) {
    return null;
  }

  const fields = [
    "code",
    "product_name",
    "product_name_en",
    "generic_name",
    "brands",
    "ingredients_text",
    "ingredients_text_en",
    "image_front_url",
    "image_front_small_url",
    "image_url",
    "nutriments",
  ].join(",");

  for (const barcode of barcodeVariants) {
    try {
      const url =
        `${OPEN_FOOD_FACTS_URL}/${encodeURIComponent(barcode)}` +
        `?fields=${encodeURIComponent(fields)}`;

      console.log("Open Food Facts lookup:", url);

      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        console.warn(
          `Open Food Facts returned HTTP ${response.status} for ${barcode}`
        );
        continue;
      }

      const data = await response.json();

      console.log("Open Food Facts response:", {
        barcode,
        status: data?.status,
        statusVerbose: data?.status_verbose,
        hasProduct: Boolean(data?.product),
      });

      const productFound =
        Number(data?.status) === 1 ||
        String(data?.status) === "1" ||
        hasUsefulProductData(data?.product);

      if (!productFound || !data?.product) {
        continue;
      }

      return normalizeOpenFoodFactsProduct(
        barcode,
        data.product
      );
    } catch (error) {
      console.warn(
        `Open Food Facts lookup failed for ${barcode}:`,
        error
      );
    }
  }

  return null;
}

export async function fetchProductByBarcode(barcode) {
  return fetchFromOpenFoodFacts(barcode);
}