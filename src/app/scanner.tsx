import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lookupProduct, LookupStage, NormalizedProduct } from "../api/productLookup";
import { ActionButton, GlassPanel, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { AVOID_OPTIONS, getActiveProfile, UserProfile } from "../storage/profileStorage";
import { IngredientMatch, NutrientNotice, saveScanHistoryItem } from "../storage/scanHistory";
import { isFavoriteProduct, toggleFavoriteProduct } from "../storage/favoritesStorage";
import { hasAcceptedTerms } from "../storage/termsAcceptance";
import { COLORS, RADIUS, SPACING } from "../theme";

type ScanState = "ready" | "looking-up" | "result" | "not-found" | "error";

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function findIngredientMatches(profile: UserProfile | null, product: NormalizedProduct | null): IngredientMatch[] {
  if (!profile || !product?.ingredients) return [];
  const ingredientText = normalizeText(product.ingredients);
  return AVOID_OPTIONS.filter((option) => profile.avoidIds.includes(option.id))
    .map((option) => {
      const matchedKeywords = option.keywords.filter((keyword) => ingredientText.includes(normalizeText(keyword))).slice(0, 8);
      if (matchedKeywords.length === 0) return null;
      return { avoidId: option.id, label: option.label, matchedKeywords };
    })
    .filter(Boolean) as IngredientMatch[];
}

function formatAmount(value?: number, unit = "g"): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${Number(value.toFixed(2))}${unit}/100g`;
}

function buildNutrientNotices(profile: UserProfile | null, product: NormalizedProduct | null): NutrientNotice[] {
  if (!profile || !product) return [];
  const notices: NutrientNotice[] = [];
  const n = product.nutriments;

  if (profile.avoidIds.includes("sodium_salt")) {
    const sodium = formatAmount(n.sodium_100g, "g");
    const salt = formatAmount(n.salt_100g, "g");
    if (sodium || salt) {
      notices.push({ id: "sodium_salt", label: "Sodium / salt information", value: salt || sodium || "Available", note: "Review the nutrition label and your own requirements." });
    }
  }

  if (profile.avoidIds.includes("potassium_additives")) {
    const potassium = formatAmount(n.potassium_100g, "g");
    if (potassium) notices.push({ id: "potassium", label: "Potassium information", value: potassium, note: "Database potassium values are not always available for every product." });
  }

  if (profile.avoidIds.includes("added_sugars")) {
    const sugars = formatAmount(n.sugars_100g, "g");
    if (sugars) notices.push({ id: "sugars", label: "Sugars information", value: sugars, note: "Review the ingredient list for added sugar wording." });
  }

  const satFat = formatAmount(n["saturated-fat_100g"], "g");
  if (satFat) notices.push({ id: "saturated-fat", label: "Saturated fat", value: satFat, note: "Shown for awareness when the database includes it." });

  return notices;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scanState, setScanState] = useState<ScanState>("ready");
  const [barcode, setBarcode] = useState("");
  const [stage, setStage] = useState<LookupStage | null>(null);
  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [ingredientMatches, setIngredientMatches] = useState<IngredientMatch[]>([]);
  const [nutrientNotices, setNutrientNotices] = useState<NutrientNotice[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      async function load() {
        const accepted = await hasAcceptedTerms();
        if (!accepted) {
          router.replace({ pathname: "/terms-disclaimer", params: { next: "/scanner" } } as any);
          return;
        }
        const activeProfile = await getActiveProfile();
        setProfile(activeProfile);
      }
      load();
    }, [])
  );

  async function handleBarcodeScanned(event: { data?: string }) {
    if (scanState !== "ready") return;
    const detectedBarcode = event.data ?? "";
    if (!detectedBarcode) return;

    setBarcode(detectedBarcode);
    setScanState("looking-up");
    setStage(null);
    setErrorMessage("");

    try {
      const lookup = await lookupProduct(detectedBarcode, setStage);
      if (!lookup.product) {
        setProduct(null);
        setIngredientMatches([]);
        setNutrientNotices([]);
        setScanState("not-found");
        return;
      }

      const matches = findIngredientMatches(profile, lookup.product);
      const notices = buildNutrientNotices(profile, lookup.product);

      setProduct(lookup.product);
      setIngredientMatches(matches);
      setNutrientNotices(notices);
      setFavorite(await isFavoriteProduct(lookup.product.barcode));
      setScanState("result");

      await saveScanHistoryItem({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        barcode: lookup.product.barcode,
        productName: lookup.product.name,
        brand: lookup.product.brand,
        imageUrl: lookup.product.image,
        source: lookup.product.source,
        profileId: profile?.id ?? null,
        profileName: profile?.name,
        avoidIds: profile?.avoidIds ?? [],
        matchCount: matches.length,
        ingredientMatches: matches,
        nutrientNotices: notices,
        scannedAt: new Date().toISOString(),
        ingredients: lookup.product.ingredients,
        nutriments: lookup.product.nutriments,
      });
    } catch (error) {
      console.log("Lookup failed:", error);
      setErrorMessage("Something went wrong while looking up this barcode. Please try again.");
      setScanState("error");
    }
  }

  function resetScanner() {
    setScanState("ready");
    setBarcode("");
    setProduct(null);
    setIngredientMatches([]);
    setNutrientNotices([]);
    setStage(null);
    setErrorMessage("");
  }

  async function toggleFavorite() {
    if (!product) return;
    setFavorite(await toggleFavoriteProduct(product));
  }

  if (!permission) {
    return (
      <V21Screen>
        <PageHeader title="Scanner" subtitle="Preparing camera permissions." />
        <GlassPanel><ActivityIndicator color={COLORS.primary} /></GlassPanel>
      </V21Screen>
    );
  }

  if (!permission.granted) {
    return (
      <V21Screen>
        <PageHeader title="Camera Permission" subtitle="NutriLens needs camera access to scan barcodes." />
        <GlassPanel strong style={styles.permissionPanel}>
          <Text style={styles.body}>Camera access is only used for barcode scanning.</Text>
          <ActionButton title="Allow Camera Access" subtitle="Open camera permission prompt" icon="⌕" onPress={requestPermission} variant="primary" />
        </GlassPanel>
      </V21Screen>
    );
  }

  return (
    <View style={styles.screen}>
      {scanState === "ready" || scanState === "looking-up" ? (
        <>
          <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"] as any }} onBarcodeScanned={scanState === "ready" ? handleBarcodeScanned : undefined} />
          <View style={styles.cameraOverlay}>
            <View style={styles.topBar}>
              <Pressable style={styles.roundButton} onPress={() => router.back()}><Text style={styles.roundButtonText}>‹</Text></Pressable>
              <View style={styles.statusPill}><Text style={styles.statusPillText}>{profile ? profile.name : "No profile"}</Text></View>
              <Pressable style={styles.roundButton} onPress={() => router.push("/profile-select")}><Text style={styles.roundButtonText}>👥</Text></Pressable>
            </View>

            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} /><View style={styles.cornerTR} /><View style={styles.cornerBL} /><View style={styles.cornerBR} />
            </View>

            <GlassPanel style={styles.scanDock}>
              <Text style={styles.scanTitle}>{scanState === "looking-up" ? "Checking product data" : "Scan a barcode"}</Text>
              <Text style={styles.scanSubtitle}>{scanState === "looking-up" ? `Source: ${stage === "open-food-facts" ? "Open Food Facts" : "Starting lookup"}` : "Hold the barcode inside the frame."}</Text>
              {scanState === "looking-up" ? <ActivityIndicator color={COLORS.primary} style={styles.spinner} /> : null}
            </GlassPanel>
          </View>
        </>
      ) : (
        <V21Screen>
          <PageHeader title={scanState === "result" ? "Scan Result" : scanState === "not-found" ? "Product Not Found" : "Scan Error"} subtitle={`Barcode: ${barcode || "Unavailable"}`} />

          {scanState === "result" && product ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassPanel strong style={styles.resultPanel}>
                <View style={styles.productHeader}>
                  {product.image ? <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" /> : <View style={styles.productImagePlaceholder}><Text style={styles.productImageText}>NL</Text></View>}
                  <View style={styles.productCopy}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
                    <Pill>{product.source}</Pill>
                  </View>
                </View>

                <View style={styles.resultSummary}>
                  <View style={[styles.summaryBox, ingredientMatches.length > 0 ? styles.summaryBoxWarn : styles.summaryBoxSafe]}>
                    <Text style={styles.summaryNumber}>{ingredientMatches.length}</Text>
                    <Text style={styles.summaryText}>{ingredientMatches.length === 1 ? "selected item found" : "selected items found"}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryNumber}>{nutrientNotices.length}</Text>
                    <Text style={styles.summaryText}>nutrient notices</Text>
                  </View>
                </View>

                <ActionButton title={favorite ? "Remove from Favorites" : "Add to Favorites"} subtitle="Save this product locally" icon="★" onPress={toggleFavorite} />
              </GlassPanel>

              <GlassPanel style={styles.sectionPanel}>
                <Text style={styles.sectionTitle}>Ingredient flagging</Text>
                {product.ingredients ? <Text style={styles.ingredients}>{product.ingredients}</Text> : <Text style={styles.body}>No ingredient list was available from the product database.</Text>}
                <View style={styles.matchList}>
                  {ingredientMatches.length > 0 ? ingredientMatches.map((match) => (
                    <View key={match.avoidId} style={styles.matchCard}>
                      <Text style={styles.matchTitle}>{match.label}</Text>
                      <Text style={styles.matchKeywords}>Matched: {match.matchedKeywords.join(", ")}</Text>
                    </View>
                  )) : <Text style={styles.noMatchText}>No selected avoided ingredients were found in the available ingredient text.</Text>}
                </View>
              </GlassPanel>

              <GlassPanel style={styles.sectionPanel}>
                <Text style={styles.sectionTitle}>Nutrient awareness</Text>
                {nutrientNotices.length > 0 ? nutrientNotices.map((notice) => (
                  <View key={notice.id} style={styles.noticeCard}>
                    <View style={styles.noticeTop}><Text style={styles.noticeTitle}>{notice.label}</Text><Pill tone="warn">{notice.value}</Pill></View>
                    <Text style={styles.noticeNote}>{notice.note}</Text>
                  </View>
                )) : <Text style={styles.body}>No nutrient notices were available for your selected avoid list.</Text>}
              </GlassPanel>

              <GlassPanel style={styles.disclaimerPanel}>
                <Text style={styles.disclaimerTitle}>Important</Text>
                <Text style={styles.disclaimerText}>NutriLens uses third-party product data and may be incomplete. Always verify the physical product label before making decisions.</Text>
              </GlassPanel>

              <View style={styles.bottomActions}>
                <ActionButton title="Scan Another" subtitle="Return to camera" icon="⌕" onPress={resetScanner} variant="primary" />
                <ActionButton title="Back Home" subtitle="Return to dashboard" icon="⌂" onPress={() => router.replace("/home")} />
              </View>
            </ScrollView>
          ) : (
            <GlassPanel strong style={styles.resultPanel}>
              <Text style={styles.productName}>{scanState === "not-found" ? "We could not find this product." : errorMessage}</Text>
              <Text style={styles.body}>Try scanning again, or check whether the barcode is clear and visible.</Text>
              <View style={styles.bottomActions}><ActionButton title="Scan Again" subtitle="Return to camera" icon="⌕" onPress={resetScanner} variant="primary" /><ActionButton title="Back Home" subtitle="Return to dashboard" icon="⌂" onPress={() => router.replace("/home")} /></View>
            </GlassPanel>
          )}
        </V21Screen>
      )}
    </View>
  );
}

const cornerBase = { position: "absolute" as const, width: 36, height: 36, borderColor: COLORS.aqua };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ink },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraOverlay: { flex: 1, paddingTop: 54, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, justifyContent: "space-between" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  roundButtonText: { color: COLORS.primary, fontSize: 28, fontWeight: "900" },
  statusPill: { backgroundColor: "rgba(3,24,27,0.68)", borderWidth: 1, borderColor: "rgba(106,242,224,0.25)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  statusPillText: { color: "#FFFFFF", fontWeight: "900" },
  scanFrame: { alignSelf: "center", width: "82%", aspectRatio: 1.12, borderRadius: 28, borderWidth: 1, borderColor: "rgba(106,242,224,0.18)", backgroundColor: "rgba(3,24,27,0.10)" },
  cornerTL: { ...cornerBase, top: -1, left: -1, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 28 },
  cornerTR: { ...cornerBase, top: -1, right: -1, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 28 },
  cornerBL: { ...cornerBase, bottom: -1, left: -1, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 28 },
  cornerBR: { ...cornerBase, bottom: -1, right: -1, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 28 },
  scanDock: { backgroundColor: "rgba(255,255,255,0.92)" },
  scanTitle: { color: COLORS.ink, fontSize: 22, fontWeight: "900" },
  scanSubtitle: { marginTop: 6, color: COLORS.muted, fontWeight: "700", lineHeight: 20 },
  spinner: { marginTop: SPACING.md },
  permissionPanel: { gap: SPACING.md },
  resultPanel: { gap: SPACING.md, marginBottom: SPACING.md },
  productHeader: { flexDirection: "row", gap: SPACING.md, alignItems: "center" },
  productImage: { width: 92, height: 92, borderRadius: RADIUS.lg, backgroundColor: "#FFFFFF" },
  productImagePlaceholder: { width: 92, height: 92, borderRadius: RADIUS.lg, backgroundColor: COLORS.ice, alignItems: "center", justifyContent: "center" },
  productImageText: { color: COLORS.primary, fontSize: 28, fontWeight: "900" },
  productCopy: { flex: 1, gap: 6 },
  productName: { color: COLORS.ink, fontSize: 22, lineHeight: 27, fontWeight: "900" },
  brand: { color: COLORS.muted, fontWeight: "800" },
  resultSummary: { flexDirection: "row", gap: SPACING.md },
  summaryBox: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: "rgba(5,123,117,0.06)", borderWidth: 1, borderColor: COLORS.border },
  summaryBoxWarn: { backgroundColor: COLORS.moderateSubtle, borderColor: "rgba(249,115,22,0.22)" },
  summaryBoxSafe: { backgroundColor: COLORS.safeSubtle, borderColor: "rgba(22,163,74,0.22)" },
  summaryNumber: { color: COLORS.ink, fontSize: 28, fontWeight: "900" },
  summaryText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  sectionPanel: { gap: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.ink, fontSize: 18, fontWeight: "900" },
  ingredients: { color: COLORS.text, lineHeight: 22, fontWeight: "600" },
  body: { color: COLORS.text, lineHeight: 22, fontWeight: "600" },
  matchList: { gap: SPACING.sm },
  matchCard: { backgroundColor: COLORS.moderateSubtle, borderWidth: 1, borderColor: "rgba(249,115,22,0.18)", borderRadius: RADIUS.lg, padding: SPACING.md },
  matchTitle: { color: COLORS.ink, fontWeight: "900", fontSize: 15 },
  matchKeywords: { marginTop: 5, color: COLORS.text, fontWeight: "700", lineHeight: 19 },
  noMatchText: { color: COLORS.safe, fontWeight: "800", lineHeight: 21 },
  noticeCard: { padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(255,255,255,0.80)" },
  noticeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPACING.sm },
  noticeTitle: { flex: 1, color: COLORS.text, fontWeight: "900" },
  noticeNote: { marginTop: 7, color: COLORS.muted, lineHeight: 19, fontWeight: "600" },
  disclaimerPanel: { backgroundColor: "rgba(220,38,38,0.07)", borderColor: "rgba(220,38,38,0.16)", gap: 6, marginBottom: SPACING.md },
  disclaimerTitle: { color: COLORS.high, fontWeight: "900" },
  disclaimerText: { color: COLORS.text, lineHeight: 20, fontWeight: "700" },
  bottomActions: { gap: SPACING.md, marginBottom: SPACING.xl },
});
