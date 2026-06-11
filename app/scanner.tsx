import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { lookupProduct, LookupStage } from "../src/api/productLookup";
import { getUserProfile } from "../src/storage/profileStorage";
import { saveScanToHistory } from "../src/storage/scanHistory";
import { COLORS, RADIUS } from "../src/theme";
import { NormalizedProduct } from "../src/types/product";

// ─── Constants ───────────────────────────────────────────────────────────────

const BARCODE_CONFIRMATION_MS = 1200;

const AVOID_OPTIONS = [
  {
    id: "phosphates",
    label: "Phosphates",
    keywords: [
      "phosphate",
      "phosphates",
      "phosphoric acid",
      "diphosphate",
      "triphosphate",
      "polyphosphate",
      "e338",
      "e339",
      "e340",
      "e341",
      "e450",
      "e451",
      "e452",
    ],
  },
  {
    id: "potassiumAdditives",
    label: "Potassium additives",
    keywords: [
      "potassium chloride",
      "potassium phosphate",
      "potassium sorbate",
      "potassium citrate",
      "potassium bicarbonate",
      "potassium carbonate",
    ],
  },
  {
    id: "sodium",
    label: "Sodium / salt",
    keywords: ["salt", "sodium chloride", "sea salt", "sodium bicarbonate"],
  },
  {
    id: "addedSugars",
    label: "Added sugars",
    keywords: [
      "sugar",
      "glucose",
      "fructose",
      "sucrose",
      "syrup",
      "corn syrup",
      "maltodextrin",
      "dextrose",
      "honey",
      "molasses",
    ],
  },
  {
    id: "gluten",
    label: "Gluten / wheat",
    keywords: ["wheat", "gluten", "barley", "rye", "malt"],
  },
  {
    id: "dairy",
    label: "Milk / dairy",
    keywords: ["milk", "whey", "casein", "lactose", "cream", "butter"],
  },
  {
    id: "nuts",
    label: "Nuts",
    keywords: [
      "peanut",
      "almond",
      "cashew",
      "hazelnut",
      "walnut",
      "pecan",
      "pistachio",
      "macadamia",
    ],
  },
  {
    id: "caffeine",
    label: "Caffeine",
    keywords: ["caffeine", "guarana", "coffee extract", "tea extract"],
  },
  {
    id: "yeastExtract",
    label: "Yeast extract",
    keywords: ["yeast extract", "autolyzed yeast", "hydrolyzed yeast"],
  },
  {
    id: "msg",
    label: "MSG",
    keywords: ["msg", "monosodium glutamate", "e621"],
  },
];

type ScannerPhase =
  | "camera"
  | "barcode-detected"
  | "looking-up"
  | "results"
  | "not-found"
  | "error";

type IngredientMatch = {
  id: string;
  label: string;
  matchedTerms: string[];
};

type NutrientNotice = {
  nutrient: string;
  value: string;
  message: string;
};

type NutrientLevel = "Higher" | "Moderate" | "Lower" | "Unknown";

// ─── Utilities ───────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOptionLabel(id: string) {
  return AVOID_OPTIONS.find((item) => item.id === id)?.label || id;
}

function getMatchSummary(matchCount: number): string {
  if (matchCount === 0) {
    return "No selected avoided ingredients found";
  }

  if (matchCount === 1) {
    return "1 selected avoided ingredient found";
  }

  return `${matchCount} selected avoided ingredients found`;
}

function findIngredientMatches(
  ingredientsText: string,
  selectedAvoidIds: string[]
): IngredientMatch[] {
  const text = ingredientsText.toLowerCase();

  return AVOID_OPTIONS.filter((item) => selectedAvoidIds.includes(item.id))
    .map((item) => {
      const matchedTerms = item.keywords.filter((keyword) =>
        text.includes(keyword.toLowerCase())
      );

      return {
        id: item.id,
        label: item.label,
        matchedTerms,
      };
    })
    .filter((match) => match.matchedTerms.length > 0);
}

function getSodiumMg(nutriments: any): number | null {
  if (nutriments?.sodium_100g != null) {
    return Math.round(nutriments.sodium_100g * 1000);
  }

  if (nutriments?.salt_100g != null) {
    return Math.round(nutriments.salt_100g * 400);
  }

  return null;
}

