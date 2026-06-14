export type ProductSource = "Open Food Facts";

export type NormalizedProduct = {
  barcode: string;
  name: string;
  brand: string;
  ingredients: string;
  image: string | null;
  source: ProductSource;
  nutriments: {
    sodium_100g?: number;
    salt_100g?: number;
    potassium_100g?: number;
    sugars_100g?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    fat_100g?: number;
    "saturated-fat_100g"?: number;
    energy_kcal_100g?: number;
  };
};