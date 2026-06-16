import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { EmptyState, GlassPanel, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { getScanHistoryItem, ScanHistoryItem } from "../storage/scanHistory";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [item, setItem] = useState<ScanHistoryItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      setItem(id ? await getScanHistoryItem(id) : null);
      setLoaded(true);
    }
    load();
  }, [id]);

  if (loaded && !item) {
    return <V21Screen><PageHeader title="Scan Detail" /><EmptyState title="Scan not found" message="This history item may have been cleared." /></V21Screen>;
  }

  if (!item) {
    return <V21Screen><PageHeader title="Scan Detail" /><GlassPanel><Text style={styles.body}>Loading...</Text></GlassPanel></V21Screen>;
  }

  return (
    <V21Screen>
      <PageHeader title="Scan Detail" subtitle={item.barcode} />
      <GlassPanel strong style={styles.panel}>
        <View style={styles.headerRow}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>NL</Text></View>}
          <View style={styles.copy}>
            <Text style={styles.name}>{item.productName}</Text>
            {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
            <View style={styles.pillRow}><Pill tone={item.matchCount > 0 ? "warn" : "safe"}>{item.matchCount} matches</Pill><Pill>{item.nutrientNotices.length} notices</Pill></View>
          </View>
        </View>
      </GlassPanel>

      <GlassPanel style={styles.panel}>
        <Text style={styles.sectionTitle}>Ingredient matches</Text>
        {item.ingredientMatches.length > 0 ? item.ingredientMatches.map((match) => (
          <View key={match.avoidId} style={styles.matchCard}>
            <Text style={styles.matchTitle}>{match.label}</Text>
            <Text style={styles.body}>Matched: {match.matchedKeywords.join(", ")}</Text>
          </View>
        )) : <Text style={styles.body}>No selected avoided ingredients were found in the available ingredient text.</Text>}
      </GlassPanel>

      <GlassPanel style={styles.panel}>
        <Text style={styles.sectionTitle}>Nutrient notices</Text>
        {item.nutrientNotices.length > 0 ? item.nutrientNotices.map((notice) => (
          <View key={notice.id} style={styles.noticeCard}>
            <Text style={styles.matchTitle}>{notice.label}: {notice.value}</Text>
            <Text style={styles.body}>{notice.note}</Text>
          </View>
        )) : <Text style={styles.body}>No nutrient notices were stored for this scan.</Text>}
      </GlassPanel>

      <GlassPanel style={styles.panel}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.body}>{item.ingredients || "No ingredient text was available from the product database."}</Text>
      </GlassPanel>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  panel: { gap: SPACING.md, marginBottom: SPACING.md },
  headerRow: { flexDirection: "row", gap: SPACING.md, alignItems: "center" },
  image: { width: 84, height: 84, borderRadius: RADIUS.lg, backgroundColor: "#FFFFFF" },
  placeholder: { width: 84, height: 84, borderRadius: RADIUS.lg, backgroundColor: COLORS.ice, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: COLORS.primary, fontWeight: "900", fontSize: 24 },
  copy: { flex: 1 },
  name: { color: COLORS.ink, fontSize: 20, fontWeight: "900", lineHeight: 25 },
  brand: { marginTop: 4, color: COLORS.muted, fontWeight: "700" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  sectionTitle: { color: COLORS.ink, fontSize: 18, fontWeight: "900" },
  body: { color: COLORS.text, lineHeight: 22, fontWeight: "600" },
  matchCard: { padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.moderateSubtle, borderWidth: 1, borderColor: "rgba(249,115,22,0.18)" },
  noticeCard: { padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: COLORS.border },
  matchTitle: { color: COLORS.ink, fontWeight: "900", marginBottom: 4 },
});
