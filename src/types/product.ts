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

export type RiskVerdict =
  | "Recommended"
  | "Low Risk"
  | "Use With Caution"
  | "Not Recommended";

export type RiskSeverity = "low" | "moderate" | "high" | "critical";

export type RiskFinding = {
  id: string;
  condition: string;
  title: string;
  explanation: string;
  severity: RiskSeverity;
  points: number;
  category:
    | "allergen"
    | "sodium"
    | "potassium"
    | "phosphorus"
    | "sugar"
    | "fat"
    | "purine"
    | "caffeine"
    | "ingredient";
  detectedValue?: string;
  matchedIngredients?: string[];
  redFlag?: boolean;
};

export type RiskResult = {
  score: number;
  verdict: RiskVerdict;
  findings: RiskFinding[];
  reasons: string[];
  redFlags: string[];
};