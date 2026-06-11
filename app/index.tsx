import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../src/theme";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Background Shapes */}
      <Animated.View
        style={[
          styles.shapeLarge,
          {
            transform: [{ rotate: rotation }, { scale: pulseAnim }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.shapeMedium,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <View style={styles.shapeSmall} />
      <View style={styles.shapeSoft} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoOuter}>
            <View style={styles.logoLens}>
              <View style={styles.logoLeaf} />
              <View style={styles.logoDot} />
            </View>
          </View>
        </View>

        <Text style={styles.appName}>NutriLens</Text>

        <Text style={styles.tagline}>
          Scan smarter. Eat safer.
        </Text>

        <Text style={styles.description}>
          Instantly check food products for condition-specific ingredient and
          nutrition risks — designed for kidney disease, diabetes, hypertension,
          heart health, gout and allergies.
        </Text>

        <View style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon} />
            <Text style={styles.featureText}>Offline-first health guidance</Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon} />
            <Text style={styles.featureText}>Barcode-based product checks</Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon} />
            <Text style={styles.featureText}>Personalized risk warnings</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
          onPress={() => router.push("/scanner")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.secondaryButtonText}>Scan a Product</Text>
        </Pressable>

        <Text style={styles.footerText}>
          No account required. Your selections stay on this device.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: height * 0.1,
    paddingBottom: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  shapeLarge: {
    position: "absolute",
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width,
    backgroundColor: "rgba(15, 118, 110, 0.08)",
    top: -width * 0.35,
    right: -width * 0.35,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.14)",
  },

  shapeMedium: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 70,
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    bottom: 90,
    left: -90,
    transform: [{ rotate: "28deg" }],
  },

  shapeSmall: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    top: height * 0.2,
    left: 28,
    transform: [{ rotate: "18deg" }],
  },

  shapeSoft: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(220, 38, 38, 0.05)",
    bottom: -30,
    right: -20,
  },

  logoWrapper: {
    marginBottom: SPACING.lg,
  },

  logoOuter: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  logoLens: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logoLeaf: {
    width: 24,
    height: 34,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "35deg" }],
  },

  logoDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: COLORS.safe,
    right: -2,
    bottom: -2,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },

  appName: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 8,
  },

  tagline: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: COLORS.muted,
    maxWidth: 330,
    marginBottom: SPACING.xl,
  },

  featureCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  featureIcon: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },

  featureText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 17,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    width: "100%",
    backgroundColor: "rgba(15, 118, 110, 0.08)",
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.16)",
  },

  secondaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  footerText: {
    marginTop: SPACING.lg,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
  },
});