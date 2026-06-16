import AsyncStorage from "@react-native-async-storage/async-storage";

export type IngredientMatch = {
  avoidId: string;
  label: string;
  matchedKeywords: string[];
};

export type NutrientNotice = {
  id: string;
  label: string;
  value: string;
  note: string;
};

export type ScanHistoryItem = {
  id: string;
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string | null;
  source?: string;
  profileId?: string | null;
  profileName?: string;
  avoidIds: string[];
  matchCount: number;
  ingredientMatches: IngredientMatch[];
  nutrientNotices: NutrientNotice[];
  scannedAt: string;
  ingredients?: string;
  nutriments?: Record<string, unknown>;
};

const HISTORY_KEY = "@nutrilens_scan_history";

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const saved = await AsyncStorage.getItem(HISTORY_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScanHistoryItem[];
  } catch (error) {
    console.log("Failed to load scan history:", error);
    return [];
  }
}

export async function saveScanHistoryItem(item: ScanHistoryItem): Promise<void> {
  const history = await getScanHistory();
  const nextHistory = [item, ...history].slice(0, 100);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
}

export async function getScanHistoryItem(id: string): Promise<ScanHistoryItem | null> {
  const history = await getScanHistory();
  return history.find((item) => item.id === id) ?? null;
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