function getNutrientNotices(nutriments: any): NutrientNotice[] {
  const notices: NutrientNotice[] = [];

  const sodiumMg = getSodiumMg(nutriments);

  if (sodiumMg != null && sodiumMg > 400) {
    notices.push({
      nutrient: "Sodium",
      value: `${sodiumMg} mg per 100 g/ml`,
      message: "Higher sodium level noticed.",
    });
  }

  if (nutriments?.sugars_100g != null && nutriments.sugars_100g > 10) {
    notices.push({
      nutrient: "Sugar",
      value: `${Math.round(nutriments.sugars_100g * 10) / 10} g per 100 g/ml`,
      message: "Higher sugar level noticed.",
    });
  }

  if (
    nutriments?.["saturated-fat_100g"] != null &&
    nutriments["saturated-fat_100g"] > 5
  ) {
    notices.push({
      nutrient: "Saturated fat",
      value: `${
        Math.round(nutriments["saturated-fat_100g"] * 10) / 10
      } g per 100 g/ml`,
      message: "Higher saturated fat level noticed.",
    });
  }

  return notices;
}

function nutrientLevel(
  value: number | null,
  moderate: number,
  high: number
): NutrientLevel {
  if (value == null) return "Unknown";
  if (value >= high) return "Higher";
  if (value >= moderate) return "Moderate";
  return "Lower";
}

