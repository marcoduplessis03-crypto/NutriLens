import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton, GlassPanel, LegalLink, PageHeader, Pill, V21Screen } from "../components/NutriLensV21";
import { getActiveProfile, UserProfile } from "../storage/profileStorage";
import { hasAcceptedTerms } from "../storage/termsAcceptance";
import { COLORS, SPACING } from "../theme";

const wordmark = require("../../assets/images/nutrilens-wordmark.png");

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      async function load() {
        setProfile(await getActiveProfile());
        setTermsAccepted(await hasAcceptedTerms());
      }
      load();
    }, [])
  );

  function requireTerms(next: string) {
    if (!termsAccepted) {
      router.push({ pathname: "/terms-disclaimer", params: { next } });
      return;
    }
    router.push(next as any);
  }

  return (
    <V21Screen>
      <PageHeader title="Home" subtitle="Your scan cockpit for ingredient flagging and nutrient awareness." back={false} />

      <GlassPanel strong style={styles.heroPanel}>
        <Image source={wordmark} resizeMode="contain" style={styles.wordmark} />
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.eyebrow}>ACTIVE PROFILE</Text>
            <Text style={styles.profileName}>{profile ? profile.name : "No profile selected"}</Text>
          </View>
          <Pill tone={termsAccepted ? "safe" : "warn"}>{termsAccepted ? "Ready" : "Terms needed"}</Pill>
        </View>
        <Text style={styles.helper}>Select a profile, scan a barcode, and compare available product data against your personal avoid list.</Text>
      </GlassPanel>

      <View style={styles.actions}>
        <ActionButton title="Scan Product" subtitle={profile ? "Open barcode scanner" : "Create a profile first"} icon="⌕" onPress={() => requireTerms(profile ? "/scanner" : "/profile-setup")} variant="primary" />
        <ActionButton title="Select Profile" subtitle="Switch who you are scanning for" icon="👥" onPress={() => router.push("/profile-select")} />
        <ActionButton title="Manage Profiles" subtitle="Edit names and avoid lists" icon="⚙️" onPress={() => router.push("/profile-manage")} />
        <ActionButton title="Scan History" subtitle="Review recent product checks" icon="↺" onPress={() => router.push("/history")} />
        <ActionButton title="Favorites" subtitle="Saved products for quick reference" icon="★" onPress={() => router.push("/favorites")} />
      </View>

      <GlassPanel style={styles.legalPanel}>
        <Text style={styles.legalTitle}>Legal & app information</Text>
        <View style={styles.legalLinks}>
          <LegalLink title="Terms & Disclaimer" onPress={() => router.push("/terms-disclaimer")} />
          <LegalLink title="Privacy Policy" onPress={() => router.push("/privacy-policy")} />
          <LegalLink title="Terms of Use" onPress={() => router.push("/terms-of-use")} />
          <LegalLink title="About NutriLens" onPress={() => router.push("/disclaimer-about")} />
        </View>
      </GlassPanel>

      <Pressable style={styles.welcomeLink} onPress={() => router.replace("/")}>
        <Text style={styles.welcomeLinkText}>Replay welcome animation</Text>
      </Pressable>
    </V21Screen>
  );
}

const styles = StyleSheet.create({
  heroPanel: { gap: SPACING.md, marginBottom: SPACING.md },
  wordmark: { width: 210, height: 70, alignSelf: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md },
  eyebrow: { color: COLORS.teal, fontSize: 11, letterSpacing: 2.2, fontWeight: "900" },
  profileName: { marginTop: 4, color: COLORS.ink, fontSize: 24, fontWeight: "900" },
  helper: { color: COLORS.muted, lineHeight: 21, fontWeight: "600" },
  actions: { gap: SPACING.md },
  legalPanel: { marginTop: SPACING.lg, gap: SPACING.md },
  legalTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900" },
  legalLinks: { gap: SPACING.sm },
  welcomeLink: { marginTop: SPACING.lg, alignItems: "center" },
  welcomeLinkText: { color: COLORS.primary, fontWeight: "900", fontSize: 13 },
});
