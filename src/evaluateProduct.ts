import { calculateRisk } from "./riskEngine";

export function evaluateProduct(
  product: any,
  selectedConditions: string[] = []
): string[] {
  const risk = calculateRisk(product, selectedConditions);

  if (!risk.findings || risk.findings.length === 0) {
    return [
      "🟢 No major concerns were detected for the selected conditions based on the available product data.",
    ];
  }

  return risk.findings.map((finding) => {
    const icon =
      finding.severity === "critical" || finding.severity === "high"
        ? "🔴"
        : finding.severity === "moderate"
        ? "🟠"
        : "🟡";

    const value = finding.detectedValue
      ? ` ${finding.detectedValue}.`
      : "";

    const ingredients =
      finding.matchedIngredients?.length > 0
        ? ` Detected: ${finding.matchedIngredients.slice(0, 5).join(", ")}.`
        : "";

    return `${icon} ${finding.condition}: ${finding.title}.${value} ${finding.explanation}${ingredients}`;
  });
}