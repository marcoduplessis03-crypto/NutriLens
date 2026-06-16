import AsyncStorage from "@react-native-async-storage/async-storage";

import type { NormalizedProduct } from "../api/productLookup";

export type FavoriteProduct = {
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string | null;
  source?: string;
  savedAt: string;
  product?: NormalizedProduct;
};

const FAVORITES_KEY = "@nutrilens_favorites";

export async function getFavorites(): Promise<FavoriteProduct[]> {
  try {
    const saved = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as FavoriteProduct[]) : [];
  } catch (error) {
    console.log("Failed to load favorites:", error);
    return [];
  }
}

export async function isFavoriteProduct(barcode: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((item) => item.barcode === barcode);
}

export async function toggleFavoriteProduct(product: NormalizedProduct): Promise<boolean> {
  const favorites = await getFavorites();
  const existing = favorites.some((item) => item.barcode === product.barcode);

  if (existing) {
    const next = favorites.filter((item) => item.barcode !== product.barcode);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return false;
  }

  const favorite: FavoriteProduct = {
    barcode: product.barcode,
    productName: product.name,
    brand: product.brand,
    imageUrl: product.image,
    source: product.source,
    savedAt: new Date().toISOString(),
    product,
  };

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([favorite, ...favorites]));
  return true;
}

export async function removeFavoriteProduct(barcode: string): Promise<void> {
  const favorites = await getFavorites();
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.filter((item) => item.barcode !== barcode)));
}
