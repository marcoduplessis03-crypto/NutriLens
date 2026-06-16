import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton, EmptyState, GlassPanel, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { clearScanHistory, getScanHistory, ScanHistoryItem } from "../storage/scanHistory";
import { COLORS, RADIUS, SPACING } from "../theme";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const [items, setItems] = useState<ScanHistoryItem[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setItems(await getScanHistory());
  }

  async function clearAll() {
    await clearScanHistory();
    await load();
  }

  return (
    <V21Screen>
      <PageHeader title="Scan History" subtitle="Recent scans saved locally on this device." />

      {items.length === 0 ? (
        <EmptyState title="No scans yet" message="Scan a barcode to start building your local history." />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => router.push({ pathname: "/history-detail", params: { id: item.id } } as any)} style={styles.card}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" /> : <View style={styles.imagePlaceholder}><Text style={styles.imageText}>NL</Text></View>}
              <View style={styles.copy}>
                <Text style={styles.name} numberOfLines={2}>{item.productName}</Text>
                {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
                <Text style={styles.meta}>{formatDate(item.scannedAt)}</Text>
                <View style={styles.pills}><Pill tone={item.matchCount > 0 ? "warn" : "safe"}>{item.matchCount} matches</Pill><Pill>{item.nutrientNotices.length} notices</Pill></View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {items.length > 0 ? (
        <GlassPanel style={styles.clearPanel}>
          <ActionButton title="Clear History" subtitle="Remove all local scan records" icon="×" onPress={clearAll} variant="danger" />
        </GlassPanel>
      ) : null}
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.md },
  card: { flexDirection: "row", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(255,255,255,0.88)" },
  image: { width: 74, height: 74, borderRadius: RADIUS.lg, backgroundColor: "#FFFFFF" },
  imagePlaceholder: { width: 74, height: 74, borderRadius: RADIUS.lg, backgroundColor: COLORS.ice, alignItems: "center", justifyContent: "center" },
  imageText: { color: COLORS.primary, fontWeight: "900", fontSize: 21 },
  copy: { flex: 1 },
  name: { color: COLORS.ink, fontSize: 16, fontWeight: "900", lineHeight: 21 },
  brand: { marginTop: 3, color: COLORS.muted, fontWeight: "700" },
  meta: { marginTop: 6, color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  clearPanel: { marginTop: SPACING.lg },
});
