export type IngredientRisk = {
  keywords: string[];
  riskType: "potassium" | "phosphorus" | "sodium" | "sugar" | "gout" | "allergen";
  conditions: string[];
  severity: "low" | "moderate" | "high";
  message: string;
};

export const ingredientKnowledgeBase: IngredientRisk[] = [
  // POTASSIUM
  {
    keywords: ["banana", "banana puree", "banana powder", "dried banana"],
    riskType: "potassium",
    conditions: ["kidney"],
    severity: "moderate",
    message:
      "Banana is naturally high in potassium, which may be risky for people with kidney disease who need to limit potassium.",
  },
  {
    keywords: ["potato", "potato starch", "potato flakes"],
    riskType: "potassium",
    conditions: ["kidney"],
    severity: "moderate",
    message:
      "Potato-based ingredients may contribute potassium, which can be a concern for kidney disease.",
  },
  {
    keywords: ["tomato paste", "tomato concentrate", "tomato puree"],
    riskType: "potassium",
    conditions: ["kidney"],
    severity: "moderate",
    message:
      "Concentrated tomato ingredients may be higher in potassium.",
  },
  {
    keywords: ["potassium chloride"],
    riskType: "potassium",
    conditions: ["kidney", "heart", "hypertension"],
    severity: "high",
    message:
      "Potassium chloride is often used as a salt substitute and can significantly increase potassium intake.",
  },

  // PHOSPHORUS / PHOSPHATES
  {
    keywords: [
      "phosphoric acid",
      "sodium phosphate",
      "calcium phosphate",
      "potassium phosphate",
      "pyrophosphate",
      "triphosphate",
      "polyphosphate",
    ],
    riskType: "phosphorus",
    conditions: ["kidney"],
    severity: "high",
    message:
      "Phosphate additives are highly absorbable and may raise phosphorus levels in people with kidney disease.",
  },

  // SODIUM
  {
    keywords: ["salt", "sodium chloride"],
    riskType: "sodium",
    conditions: ["kidney", "hypertension", "heart"],
    severity: "high",
    message:
      "Salt adds sodium, which may increase blood pressure and fluid retention.",
  },
  {
    keywords: ["monosodium glutamate", "msg"],
    riskType: "sodium",
    conditions: ["kidney", "hypertension", "heart"],
    severity: "moderate",
    message:
      "MSG contains sodium and may contribute to overall sodium intake.",
  },
  {
    keywords: ["sodium benzoate", "sodium bicarbonate", "baking soda"],
    riskType: "sodium",
    conditions: ["kidney", "hypertension", "heart"],
    severity: "moderate",
    message:
      "This ingredient contains sodium and may contribute to total sodium intake.",
  },

  // SUGAR / DIABETES
  {
    keywords: [
      "sugar",
      "glucose syrup",
      "corn syrup",
      "fructose",
      "dextrose",
      "maltodextrin",
      "invert sugar",
    ],
    riskType: "sugar",
    conditions: ["diabetes"],
    severity: "moderate",
    message:
      "Added sugars or fast-digesting carbohydrates may raise blood glucose levels.",
  },

  // GOUT
  {
    keywords: ["yeast extract", "meat extract", "anchovy", "sardine"],
    riskType: "gout",
    conditions: ["gout"],
    severity: "moderate",
    message:
      "This ingredient may be higher in purines, which can be a concern for gout.",
  },
];