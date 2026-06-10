import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    clearScanHistory,
    deleteHistoryItem,
    getScanHistory,
    ScanHistoryItem,
} from "../../src/storage/scanHistory";
import { COLORS, RADIUS } from "../../src/theme";

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>(
    []
  );

  const [search, setSearch] = useState("");

  const loadHistory = useCallback(async () => {
    const savedHistory = await getScanHistory();
    setHistory(savedHistory);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const filteredHistory = history.filter((item) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      item.productName
        .toLowerCase()
        .includes(searchValue) ||
      item.brand
        ?.toLowerCase()
        .includes(searchValue) ||
      item.barcode
        .toLowerCase()
        .includes(searchValue)
    );
  });

  async function handleDelete(id: string) {
    await deleteHistoryItem(id);
    await loadHistory();
  }

  function confirmDelete(item: ScanHistoryItem) {
    Alert.alert(
      "Delete scan",
      `Remove ${item.productName} from your history?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(item.id),
        },
      ]
    );
  }

  function confirmClearHistory() {
    if (history.length === 0) return;

    Alert.alert(
      "Clear history",
      "This will remove all saved scans.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearScanHistory();
            setHistory([]);
          },
        },
      ]
    );
  }

  function getRiskColor(score: number) {
    if (score >= 70) return COLORS.high;
    if (score >= 40) return COLORS.moderate;
    if (score > 0) return COLORS.low;

    return COLORS.safe;
  }

  function formatDate(value: string) {
    const date = new Date(value);

    return date.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan History</Text>

          <Text style={styles.subtitle}>
            {history.length} saved{" "}
            {history.length === 1 ? "scan" : "scans"}
          </Text>
        </View>

        {history.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={confirmClearHistory}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search products or barcodes"
        placeholderTextColor={COLORS.muted}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredHistory.length === 0
            ? styles.emptyList
            : styles.list
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const riskColor = getRiskColor(
            item.riskScore
          );

          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                      NL
                    </Text>
                  </View>
                )}

                <View style={styles.productInformation}>
                  <Text
                    style={styles.productName}
                    numberOfLines={2}
                  >
                    {item.productName}
                  </Text>

                  {!!item.brand && (
                    <Text style={styles.brand}>
                      {item.brand}
                    </Text>
                  )}

                  <Text style={styles.barcode}>
                    {item.barcode}
                  </Text>
                </View>

                <Pressable
                  onPress={() => confirmDelete(item)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreLabel}>
                    NutriLens Score
                  </Text>

                  <Text
                    style={[
                      styles.score,
                      {
                        color: riskColor,
                      },
                    ]}
                  >
                    {item.riskScore}/100
                  </Text>
                </View>

                <View
                  style={[
                    styles.riskBadge,
                    {
                      borderColor: riskColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.riskBadgeText,
                      {
                        color: riskColor,
                      },
                    ]}
                  >
                    {item.riskLevel}
                  </Text>
                </View>
              </View>

              <Text style={styles.warningCount}>
                {item.warningCount === 1
                  ? "1 warning detected"
                  : `${item.warningCount} warnings detected`}
              </Text>

              {item.conditions.length > 0 && (
                <View style={styles.conditions}>
                  {item.conditions.map((condition) => (
                    <View
                      key={condition}
                      style={styles.conditionBadge}
                    >
                      <Text style={styles.conditionText}>
                        {condition}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.date}>
                {formatDate(item.scannedAt)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {search
                ? "No matching scans"
                : "No scans saved yet"}
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? "Try a different product name or barcode."
                : "Successfully scanned products will appear here automatically."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },

  clearButton: {
    borderWidth: 1,
    borderColor: COLORS.high,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  clearText: {
    color: COLORS.high,
    fontWeight: "700",
  },

  searchInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
    color: COLORS.text,
    fontSize: 15,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  image: {
    width: 65,
    height: 65,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },

  imagePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  imagePlaceholderText: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  productInformation: {
    flex: 1,
    marginLeft: 12,
  },

  productName: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 16,
  },

  brand: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  barcode: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  deleteButton: {
    padding: 8,
    alignSelf: "flex-start",
  },

  deleteText: {
    color: COLORS.high,
    fontSize: 26,
    lineHeight: 26,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scoreLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },

  score: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },

  riskBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  riskBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  warningCount: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 10,
  },

  conditions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  conditionBadge: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  conditionText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },

  date: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 100,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
});