function nutrientBadgeColors(level: NutrientLevel): { bg: string; fg: string } {
  switch (level) {
    case "Higher":
      return { bg: COLORS.highSubtle, fg: COLORS.high };
    case "Moderate":
      return { bg: COLORS.moderateSubtle, fg: COLORS.moderate };
    case "Lower":
      return { bg: COLORS.safeSubtle, fg: COLORS.safe };
    default:
      return { bg: "#F1F5F9", fg: COLORS.muted };
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NutrientRow({
  label,
  value,
  unit,
  moderate,
  high,
}: {
  label: string;
  value: number | null;
  unit: string;
  moderate: number;
  high: number;
}) {
  const level = nutrientLevel(value, moderate, high);
  const { bg, fg } = nutrientBadgeColors(level);

  return (
    <View style={styles.nutrientRow}>
      <View style={styles.nutrientTextWrap}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={styles.nutrientValue}>
          {value == null ? "Not available" : `${value} ${unit}`}
        </Text>
      </View>

      <View style={[styles.nutrientBadge, { backgroundColor: bg }]}>
        <Text style={[styles.nutrientBadgeText, { color: fg }]}>{level}</Text>
      </View>
    </View>
  );
}

function ScanFrame() {
  const SIZE = 260;
  const ARM = 36;
  const THICKNESS = 4;
  const COLOR = "#FFFFFF";

  const corner = (position: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
  }) => ({
    position: "absolute" as const,
    width: ARM,
    height: ARM,
    borderColor: COLOR,
    borderWidth: 0,
    ...position,
  });

  return (
    <View style={{ width: SIZE, height: SIZE / 2, position: "relative" }}>
      <View
        style={corner({
          top: 0,
          left: 0,
          borderTopWidth: THICKNESS,
          borderLeftWidth: THICKNESS,
          borderTopLeftRadius: 8,
        })}
      />
      <View
        style={corner({
          top: 0,
          right: 0,
          borderTopWidth: THICKNESS,
          borderRightWidth: THICKNESS,
          borderTopRightRadius: 8,
        })}
      />
      <View
        style={corner({
          bottom: 0,
          left: 0,
          borderBottomWidth: THICKNESS,
          borderLeftWidth: THICKNESS,
          borderBottomLeftRadius: 8,
        })}
      />
      <View
        style={corner({
          bottom: 0,
          right: 0,
          borderBottomWidth: THICKNESS,
          borderRightWidth: THICKNESS,
          borderBottomRightRadius: 8,
        })}
      />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const scanLock = useRef(false);

  const [phase, setPhase] = useState<ScannerPhase>("camera");
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lookupText, setLookupText] = useState("");
  const [attemptedSources, setAttemptedSources] = useState<string[]>([]);
  const [product, setProduct] = useState<NormalizedProduct | null>(null);

  const [profileName, setProfileName] = useState("");
  const [selectedAvoidIds, setSelectedAvoidIds] = useState<string[]>([]);
  const [ingredientMatches, setIngredientMatches] = useState<IngredientMatch[]>(
    []
  );
  const [nutrientNotices, setNutrientNotices] = useState<NutrientNotice[]>([]);

  useFocusEffect(
    useCallback(() => {
      resetScanner();
      loadProfile();

      return () => {
        scanLock.current = true;
      };
    }, [])
  );

  async function loadProfile() {
    const profile = await getUserProfile();

    if (!profile) {
      router.replace("/profile-setup");
      return;
    }

    setProfileName(profile.name);
    setSelectedAvoidIds(profile.avoidIds || []);
  }

  function resetScanner() {
    scanLock.current = false;
    setPhase("camera");
    setCameraReady(false);
    setBarcode("");
    setLookupText("");
    setAttemptedSources([]);
    setProduct(null);
    setIngredientMatches([]);
    setNutrientNotices([]);
    setCameraKey((k) => k + 1);
  }

  function handleLookupStage(stage: LookupStage) {
  if (stage === "open-food-facts") {
    setLookupText("Checking Open Food Facts…");
  } else {
    setLookupText("Checking product label data…");
  }
}

  async function handleBarcodeScanned(result: { data?: string }) {
    if (scanLock.current) return;

    const detectedBarcode = String(result?.data || "").trim();
    if (!detectedBarcode) return;

    scanLock.current = true;
    setBarcode(detectedBarcode);
    setPhase("barcode-detected");
    setLookupText("Barcode detected");

    await delay(BARCODE_CONFIRMATION_MS);

    setPhase("looking-up");
    setLookupText("Preparing product lookup…");

    try {
      const lookup = await lookupProduct(detectedBarcode, handleLookupStage);
      setAttemptedSources(lookup.attemptedSources);

      if (!lookup.product) {
        setPhase("not-found");
        return;
      }

      const p = lookup.product;

      const matches = findIngredientMatches(
        p.ingredients || "",
        selectedAvoidIds
      );

      const notices = getNutrientNotices(p.nutriments || {});

      setProduct(p);
      setIngredientMatches(matches);
      setNutrientNotices(notices);
      setPhase("results");

      try {
        await saveScanToHistory({
          barcode: p.barcode,
          productName: p.name || "Unknown product",
          brand: p.brand || "",
          imageUrl: p.image || undefined,

          matchCount: matches.length,
          ingredientMatches: matches,
          nutrientNotices: notices,
          avoidIds: selectedAvoidIds,

          ingredients: p.ingredients || "",
          nutriments: p.nutriments || {},

          // Temporary old fields so history will not break yet.
          // We will update history.tsx and history-detail.tsx next.
          riskScore: 0,
          riskLevel:
            matches.length > 0
              ? "Contains selected ingredient"
              : "No selected ingredients found",
          warningCount: matches.length,
          warnings: matches.map(
            (match) =>
              `${match.label}: ${match.matchedTerms.slice(0, 6).join(", ")}`
          ),
          conditions: selectedAvoidIds,
          riskReasons: [],
        } as any);
      } catch (historyError) {
        console.warn("Could not save scan history:", historyError);
      }
    } catch (error) {
      console.error("Product lookup failed:", error);
      setPhase("error");
    }
  }

  // ── Permission gates ────────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>Camera permission needed</Text>
        <Text style={styles.centerText}>
          NutriLens uses your camera to scan food barcodes.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant camera permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera view ─────────────────────────────────────────────────────────

  if (
    phase === "camera" ||
    phase === "barcode-detected" ||
    phase === "looking-up"
  ) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          key={cameraKey}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(error) => {
            console.error("Camera mount error:", error);
            setPhase("error");
          }}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
          onBarcodeScanned={phase === "camera" ? handleBarcodeScanned : undefined}
        />

        <View style={styles.cameraShade}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>Scan a food barcode</Text>
            <Text style={styles.cameraSubtitle}>
              Align the barcode within the frame
            </Text>
          </View>

          <ScanFrame />

          {!cameraReady && (
            <View style={styles.cameraStatusCard}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.cameraStatusText}>Starting camera…</Text>
            </View>
          )}

          {phase === "barcode-detected" && (
            <View style={styles.detectedCard}>
              <View style={styles.detectedIconWrap}>
                <Text style={styles.detectedIconText}>✓</Text>
              </View>
              <View style={styles.detectedTextWrap}>
                <Text style={styles.detectedTitle}>Barcode detected</Text>
                <Text style={styles.detectedBarcode}>{barcode}</Text>
              </View>
            </View>
          )}

          {phase === "looking-up" && (
            <View style={styles.detectedCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <View style={styles.detectedTextWrap}>
                <Text style={styles.detectedTitle}>{barcode}</Text>
                <Text style={styles.lookupText}>{lookupText}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────

  if (phase === "not-found") {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Pressable
  style={styles.profileManageButton}
  onPress={() => router.push("/profile-manage")}
>
  <Text style={styles.profileManageButtonText}>⚙️</Text>
</Pressable>
        <Text style={styles.stateEmoji}>🔎</Text>
        <Text style={styles.stateTitle}>Product not found</Text>
        <Text style={styles.barcodeDisplay}>Barcode: {barcode}</Text>
        <Text style={styles.centerText}>
          NutriLens checked{" "}
          {attemptedSources.join(" and ") || "the available databases"}, but
          could not find usable product information.
        </Text>
        <Text style={styles.centerText}>
          This does not mean the product does or does not contain ingredients
          from your watch list. Always check the package label.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
          <Text style={styles.primaryButtonText}>Scan again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────

  if (phase === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.stateEmoji}>⚠️</Text>
        <Text style={styles.stateTitle}>Something went wrong</Text>
        <Text style={styles.centerText}>
          NutriLens could not complete the lookup. Check your internet
          connection and try again.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Results values ──────────────────────────────────────────────────────

  const sodiumMg = getSodiumMg(product?.nutriments || {});

  const saltG =
    product?.nutriments.salt_100g == null
      ? null
      : Math.round(product.nutriments.salt_100g * 100) / 100;

  const sugarsG =
    product?.nutriments.sugars_100g == null
      ? null
      : Math.round(product.nutriments.sugars_100g * 10) / 10;

  const saturatedFatG =
    product?.nutriments["saturated-fat_100g"] == null
      ? null
      : Math.round(product.nutriments["saturated-fat_100g"]! * 10) / 10;

  const matchSummary = getMatchSummary(ingredientMatches.length);

  // ── Results ─────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.appTitle}>NutriLens</Text>
        <Text style={styles.resultsSubtitle}>
          Ingredient flagging and nutrient awareness
        </Text>
      </View>

      <View style={styles.productCard}>
        {product?.image ? (
          <Image source={{ uri: product.image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.placeholderIcon}>🥫</Text>
          </View>
        )}

        <View style={styles.productDetails}>
          <Text style={styles.productName}>
            {product?.name || "Unknown product"}
          </Text>
          <Text style={styles.productBrand}>
            {product?.brand || "Brand not listed"}
          </Text>
          <Text style={styles.productMeta}>Barcode: {barcode}</Text>
          <Text style={styles.productSource}>Source: {product?.source}</Text>
        </View>
      </View>

      <View
        style={[
          styles.summaryCard,
          ingredientMatches.length > 0
            ? styles.summaryCardFound
            : styles.summaryCardClear,
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            ingredientMatches.length > 0
              ? styles.summaryTitleFound
              : styles.summaryTitleClear,
          ]}
        >
          {matchSummary}
        </Text>

        <Text style={styles.summaryText}>
          NutriLens checked the available ingredient list against your selected
          watch profile.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your scan profile</Text>

        <View style={styles.optionWrap}>
          {selectedAvoidIds.length > 0 ? (
            selectedAvoidIds.map((id) => (
              <View key={id} style={styles.optionChip}>
                <Text style={styles.optionChipText}>{getOptionLabel(id)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No watch items selected.</Text>
          )}
        </View>

        {!!profileName && (
          <Text style={styles.profileText}>Saved profile: {profileName}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ingredient matches</Text>

        {ingredientMatches.length === 0 ? (
          <View style={styles.noMatchCard}>
            <Text style={styles.findingIcon}>✓</Text>
            <Text style={styles.findingText}>
              No selected avoided ingredients were found in the available
              ingredient text.
            </Text>
          </View>
        ) : (
          ingredientMatches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <Text style={styles.matchTitle}>{match.label}</Text>
              <Text style={styles.matchedText}>
                Matched terms: {match.matchedTerms.slice(0, 8).join(", ")}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nutrient awareness</Text>
        <Text style={styles.sectionSubtitle}>
          Values per 100 g/ml where available
        </Text>

        <NutrientRow
          label="🧂 Sodium"
          value={sodiumMg}
          unit="mg"
          moderate={120}
          high={400}
        />
        <NutrientRow
          label="🧂 Salt"
          value={saltG}
          unit="g"
          moderate={0.3}
          high={1.5}
        />
        <NutrientRow
          label="🍬 Sugar"
          value={sugarsG}
          unit="g"
          moderate={5}
          high={10}
        />
        <NutrientRow
          label="🥓 Saturated fat"
          value={saturatedFatG}
          unit="g"
          moderate={1.5}
          high={5}
        />
      </View>

      {nutrientNotices.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nutrient notices</Text>

          {nutrientNotices.map((notice) => (
            <View
              key={`${notice.nutrient}-${notice.value}`}
              style={styles.noticeCard}
            >
              <Text style={styles.noticeTitle}>{notice.nutrient}</Text>
              <Text style={styles.noticeValue}>{notice.value}</Text>
              <Text style={styles.noticeText}>{notice.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.ingredientsText}>
          {product?.ingredients ||
            "No ingredient information was supplied by the database."}
        </Text>
      </View>

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          NutriLens helps identify selected ingredients and nutrient information
          from available third-party product data. It does not provide medical
          advice, diagnosis, treatment, or personalised dietary recommendations.
          Product information may be incomplete or inaccurate, so always check
          the physical product packaging.
        </Text>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/profile-setup")}>
        <Text style={styles.secondaryButtonText}>Edit scan profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
        <Text style={styles.primaryButtonText}>Scan another product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 24,
    gap: 8,
  },
  centerText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 420,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  stateEmoji: {
    fontSize: 46,
    marginBottom: 4,
  },
  barcodeDisplay: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  primaryButton: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryButton: {
    width: "100%",
    marginTop: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 70,
    paddingBottom: 45,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  cameraHeader: {
    backgroundColor: COLORS.overlayDark,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 22,
    alignItems: "center",
  },
  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  cameraSubtitle: {
    color: "#E2E8F0",
    fontSize: 13,
    marginTop: 5,
  },
  cameraStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.68)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
  },
  cameraStatusText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  detectedCard: {
    width: "100%",
    maxWidth: 440,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.overlayLight,
    padding: 16,
    borderRadius: 22,
    minHeight: 80,
  },
  detectedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.safeSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  detectedIconText: {
    color: COLORS.safe,
    fontSize: 22,
    fontWeight: "900",
  },
  detectedTextWrap: {
    flex: 1,
  },
  detectedTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  detectedBarcode: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
    letterSpacing: 1,
  },
  lookupText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  resultsContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 55,
    paddingBottom: 55,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  appTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
  },
  resultsSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    gap: 14,
  },
  productImage: {
    width: 88,
    height: 88,
    resizeMode: "contain",
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  productImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 36,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  productBrand: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
  },
  productMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  productSource: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
  },
  summaryCardFound: {
    backgroundColor: COLORS.moderateSubtle,
    borderColor: COLORS.moderate,
  },
  summaryCardClear: {
    backgroundColor: COLORS.safeSubtle,
    borderColor: COLORS.safe,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  summaryTitleFound: {
    color: COLORS.moderate,
  },
  summaryTitleClear: {
    color: COLORS.safe,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },

  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  optionChip: {
    backgroundColor: "#E0F2F1",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  optionChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  profileText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },

  noMatchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.safeSubtle,
    borderRadius: RADIUS.md,
    padding: 13,
    marginTop: 10,
  },
  findingIcon: {
    fontSize: 18,
  },
  findingText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  matchCard: {
    backgroundColor: COLORS.moderateSubtle,
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 10,
  },
  matchTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  matchedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 8,
  },
  nutrientTextWrap: {
    flex: 1,
  },
  nutrientLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  nutrientValue: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  nutrientBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  nutrientBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  noticeCard: {
    backgroundColor: COLORS.moderateSubtle,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 8,
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  noticeValue: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },
  noticeText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  ingredientsText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  disclaimerCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.lg,
    padding: 15,
    marginBottom: 4,
  },
  disclaimerText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  profileManageButton: {
  position: "absolute",
  top: 56,
  right: 20,
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: COLORS.card,
  borderWidth: 1,
  borderColor: COLORS.border,
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 4,
},

profileManageButtonText: {
  fontSize: 20,
},
});