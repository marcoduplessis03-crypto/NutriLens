import type { NormalizedProduct } from "./productLookup";

const OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.org/api/v2/product";

type OpenFoodFactsApiResponse = {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    image_url?: string;
    image_front_url?: string;
    nutriments?: Record<string, unknown>;
  };
};

function cleanBarcode(barcode: string): string {
  return barcode.replace(/\D/g, "").trim();
}

function getBarcodeVariants(barcode: string): string[] {
  const cleaned = cleanBarcode(barcode);
  const variants = new Set<string>();

  if (cleaned) variants.add(cleaned);
  if (cleaned.length === 13 && cleaned.startsWith("0")) variants.add(cleaned.slice(1));
  if (cleaned.length === 12) variants.add(`0${cleaned}`);

  return Array.from(variants);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

async function fetchWithTimeout(url: string, timeoutMs = 9000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeOpenFoodFactsProduct(
  barcode: string,
  data: OpenFoodFactsApiResponse
): NormalizedProduct | null {
  if (!data.product) return null;

  const product = data.product;
  const nutriments = product.nutriments ?? {};

  return {
    barcode,
    name: product.product_name || product.product_name_en || product.generic_name || "Unknown product",
    brand: product.brands || "",
    ingredients: product.ingredients_text || product.ingredients_text_en || "",
    image: product.image_url || product.image_front_url || null,
    source: "Open Food Facts" as const,
    nutriments: {
      sodium_100g: toOptionalNumber(nutriments.sodium_100g),
      salt_100g: toOptionalNumber(nutriments.salt_100g),
      potassium_100g: toOptionalNumber(nutriments.potassium_100g),
      sugars_100g: toOptionalNumber(nutriments.sugars_100g),
      carbohydrates_100g: toOptionalNumber(nutriments.carbohydrates_100g),
      proteins_100g: toOptionalNumber(nutriments.proteins_100g),
      fat_100g: toOptionalNumber(nutriments.fat_100g),
      "saturated-fat_100g": toOptionalNumber(nutriments["saturated-fat_100g"]),
      energy_kcal_100g: toOptionalNumber(nutriments["energy-kcal_100g"] ?? nutriments.energy_kcal_100g),
    },
  };
}

export async function lookupOpenFoodFactsProduct(barcode: string): Promise<NormalizedProduct | null> {
  const barcodeVariants = getBarcodeVariants(barcode);

  for (const barcodeVariant of barcodeVariants) {
    try {
      const fields = [
        "product_name",
        "product_name_en",
        "generic_name",
        "brands",
        "ingredients_text",
        "ingredients_text_en",
        "image_url",
        "image_front_url",
        "nutriments",
      ].join(",");

      const url = `${OPEN_FOOD_FACTS_BASE_URL}/${barcodeVariant}.json?fields=${fields}`;
      const response = await fetchWithTimeout(url);

      if (!response.ok) continue;

      const data = (await response.json()) as OpenFoodFactsApiResponse;
      if (data.status !== 1) continue;

      const normalizedProduct = normalizeOpenFoodFactsProduct(barcodeVariant, data);
      if (normalizedProduct) return normalizedProduct;
    } catch (error) {
      console.log("Open Food Facts lookup failed:", error);
    }
  }

  return null;
}
