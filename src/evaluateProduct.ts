import { calculateRisk } from "./riskEngine";
import type { NormalizedProduct, RiskFinding } from "./types/product";

type ProductInput = Pick<NormalizedProduct, "name" | "ingredients" | "nutriments"> & {
  // Allow the raw API shape used by riskEngine
  product_name?: string;
  ingredients_text?: string;
};

function severityIcon(finding: RiskFinding): string {
  if (finding.severity === "critical" || finding.severity === "high") return "🔴";
  if (finding.severity === "moderate") return "🟠";
  return "🟡";
}

/**
 * Returns a human-readable warning string for each risk finding.
 * Returns a single "all clear" entry when no findings are present.
 */
export function buildWarningStrings(findings: RiskFinding[]): string[] {
  if (findings.length === 0) {
    return [
      "🟢 No major concerns were detected for the selected conditions based on the available product data.",
    ];
  }

  return findings.map((finding) => {
    const icon = severityIcon(finding);
    const value = finding.detectedValue ? ` ${finding.detectedValue}.` : "";
    const ingredients =
      finding.matchedIngredients && finding.matchedIngredients.length > 0
        ? ` Detected: ${finding.matchedIngredients.slice(0, 5).join(", ")}.`
        : "";

    return `${icon} ${finding.condition}: ${finding.title}.${value} ${finding.explanation}${ingredients}`;
  });
}

/**
 * Convenience wrapper used by non-scanner entry points (e.g. history re-evaluation).
 * For the scanner flow, call calculateRisk + buildWarningStrings directly.
 */
export function evaluateProduct(
  product: ProductInput,
  selectedConditions: string[] = []
): string[] {
  const risk = calculateRisk(product, selectedConditions);
  return buildWarningStrings(risk.findings);
}
