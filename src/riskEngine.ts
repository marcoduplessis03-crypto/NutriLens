import {
  ADDED_SUGAR_RULES,
  CAFFEINE_RULES,
  DAIRY_RULES,
  findRuleMatches,
  GLUTEN_RULES,
  HIGH_PURINE_RULES,
  normalizeIngredientText,
  PEANUT_RULES,
  PHOSPHATE_RULES,
  POTASSIUM_ADDITIVE_RULES,
  SODIUM_INGREDIENT_RULES,
  TREE_NUT_RULES,
  UNHEALTHY_FAT_RULES,
} from "./ingredientRules";

import {
  RiskFinding,
  RiskResult,
  RiskSeverity,
  RiskVerdict,
} from "./types/product";

function hasCondition(conditions: string[], terms: string[]): boolean {
  return conditions.some((condition) =>
    terms.some((term) => condition.includes(term))
  );
}

function severityWeight(severity: RiskSeverity): number {
  if (severity === "critical") return 100;
  if (severity === "high") return 45;
  if (severity === "moderate") return 25;
  return 10;
}

function createFinding(
  finding: Omit<RiskFinding, "points"> & { points?: number }
): RiskFinding {
  return {
    ...finding,
    points: finding.points ?? severityWeight(finding.severity),
  };
}

function uniqueFindings(findings: RiskFinding[]): RiskFinding[] {
  const map = new Map<string, RiskFinding>();

  for (const finding of findings) {
    const key = `${finding.condition}|${finding.category}|${finding.title}`;
    const existing = map.get(key);

    if (!existing || finding.points > existing.points) {
      map.set(key, finding);
    }
  }

  return [...map.values()];
}

