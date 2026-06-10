export type IngredientRule = {
  id: string;
  names: string[];
};

export const PHOSPHATE_RULES: IngredientRule[] = [
  {
    id: "phosphoric-acid",
    names: ["phosphoric acid", "e338", "e 338"],
  },
  {
    id: "sodium-phosphates",
    names: [
      "sodium phosphate",
      "monosodium phosphate",
      "disodium phosphate",
      "trisodium phosphate",
      "e339",
      "e 339",
    ],
  },
  {
    id: "potassium-phosphates",
    names: [
      "potassium phosphate",
      "monopotassium phosphate",
      "dipotassium phosphate",
      "tripotassium phosphate",
      "e340",
      "e 340",
    ],
  },
  {
    id: "calcium-phosphates",
    names: [
      "calcium phosphate",
      "monocalcium phosphate",
      "dicalcium phosphate",
      "tricalcium phosphate",
      "e341",
      "e 341",
    ],
  },
  {
    id: "magnesium-phosphates",
    names: ["magnesium phosphate", "e343", "e 343"],
  },
  {
    id: "diphosphates",
    names: [
      "diphosphate",
      "pyrophosphate",
      "sodium acid pyrophosphate",
      "e450",
      "e 450",
    ],
  },
  {
    id: "triphosphates",
    names: ["triphosphate", "e451", "e 451"],
  },
  {
    id: "polyphosphates",
    names: [
      "polyphosphate",
      "hexametaphosphate",
      "sodium hexametaphosphate",
      "e452",
      "e 452",
    ],
  },
];

export const POTASSIUM_ADDITIVE_RULES: IngredientRule[] = [
  {
    id: "potassium-chloride",
    names: ["potassium chloride", "e508", "e 508"],
  },
  {
    id: "potassium-citrate",
    names: [
      "potassium citrate",
      "tripotassium citrate",
      "e332",
      "e 332",
    ],
  },
  {
    id: "potassium-bicarbonate",
    names: ["potassium bicarbonate", "e501", "e 501"],
  },
  {
    id: "potassium-lactate",
    names: ["potassium lactate", "e326", "e 326"],
  },
  {
    id: "potassium-phosphate",
    names: [
      "potassium phosphate",
      "monopotassium phosphate",
      "dipotassium phosphate",
      "tripotassium phosphate",
      "e340",
      "e 340",
    ],
  },
];

export const SODIUM_INGREDIENT_RULES: IngredientRule[] = [
  {
    id: "salt",
    names: [
      "salt",
      "sea salt",
      "table salt",
      "sodium chloride",
      "brine",
    ],
  },
  {
    id: "msg",
    names: [
      "monosodium glutamate",
      "msg",
      "flavour enhancer 621",
      "flavor enhancer 621",
      "e621",
      "e 621",
    ],
  },
  {
    id: "sodium-bicarbonate",
    names: [
      "sodium bicarbonate",
      "bicarbonate of soda",
      "baking soda",
      "e500",
      "e 500",
    ],
  },
  {
    id: "sodium-benzoate",
    names: ["sodium benzoate", "e211", "e 211"],
  },
  {
    id: "sodium-nitrite",
    names: ["sodium nitrite", "e250", "e 250"],
  },
  {
    id: "sodium-nitrate",
    names: ["sodium nitrate", "e251", "e 251"],
  },
  {
    id: "stock",
    names: [
      "stock powder",
      "stock cube",
      "bouillon",
      "seasoning salt",
      "soy sauce",
    ],
  },
];

export const ADDED_SUGAR_RULES: IngredientRule[] = [
  {
    id: "sugar",
    names: [
      "sugar",
      "cane sugar",
      "brown sugar",
      "raw sugar",
      "caster sugar",
      "icing sugar",
      "sucrose",
    ],
  },
  {
    id: "glucose",
    names: [
      "glucose",
      "glucose syrup",
      "dextrose",
      "dextrose monohydrate",
    ],
  },
  {
    id: "fructose",
    names: [
      "fructose",
      "fructose syrup",
      "high fructose corn syrup",
      "high-fructose corn syrup",
      "hfcs",
    ],
  },
  {
    id: "corn-syrup",
    names: ["corn syrup", "corn syrup solids"],
  },
  {
    id: "malt-sugar",
    names: ["maltose", "malt syrup", "barley malt syrup"],
  },
  {
    id: "maltodextrin",
    names: ["maltodextrin"],
  },
  {
    id: "invert-sugar",
    names: ["invert sugar", "invert syrup"],
  },
  {
    id: "natural-sweeteners",
    names: [
      "honey",
      "agave syrup",
      "maple syrup",
      "golden syrup",
      "molasses",
      "treacle",
    ],
  },
  {
    id: "fruit-concentrate",
    names: [
      "fruit juice concentrate",
      "apple juice concentrate",
      "grape juice concentrate",
    ],
  },
];

export const UNHEALTHY_FAT_RULES: IngredientRule[] = [
  {
    id: "partially-hydrogenated",
    names: [
      "partially hydrogenated oil",
      "partially hydrogenated vegetable oil",
      "partially hydrogenated fat",
    ],
  },
  {
    id: "hydrogenated",
    names: [
      "hydrogenated vegetable oil",
      "hydrogenated vegetable fat",
      "hydrogenated palm oil",
    ],
  },
  {
    id: "shortening",
    names: ["shortening", "vegetable shortening"],
  },
  {
    id: "palm-kernel",
    names: ["palm kernel oil", "palm kernel fat"],
  },
  {
    id: "trans-fat",
    names: ["trans fat", "trans fatty acids"],
  },
];

