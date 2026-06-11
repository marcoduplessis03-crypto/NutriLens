import { NormalizedProduct } from "../types/product";
import { fetchProductByBarcode } from "./openFoodFacts";

export type LookupStage = "open-food-facts";

export type ProductLookupResult = {
  product: NormalizedProduct | null;
  attemptedSources: string[];
};

export async function lookupProduct(
  barcode: string,
  onStage?: (stage: LookupStage) => void
): Promise<ProductLookupResult> {
  onStage?.("open-food-facts");

  const product = await fetchProductByBarcode(barcode);

  return {
    product,
    attemptedSources: ["Open Food Facts"],
  };
}