import { router } from "expo-router";
import React, { PropsWithChildren, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { COLORS, RADIUS, SHADOWS, SPACING } from "../theme";

const wordmarkLogo = require("../../assets/images/nutrilens-wordmark.png");
const techField = require("../../assets/images/nutrilens-tech-field.png");

export const NL21 = {
  ink: COLORS.ink,
  text: COLORS.text,
  muted: COLORS.muted,
  primary: COLORS.primary,
  teal: COLORS.teal,
  aqua: COLORS.aqua,
  ice: COLORS.ice,
  paper: COLORS.card,
  line: COLORS.line,
  danger: COLORS.high,
};

type V21ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  variant?: "welcome" | "plain" | "dark";
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function TechBackground() {
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    driftAnimation.start();
    pulseAnimation.start();

    return () => {
      driftAnimation.stop();
      pulseAnimation.stop();
    };
  }, [drift, pulse]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.58] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View pointerEvents="none" style={styles.backgroundRoot}>
      <ImageBackground source={techField} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.techImage} />

      <Animated.View style={[styles.glowOne, { opacity, transform: [{ scale }, { translateY }] }]} />
      <Animated.View style={[styles.glowTwo, { opacity, transform: [{ translateX }] }]} />
      <Animated.View style={[styles.glowThree, { opacity: 0.24, transform: [{ scale }] }]} />
    </View>
  );
}

export function V21Screen({ children, scroll = true, contentStyle }: V21ScreenProps) {
  if (!scroll) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <TechBackground />
        <View style={[styles.content, styles.contentNoScroll, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TechBackground />
      <ScrollView style={styles.contentScroll} contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

export function GlassPanel({ children, strong = false, style }: PropsWithChildren<{ strong?: boolean; style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.glassPanel, strong ? SHADOWS.strong : SHADOWS.soft, style]}>{children}</View>;
}

export function PageHeader({ title, subtitle, back = true }: { title: string; subtitle?: string; back?: boolean }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerTopRow}>
        {back ? (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonGhost} />
        )}
        <Image source={wordmarkLogo} style={styles.headerLogo} resizeMode="contain" />
        <View style={styles.backButtonGhost} />
      </View>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

type ActionButtonProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export function ActionButton({ title, subtitle, icon = "⌁", onPress, disabled = false, variant = "secondary" }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "primary" && styles.actionButtonPrimary,
        variant === "danger" && styles.actionButtonDanger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, variant === "primary" && styles.actionIconPrimary]}>
        <Text style={[styles.actionIconText, variant === "primary" && styles.actionIconTextPrimary]}>{icon}</Text>
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, variant === "primary" && styles.actionTitlePrimary]}>{title}</Text>
        {subtitle ? <Text style={[styles.actionSubtitle, variant === "primary" && styles.actionSubtitlePrimary]}>{subtitle}</Text> : null}
      </View>
      <Text style={[styles.actionChevron, variant === "primary" && styles.actionChevronPrimary]}>›</Text>
    </Pressable>
  );
}

export function LegalLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.legalLinkText}>{title}</Text>
      <Text style={styles.legalLinkArrow}>›</Text>
    </Pressable>
  );
}

export function Pill({ children, tone = "primary" }: PropsWithChildren<{ tone?: "primary" | "safe" | "warn" | "danger" }>) {
  const colors = {
    primary: [COLORS.primary, "rgba(5,123,117,0.10)"],
    safe: [COLORS.safe, COLORS.safeSubtle],
    warn: [COLORS.moderate, COLORS.moderateSubtle],
    danger: [COLORS.high, COLORS.highSubtle],
  } as const;
  return (
    <View style={[styles.pill, { backgroundColor: colors[tone][1], borderColor: colors[tone][0] + "33" }]}>
      <Text style={[styles.pillText, { color: colors[tone][0] }]}>{children}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <GlassPanel style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundRoot: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  techImage: {
    opacity: 0.8,
  },
  glowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(106,242,224,0.20)",
    top: 40,
    right: -110,
  },
  glowTwo: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(5,123,117,0.12)",
    bottom: 70,
    left: -100,
  },
  glowThree: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(16,183,167,0.16)",
    bottom: -40,
    right: 22,
  },
  contentScroll: {
    flex: 1,
  },
  contentNoScroll: {
    flex: 1,
  },
  content: {
    minHeight: "100%",
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  pageHeader: {
    marginBottom: SPACING.lg,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  headerLogo: {
    width: 170,
    height: 54,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.90)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 34,
    lineHeight: 38,
    color: COLORS.primary,
    fontWeight: "800",
  },
  backButtonGhost: {
    width: 44,
    height: 44,
  },
  pageTitle: {
    color: COLORS.ink,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    marginTop: SPACING.sm,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  actionButton: {
    minHeight: 78,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonDanger: {
    borderColor: "rgba(220,38,38,0.22)",
    backgroundColor: COLORS.highSubtle,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,123,117,0.08)",
  },
  actionIconPrimary: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  actionIconText: {
    color: COLORS.primary,
    fontSize: 23,
    fontWeight: "900",
  },
  actionIconTextPrimary: {
    color: "#FFFFFF",
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  actionTitlePrimary: {
    color: "#FFFFFF",
  },
  actionSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  actionSubtitlePrimary: {
    color: "rgba(255,255,255,0.78)",
  },
  actionChevron: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: "900",
  },
  actionChevronPrimary: {
    color: "#FFFFFF",
  },
  disabled: {
    opacity: 0.52,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  legalLink: {
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(5,123,117,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legalLinkText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  legalLinkArrow: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  pill: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: "900",
  },
  emptyMessage: {
    marginTop: SPACING.sm,
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 21,
    fontWeight: "600",
  },
});
