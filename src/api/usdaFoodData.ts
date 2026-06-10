import { NormalizedProduct } from "../types/product";

const USDA_BASE_URL =
  "https://api.nal.usda.gov/fdc/v1";

const REQUEST_TIMEOUT_MS = 10000;

type UsdaNutrient = {
  nutrientName?: string;
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  ingredients?: string;
  foodNutrients?: UsdaNutrient[];
};

function withTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout);
  });
}

function normalizeBarcode(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function findNutrient(
  nutrients: UsdaNutrient[] = [],
  names: string[]
): UsdaNutrient | undefined {
  return nutrients.find((nutrient) => {
    const nutrientName = String(
      nutrient.nutrientName || ""
    ).toLowerCase();

    return names.some((name) =>
      nutrientName.includes(name.toLowerCase())
    );
  });
}

function nutrientValue(
  nutrients: UsdaNutrient[],
  names: string[]
): number | undefined {
  const nutrient = findNutrient(nutrients, names);
  const value = Number(nutrient?.value);

  return Number.isFinite(value) ? value : undefined;
}

function milligramsToGrams(
  value: number | undefined
): number | undefined {
  return value == null ? undefined : value / 1000;
}

export async function fetchFromUsda(
  barcode: string
): Promise<NormalizedProduct | null> {
  const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY;

  if (!apiKey) {
    console.warn(
      "USDA lookup skipped: EXPO_PUBLIC_USDA_API_KEY is missing."
    );
    return null;
  }

  const response = await withTimeout(
    `${USDA_BASE_URL}/foods/search?api_key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: barcode,
        dataType: ["Branded"],
        pageSize: 15,
        pageNumber: 1,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `USDA FoodData Central request failed: ${response.status}`
    );
  }

  const data = await response.json();
  const foods: UsdaFood[] = Array.isArray(data?.foods)
    ? data.foods
    : [];

  const requestedBarcode = normalizeBarcode(barcode);

  const exactMatch =
    foods.find(
      (food) =>
        normalizeBarcode(food.gtinUpc) === requestedBarcode
    ) || foods[0];

  if (!exactMatch) {
    return null;
  }

  const nutrients = exactMatch.foodNutrients || [];

  const sodiumMg = nutrientValue(nutrients, ["sodium"]);
  const potassiumMg = nutrientValue(nutrients, ["potassium"]);

  const sugarsG = nutrientValue(nutrients, [
    "total sugars",
    "sugars, total",
  ]);

  const carbohydratesG = nutrientValue(nutrients, [
    "carbohydrate",
  ]);

  const proteinG = nutrientValue(nutrients, ["protein"]);

  const fatG = nutrientValue(nutrients, [
    "total lipid",
    "total fat",
  ]);

  const saturatedFatG = nutrientValue(nutrients, [
    "fatty acids, total saturated",
    "saturated fat",
  ]);

  const calories = nutrientValue(nutrients, [
    "energy",
  ]);

  const sodiumG = milligramsToGrams(sodiumMg);

  return {
    barcode: String(exactMatch.gtinUpc || barcode),
    name: String(
      exactMatch.description || "Unknown product"
    ),
    brand: String(
      exactMatch.brandName ||
        exactMatch.brandOwner ||
        ""
    ),
    ingredients: String(exactMatch.ingredients || ""),
    image: null,
    source: "USDA FoodData Central",
    nutriments: {
      sodium_100g: sodiumG,
      salt_100g:
        sodiumG == null ? undefined : sodiumG * 2.5,
      potassium_100g: milligramsToGrams(potassiumMg),
      sugars_100g: sugarsG,
      carbohydrates_100g: carbohydratesG,
      proteins_100g: proteinG,
      fat_100g: fatG,
      "saturated-fat_100g": saturatedFatG,
      energy_kcal_100g: calories,
    },
  };
}