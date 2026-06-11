import { router, useFocusEffect } from "expo-router";
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
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
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
      item.productName.toLowerCase().includes(searchValue) ||
      item.brand?.toLowerCase().includes(searchValue) ||
      item.barcode.toLowerCase().includes(searchValue) ||
      item.profileName?.toLowerCase().includes(searchValue)
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
    if (history.length === 0) {
      return;
    }

    Alert.alert("Clear history", "This will remove all saved scans.", [
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
    ]);
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

  function getMatchSummary(item: ScanHistoryItem) {
    const matchCount =
      item.matchCount ?? item.ingredientMatches?.length ?? item.warningCount ?? 0;

    if (matchCount === 0) {
      return "No selected ingredients found";
    }

    if (matchCount === 1) {
      return "1 selected ingredient found";
    }

    return `${matchCount} selected ingredients found`;
  }

  function getNoticeSummary(item: ScanHistoryItem) {
    const noticeCount = item.nutrientNotices?.length ?? 0;

    if (noticeCount === 0) {
      return "No nutrient notices";
    }

    if (noticeCount === 1) {
      return "1 nutrient notice";
    }

    return `${noticeCount} nutrient notices`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan History</Text>

          <Text style={styles.subtitle}>
            {history.length} saved {history.length === 1 ? "scan" : "scans"}
          </Text>
        </View>

        {history.length > 0 && (
          <Pressable style={styles.clearButton} onPress={confirmClearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search products, profiles, or barcodes"
        placeholderTextColor={COLORS.muted}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredHistory.length === 0 ? styles.emptyList : styles.list
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const matchCount =
            item.matchCount ??
            item.ingredientMatches?.length ??
            item.warningCount ??
            0;

          const hasMatches = matchCount > 0;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/history-detail",
                  params: {
                    id: item.id,
                  },
                })
              }
            >
              <View style={styles.topRow}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>NL</Text>
                  </View>
                )}

                <View style={styles.productInformation}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.productName}
                  </Text>

                  {!!item.brand && <Text style={styles.brand}>{item.brand}</Text>}

                  <Text style={styles.barcode}>{item.barcode}</Text>
                </View>

                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmDelete(item);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryLabel}>Ingredient check</Text>

                  <Text
                    style={[
                      styles.summaryValue,
                      hasMatches ? styles.summaryValueWarning : styles.summaryValueOk,
                    ]}
                  >
                    {getMatchSummary(item)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    hasMatches ? styles.statusBadgeWarning : styles.statusBadgeOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      hasMatches
                        ? styles.statusBadgeTextWarning
                        : styles.statusBadgeTextOk,
                    ]}
                  >
                    {hasMatches ? "Match found" : "No match"}
                  </Text>
                </View>
              </View>

              <Text style={styles.noticeText}>{getNoticeSummary(item)}</Text>

              {!!item.profileName && (
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    Profile: {item.profileName}
                  </Text>
                </View>
              )}

              <Text style={styles.date}>{formatDate(item.scannedAt)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {search ? "No matching scans" : "No scans saved yet"}
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? "Try a different product name, profile name, or barcode."
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

  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
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

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  summaryBlock: {
    flex: 1,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "900",
  },

  summaryValueOk: {
    color: COLORS.safe,
  },

  summaryValueWarning: {
    color: COLORS.moderate,
  },

  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  statusBadgeOk: {
    borderColor: COLORS.safe,
  },

  statusBadgeWarning: {
    borderColor: COLORS.moderate,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  statusBadgeTextOk: {
    color: COLORS.safe,
  },

  statusBadgeTextWarning: {
    color: COLORS.moderate,
  },

  noticeText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 10,
  },

  profileBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 10,
  },

  profileBadgeText: {
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