function round(value: number, decimals = 1): number {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

export function calculateRisk(
  product: any,
  selectedConditions: string[] = []
): RiskResult {
  const findings: RiskFinding[] = [];

  const conditions = selectedConditions.map((condition) =>
    condition.toLowerCase().trim()
  );

  const ingredientsText = normalizeIngredientText(
    product?.ingredients_text || product?.ingredients || ""
  );

  const productName = normalizeIngredientText(
    product?.product_name || product?.name || ""
  );

  const searchableText = `${productName} ${ingredientsText}`;

  const nutriments = product?.nutriments || {};

  const sodiumG = Number(nutriments.sodium_100g) || 0;
  const sodiumMg = sodiumG * 1000;

  const saltG =
    Number(nutriments.salt_100g) ||
    (sodiumG > 0 ? sodiumG * 2.5 : 0);

  const potassiumG = Number(nutriments.potassium_100g) || 0;
  const potassiumMg = potassiumG * 1000;

  const sugarsG = Number(nutriments.sugars_100g) || 0;
  const saturatedFatG =
    Number(nutriments["saturated-fat_100g"]) || 0;

  const hasKidney = hasCondition(conditions, [
    "kidney",
    "renal",
    "ckd",
    "dialysis",
  ]);

  const hasHypertension = hasCondition(conditions, [
    "hypertension",
    "high blood pressure",
  ]);

  const hasDiabetes = hasCondition(conditions, [
    "diabetes",
    "diabetic",
    "blood sugar",
  ]);

  const hasHeartDisease = hasCondition(conditions, [
    "heart",
    "cardiovascular",
    "cardiac",
  ]);

  const hasGout = hasCondition(conditions, ["gout"]);

  const hasGlutenAllergy = hasCondition(conditions, [
    "gluten",
    "coeliac",
    "celiac",
    "wheat allergy",
  ]);

  const hasDairyAllergy = hasCondition(conditions, [
    "dairy",
    "milk allergy",
  ]);

  const hasNutAllergy = hasCondition(conditions, [
    "nut allergy",
    "peanut allergy",
    "tree nut allergy",
  ]);

  const phosphateMatches = findRuleMatches(
    searchableText,
    PHOSPHATE_RULES
  );

  const potassiumAdditiveMatches = findRuleMatches(
    searchableText,
    POTASSIUM_ADDITIVE_RULES
  );

  const sodiumIngredientMatches = findRuleMatches(
    searchableText,
    SODIUM_INGREDIENT_RULES
  );

  const sugarMatches = findRuleMatches(
    searchableText,
    ADDED_SUGAR_RULES
  );

  const unhealthyFatMatches = findRuleMatches(
    searchableText,
    UNHEALTHY_FAT_RULES
  );

  const glutenMatches = findRuleMatches(
    searchableText,
    GLUTEN_RULES
  );

  const dairyMatches = findRuleMatches(
    searchableText,
    DAIRY_RULES
  );

  const peanutMatches = findRuleMatches(
    searchableText,
    PEANUT_RULES
  );

  const treeNutMatches = findRuleMatches(
    searchableText,
    TREE_NUT_RULES
  );

  const purineMatches = findRuleMatches(
    searchableText,
    HIGH_PURINE_RULES
  );

  const caffeineMatches = findRuleMatches(
    searchableText,
    CAFFEINE_RULES
  );

  /*
   * ALLERGIES
   *
   * Direct allergen matches are treated as red flags.
   * They must never produce a zero score.
   */

  if (hasGlutenAllergy && glutenMatches.length > 0) {
    findings.push(
      createFinding({
        id: "gluten-allergen",
        condition: "Gluten Allergy",
        category: "allergen",
        severity: "critical",
        title: "Gluten-containing ingredient detected",
        explanation:
          "This product appears to contain wheat, barley, rye, malt or another gluten-containing ingredient. Avoid the product if you have a diagnosed gluten allergy or coeliac disease unless the packaging specifically confirms it is safe.",
        matchedIngredients: glutenMatches,
        points: 100,
        redFlag: true,
      })
    );
  }

  if (hasDairyAllergy && dairyMatches.length > 0) {
    findings.push(
      createFinding({
        id: "dairy-allergen",
        condition: "Dairy Allergy",
        category: "allergen",
        severity: "critical",
        title: "Dairy ingredient detected",
        explanation:
          "This product appears to contain milk, whey, casein, lactose, butter or another dairy-derived ingredient.",
        matchedIngredients: dairyMatches,
        points: 100,
        redFlag: true,
      })
    );
  }

  if (
    hasNutAllergy &&
    (peanutMatches.length > 0 || treeNutMatches.length > 0)
  ) {
    const matches = [...peanutMatches, ...treeNutMatches];

    findings.push(
      createFinding({
        id: "nut-allergen",
        condition: "Nut Allergy",
        category: "allergen",
        severity: "critical",
        title: "Peanut or tree-nut ingredient detected",
        explanation:
          "This product appears to contain peanuts or tree nuts. Avoid it if these ingredients are part of your diagnosed allergy.",
        matchedIngredients: matches,
        points: 100,
        redFlag: true,
      })
    );
  }

  /*
   * KIDNEY DISEASE
   */

  if (hasKidney) {
    if (phosphateMatches.length > 0) {
      findings.push(
        createFinding({
          id: "kidney-phosphate",
          condition: "Kidney Disease",
          category: "phosphorus",
          severity: "high",
          title: "Phosphate additive detected",
          explanation:
            "Added phosphates are readily absorbed and may make phosphorus control more difficult for people with kidney disease.",
          matchedIngredients: phosphateMatches,
          points: 45,
          redFlag: true,
        })
      );
    }

    if (potassiumAdditiveMatches.length > 0) {
      findings.push(
        createFinding({
          id: "kidney-potassium-additive",
          condition: "Kidney Disease",
          category: "potassium",
          severity: "high",
          title: "Potassium additive detected",
          explanation:
            "Potassium-based additives can substantially increase potassium intake and may be unsafe for people who have been instructed to restrict potassium.",
          matchedIngredients: potassiumAdditiveMatches,
          points: 45,
          redFlag: true,
        })
      );
    }

    if (potassiumMg >= 500) {
      findings.push(
        createFinding({
          id: "kidney-potassium-high",
          condition: "Kidney Disease",
          category: "potassium",
          severity: "high",
          title: "High potassium level",
          explanation:
            "The listed potassium value is high and may be unsuitable for a potassium-restricted diet.",
          detectedValue: `${Math.round(potassiumMg)} mg per 100 g`,
          points: 40,
        })
      );
    } else if (potassiumMg >= 300) {
      findings.push(
        createFinding({
          id: "kidney-potassium-moderate",
          condition: "Kidney Disease",
          category: "potassium",
          severity: "moderate",
          title: "Elevated potassium level",
          explanation:
            "This product contains a notable amount of potassium. Portion size and your prescribed potassium allowance matter.",
          detectedValue: `${Math.round(potassiumMg)} mg per 100 g`,
          points: 25,
        })
      );
    }

    if (sodiumMg >= 600 || saltG >= 1.5) {
      findings.push(
        createFinding({
          id: "kidney-sodium-high",
          condition: "Kidney Disease",
          category: "sodium",
          severity: "high",
          title: "High sodium content",
          explanation:
            "High sodium intake may increase thirst, fluid retention and blood pressure.",
          detectedValue: `${Math.round(sodiumMg)} mg sodium per 100 g`,
          points: 25,
        })
      );
    } else if (
      sodiumMg >= 400 ||
      saltG >= 1 ||
      sodiumIngredientMatches.length > 0
    ) {
      findings.push(
        createFinding({
          id: "kidney-sodium-moderate",
          condition: "Kidney Disease",
          category: "sodium",
          severity: "moderate",
          title: "Sodium or salty ingredient detected",
          explanation:
            "This product may contribute meaningfully to daily sodium intake.",
          detectedValue:
            sodiumMg > 0
              ? `${Math.round(sodiumMg)} mg sodium per 100 g`
              : undefined,
          matchedIngredients: sodiumIngredientMatches,
          points: 20,
        })
      );
    }
  }

  /*
   * HYPERTENSION
   */

  if (hasHypertension) {
    if (sodiumMg >= 800 || saltG >= 2) {
      findings.push(
        createFinding({
          id: "hypertension-sodium-very-high",
          condition: "Hypertension",
          category: "sodium",
          severity: "high",
          title: "Very high sodium content",
          explanation:
            "This level of sodium may make blood-pressure control more difficult.",
          detectedValue: `${Math.round(sodiumMg)} mg sodium per 100 g`,
          points: 30,
          redFlag: true,
        })
      );
    } else if (
      sodiumMg >= 400 ||
      saltG >= 1 ||
      sodiumIngredientMatches.length > 0
    ) {
      findings.push(
        createFinding({
          id: "hypertension-sodium-high",
          condition: "Hypertension",
          category: "sodium",
          severity: "moderate",
          title: "High sodium or salt detected",
          explanation:
            "Sodium can raise blood pressure. Consider portion size and lower-sodium alternatives.",
          detectedValue:
            sodiumMg > 0
              ? `${Math.round(sodiumMg)} mg sodium per 100 g`
              : undefined,
          matchedIngredients: sodiumIngredientMatches,
          points: 20,
        })
      );
    }

    if (caffeineMatches.length > 0) {
      findings.push(
        createFinding({
          id: "hypertension-caffeine",
          condition: "Hypertension",
          category: "caffeine",
          severity: "low",
          title: "Caffeine detected",
          explanation:
            "Caffeine may temporarily raise blood pressure in some people.",
          matchedIngredients: caffeineMatches,
          points: 10,
        })
      );
    }
  }

  /*
   * DIABETES
   */

  if (hasDiabetes) {
    if (sugarsG >= 22.5) {
      findings.push(
        createFinding({
          id: "diabetes-sugar-very-high",
          condition: "Diabetes",
          category: "sugar",
          severity: "high",
          title: "Very high sugar content",
          explanation:
            "This product may cause a substantial rise in blood glucose, depending on portion size and the rest of the meal.",
          detectedValue: `${round(sugarsG)} g sugar per 100 g`,
          points: 45,
          redFlag: true,
        })
      );
    } else if (sugarsG > 10) {
      findings.push(
        createFinding({
          id: "diabetes-sugar-high",
          condition: "Diabetes",
          category: "sugar",
          severity: "moderate",
          title: "High sugar content",
          explanation:
            "This product contains more than 10 g of sugar per 100 g and may affect blood-glucose control.",
          detectedValue: `${round(sugarsG)} g sugar per 100 g`,
          points: 30,
        })
      );
    }

    if (sugarMatches.length > 0) {
      findings.push(
        createFinding({
          id: "diabetes-added-sugar",
          condition: "Diabetes",
          category: "sugar",
          severity: "moderate",
          title: "Added sugar ingredient detected",
          explanation:
            "The ingredient list contains added sugar or a rapidly absorbed carbohydrate source.",
          matchedIngredients: sugarMatches,
          points: 20,
        })
      );
    }
  }

  /*
   * HEART DISEASE
   */

  if (hasHeartDisease) {
    if (saturatedFatG >= 8) {
      findings.push(
        createFinding({
          id: "heart-saturated-fat-very-high",
          condition: "Heart Disease",
          category: "fat",
          severity: "high",
          title: "Very high saturated fat",
          explanation:
            "Frequent high saturated-fat intake may adversely affect cardiovascular risk.",
          detectedValue: `${round(
            saturatedFatG
          )} g saturated fat per 100 g`,
          points: 45,
          redFlag: true,
        })
      );
    } else if (saturatedFatG >= 5) {
      findings.push(
        createFinding({
          id: "heart-saturated-fat-high",
          condition: "Heart Disease",
          category: "fat",
          severity: "moderate",
          title: "High saturated fat",
          explanation:
            "This product is high in saturated fat and may be best limited.",
          detectedValue: `${round(
            saturatedFatG
          )} g saturated fat per 100 g`,
          points: 30,
        })
      );
    }

    if (unhealthyFatMatches.length > 0) {
      findings.push(
        createFinding({
          id: "heart-unhealthy-fat",
          condition: "Heart Disease",
          category: "fat",
          severity: "high",
          title: "Hydrogenated or trans-fat source detected",
          explanation:
            "Hydrogenated and trans-fat sources may adversely affect cardiovascular health.",
          matchedIngredients: unhealthyFatMatches,
          points: 40,
          redFlag: true,
        })
      );
    }

    if (
      sodiumMg >= 400 ||
      saltG >= 1 ||
      sodiumIngredientMatches.length > 0
    ) {
      findings.push(
        createFinding({
          id: "heart-sodium",
          condition: "Heart Disease",
          category: "sodium",
          severity: "moderate",
          title: "High sodium or salt detected",
          explanation:
            "A high sodium intake may increase blood pressure and cardiovascular strain.",
          detectedValue:
            sodiumMg > 0
              ? `${Math.round(sodiumMg)} mg sodium per 100 g`
              : undefined,
          matchedIngredients: sodiumIngredientMatches,
          points: 20,
        })
      );
    }
  }

  /*
   * GOUT
   */

  if (hasGout && purineMatches.length > 0) {
    findings.push(
      createFinding({
        id: "gout-purine",
        condition: "Gout",
        category: "purine",
        severity: "high",
        title: "Higher-purine ingredient detected",
        explanation:
          "This product contains an ingredient commonly associated with a higher purine load and may trigger gout symptoms in susceptible people.",
        matchedIngredients: purineMatches,
        points: 45,
        redFlag: true,
      })
    );
  }

  const deduplicated = uniqueFindings(findings);

  /*
   * Avoid unlimited double-counting of the exact same nutrient.
   * We keep condition-specific findings, but cap each risk category.
   */

  const categoryCaps: Record<RiskFinding["category"], number> = {
    allergen: 100,
    sodium: 45,
    potassium: 70,
    phosphorus: 50,
    sugar: 65,
    fat: 70,
    purine: 50,
    caffeine: 15,
    ingredient: 30,
  };

  const categoryScores = new Map<string, number>();

  for (const finding of deduplicated) {
    const current = categoryScores.get(finding.category) || 0;
    categoryScores.set(
      finding.category,
      Math.min(current + finding.points, categoryCaps[finding.category])
    );
  }

  const score = Math.min(
    [...categoryScores.values()].reduce(
      (total, value) => total + value,
      0
    ),
    100
  );

  const hasCriticalAllergen = deduplicated.some(
    (finding) =>
      finding.category === "allergen" &&
      finding.severity === "critical"
  );

  const hasRedFlag = deduplicated.some(
    (finding) => finding.redFlag
  );

  let verdict: RiskVerdict = "Recommended";

  if (hasCriticalAllergen) {
    verdict = "Not Recommended";
  } else if (hasRedFlag && score >= 40) {
    verdict = "Not Recommended";
  } else if (score >= 75) {
    verdict = "Not Recommended";
  } else if (score >= 40) {
    verdict = "Use With Caution";
  } else if (score >= 15) {
    verdict = "Low Risk";
  }

  return {
    score,
    verdict,
    findings: deduplicated,
    reasons: deduplicated.map((finding) => {
      const value = finding.detectedValue
        ? ` (${finding.detectedValue})`
        : "";

      return `${finding.condition}: ${finding.title}${value}`;
    }),
    redFlags: deduplicated
      .filter((finding) => finding.redFlag)
      .map(
        (finding) =>
          `${finding.condition}: ${finding.title}`
      ),
  };
}