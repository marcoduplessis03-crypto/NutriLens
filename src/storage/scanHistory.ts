import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "@nutrilens_scan_history";

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
  imageUrl?: string;

  profileName?: string;
  avoidIds: string[];
  matchCount: number;
  ingredientMatches: IngredientMatch[];
  nutrientNotices: NutrientNotice[];

  scannedAt: string;

  ingredients?: string;
  nutriments?: Record<string, any>;
};

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);

    if (!savedHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(savedHistory);

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory;
  } catch (error) {
    console.error("Could not load scan history:", error);
    return [];
  }
}

export async function getHistoryItemById(
  id: string
): Promise<ScanHistoryItem | null> {
  try {
    const history = await getScanHistory();

    return history.find((item) => item.id === id) || null;
  } catch (error) {
    console.error("Could not load history item:", error);
    return null;
  }
}

export async function saveScanToHistory(
  scan: Omit<ScanHistoryItem, "id" | "scannedAt">
): Promise<void> {
  try {
    const currentHistory = await getScanHistory();

    const newScan: ScanHistoryItem = {
      ...scan,
      id: `${Date.now()}-${scan.barcode}`,
      scannedAt: new Date().toISOString(),
    };

    const updatedHistory = [newScan, ...currentHistory].slice(0, 100);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Could not save scan history:", error);
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const currentHistory = await getScanHistory();

    const updatedHistory = currentHistory.filter((item) => item.id !== id);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Could not delete history item:", error);
  }
}

export async function clearScanHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Could not clear scan history:", error);
  }
}