export const GLUTEN_RULES: IngredientRule[] = [
  {
    id: "wheat",
    names: [
      "wheat",
      "wheat flour",
      "whole wheat",
      "wholewheat",
      "wheat bran",
      "wheat starch",
      "wheat protein",
      "wheat gluten",
      "hydrolysed wheat protein",
      "hydrolyzed wheat protein",
    ],
  },
  {
    id: "gluten",
    names: ["gluten", "vital wheat gluten"],
  },
  {
    id: "barley",
    names: [
      "barley",
      "barley flour",
      "barley malt",
      "malt extract",
      "malt flavouring",
      "malt flavoring",
      "malt vinegar",
    ],
  },
  {
    id: "rye",
    names: ["rye", "rye flour"],
  },
  {
    id: "durum",
    names: ["durum", "durum wheat", "semolina"],
  },
  {
    id: "spelt",
    names: ["spelt", "spelt flour"],
  },
  {
    id: "farina",
    names: ["farina"],
  },
  {
    id: "bulgur",
    names: ["bulgur", "bulgar wheat"],
  },
  {
    id: "couscous",
    names: ["couscous"],
  },
  {
    id: "breadcrumbs",
    names: ["breadcrumbs", "bread crumbs"],
  },
];

export const DAIRY_RULES: IngredientRule[] = [
  {
    id: "milk",
    names: [
      "milk",
      "cow's milk",
      "cows milk",
      "whole milk",
      "skim milk",
      "skimmed milk",
      "milk powder",
      "skim milk powder",
      "skimmed milk powder",
      "milk solids",
      "nonfat milk",
    ],
  },
  {
    id: "whey",
    names: [
      "whey",
      "whey powder",
      "whey protein",
      "whey protein concentrate",
      "whey protein isolate",
    ],
  },
  {
    id: "casein",
    names: [
      "casein",
      "caseinate",
      "sodium caseinate",
      "calcium caseinate",
    ],
  },
  {
    id: "lactose",
    names: ["lactose"],
  },
  {
    id: "butter",
    names: [
      "butter",
      "butterfat",
      "butter oil",
      "milk fat",
      "anhydrous milk fat",
      "ghee",
    ],
  },
  {
    id: "cream",
    names: ["cream", "sour cream", "double cream"],
  },
  {
    id: "cheese",
    names: ["cheese", "cheese powder"],
  },
  {
    id: "yoghurt",
    names: ["yoghurt", "yogurt"],
  },
];

export const PEANUT_RULES: IngredientRule[] = [
  {
    id: "peanut",
    names: [
      "peanut",
      "peanuts",
      "groundnut",
      "groundnuts",
      "ground nut",
      "arachis oil",
      "peanut oil",
      "peanut flour",
      "peanut butter",
    ],
  },
];

export const TREE_NUT_RULES: IngredientRule[] = [
  {
    id: "almond",
    names: ["almond", "almonds", "almond flour", "almond milk"],
  },
  {
    id: "cashew",
    names: ["cashew", "cashews"],
  },
  {
    id: "hazelnut",
    names: ["hazelnut", "hazelnuts", "filbert", "filberts"],
  },
  {
    id: "walnut",
    names: ["walnut", "walnuts"],
  },
  {
    id: "pecan",
    names: ["pecan", "pecans"],
  },
  {
    id: "pistachio",
    names: ["pistachio", "pistachios"],
  },
  {
    id: "macadamia",
    names: ["macadamia", "macadamias", "macadamia nut"],
  },
  {
    id: "brazil-nut",
    names: ["brazil nut", "brazil nuts"],
  },
];

export const HIGH_PURINE_RULES: IngredientRule[] = [
  {
    id: "yeast-extract",
    names: [
      "yeast extract",
      "brewer's yeast",
      "brewers yeast",
      "hydrolysed yeast",
      "hydrolyzed yeast",
    ],
  },
  {
    id: "organ-meat",
    names: [
      "liver",
      "chicken liver",
      "beef liver",
      "kidney meat",
      "organ meat",
      "offal",
      "sweetbreads",
    ],
  },
  {
    id: "oily-fish",
    names: [
      "anchovy",
      "anchovies",
      "sardine",
      "sardines",
      "mackerel",
      "herring",
    ],
  },
  {
    id: "shellfish",
    names: [
      "mussel",
      "mussels",
      "scallop",
      "scallops",
      "prawn",
      "prawns",
      "shrimp",
    ],
  },
];

export const CAFFEINE_RULES: IngredientRule[] = [
  {
    id: "caffeine",
    names: [
      "caffeine",
      "coffee extract",
      "guarana",
      "yerba mate",
      "green tea extract",
      "tea extract",
    ],
  },
];

export function normalizeIngredientText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/[,:;/\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findRuleMatches(
  text: string,
  rules: IngredientRule[]
): string[] {
  const normalizedText = normalizeIngredientText(text);
  const matches = new Set<string>();

  for (const rule of rules) {
    for (const name of rule.names) {
      if (normalizedText.includes(normalizeIngredientText(name))) {
        matches.add(name);
      }
    }
  }

  return [...matches];
}