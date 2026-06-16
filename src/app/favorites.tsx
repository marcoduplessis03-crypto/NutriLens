import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { ActionButton, EmptyState, GlassPanel, PageHeader, V21Screen } from "../components/NutriLensV21";
import { FavoriteProduct, getFavorites, removeFavoriteProduct } from "../storage/favoritesStorage";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setFavorites(await getFavorites());
  }

  async function remove(barcode: string) {
    await removeFavoriteProduct(barcode);
    await load();
  }

  return (
    <V21Screen>
      <PageHeader title="Favorites" subtitle="Saved products stored locally on this device." />
      {favorites.length === 0 ? <EmptyState title="No favorites yet" message="Save a product from the scan result screen to see it here." /> : (
        <View style={styles.list}>
          {favorites.map((favorite) => (
            <GlassPanel key={favorite.barcode} style={styles.card}>
              <View style={styles.row}>
                {favorite.imageUrl ? <Image source={{ uri: favorite.imageUrl }} style={styles.image} resizeMode="contain" /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>NL</Text></View>}
                <View style={styles.copy}>
                  <Text style={styles.name}>{favorite.productName}</Text>
                  {favorite.brand ? <Text style={styles.brand}>{favorite.brand}</Text> : null}
                  <Text style={styles.meta}>Barcode: {favorite.barcode}</Text>
                </View>
              </View>
              <ActionButton title="Remove" subtitle="Delete from favorites" icon="×" onPress={() => remove(favorite.barcode)} variant="danger" />
            </GlassPanel>
          ))}
        </View>
      )}
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.md },
  card: { gap: SPACING.md },
  row: { flexDirection: "row", gap: SPACING.md, alignItems: "center" },
  image: { width: 74, height: 74, borderRadius: RADIUS.lg, backgroundColor: "#FFFFFF" },
  placeholder: { width: 74, height: 74, borderRadius: RADIUS.lg, backgroundColor: COLORS.ice, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: COLORS.primary, fontWeight: "900", fontSize: 21 },
  copy: { flex: 1 },
  name: { color: COLORS.ink, fontSize: 17, fontWeight: "900", lineHeight: 22 },
  brand: { marginTop: 3, color: COLORS.muted, fontWeight: "700" },
  meta: { marginTop: 6, color: COLORS.muted, fontSize: 12, fontWeight: "700" },
});
