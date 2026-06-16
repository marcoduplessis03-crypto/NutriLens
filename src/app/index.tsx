import {
  Cinzel_400Regular,
  Cinzel_700Bold,
  useFonts,
} from "@expo-google-fonts/cinzel";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TechBackground } from "../components/NutriLensV21";
import { getActiveProfile, UserProfile } from "../storage/profileStorage";
import { hasAcceptedTerms } from "../storage/termsAcceptance";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../theme";

const { width, height } = Dimensions.get("window");

const eyeLogo = require("../../assets/images/nutrilens-eye-logo.png");
const wordmark = require("../../assets/images/nutrilens-wordmark.png");

export default function WelcomeScreen() {
  const [fontsLoaded] = useFonts({
    CinzelRegular: Cinzel_400Regular,
    CinzelBold: Cinzel_700Bold,
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [introFinished, setIntroFinished] = useState(false);

  const logoY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoFade = useRef(new Animated.Value(1)).current;

  const lettersFade = useRef(new Animated.Value(0)).current;
  const nScale = useRef(new Animated.Value(1)).current;
  const lScale = useRef(new Animated.Value(1)).current;

  const middleFade = useRef(new Animated.Value(0)).current;
  const middleSlide = useRef(new Animated.Value(12)).current;

  const welcomeFade = useRef(new Animated.Value(0)).current;
  const welcomeSlide = useRef(new Animated.Value(25)).current;

  const shapePulse = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      async function loadProfile() {
        const activeProfile = await getActiveProfile();
        setProfile(activeProfile);
      }

      loadProfile();
    }, [])
  );

  useEffect(() => {
    if (!fontsLoaded) return;

    setIntroFinished(false);

    logoY.setValue(0);
    logoScale.setValue(1);
    logoFade.setValue(1);
    lettersFade.setValue(0);
    nScale.setValue(1);
    lScale.setValue(1);
    middleFade.setValue(0);
    middleSlide.setValue(12);
    welcomeFade.setValue(0);
    welcomeSlide.setValue(25);

    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(logoY, {
          toValue: -height * 0.22,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.72,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(220),
      Animated.parallel([
        Animated.timing(lettersFade, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nScale, {
          toValue: 0.92,
          duration: 840,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lScale, {
          toValue: 0.92,
          duration: 840,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(middleFade, {
          toValue: 1,
          duration: 840,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(middleSlide, {
          toValue: 0,
          duration: 840,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 0,
          duration: 430,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lettersFade, {
          toValue: 0,
          duration: 430,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(middleFade, {
          toValue: 0,
          duration: 430,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIntroFinished(true);
      Animated.parallel([
        Animated.timing(welcomeFade, {
          toValue: 1,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(welcomeSlide, {
          toValue: 0,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shapePulse, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shapePulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [
    fontsLoaded,
    logoY,
    logoScale,
    logoFade,
    lettersFade,
    nScale,
    lScale,
    middleFade,
    middleSlide,
    welcomeFade,
    welcomeSlide,
    shapePulse,
  ]);

  async function handleContinue() {
    const accepted = await hasAcceptedTerms();

    if (!accepted) {
      router.push("/terms-disclaimer");
      return;
    }

    router.push("/home");
  }

  async function handleScan() {
    const accepted = await hasAcceptedTerms();

    if (!accepted) {
      router.push("/terms-disclaimer");
      return;
    }

    router.push(profile ? "/scanner" : "/profile-setup");
  }

  if (!fontsLoaded) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TechBackground />

      {introFinished && (
        <Pressable style={styles.profileManageButton} onPress={() => router.push("/profile-manage")}>
          <Text style={styles.profileManageButtonText}>⚙️</Text>
        </Pressable>
      )}

      {!introFinished && (
        <View style={styles.introContainer}>
          <Animated.Image
            source={eyeLogo}
            resizeMode="contain"
            style={[styles.introLogo, { opacity: logoFade, transform: [{ translateY: logoY }, { scale: logoScale }] }]}
          />

          <Animated.View style={[styles.lettersContainer, { opacity: lettersFade }]}> 
            <View style={styles.wordBuildRow}>
              <Animated.Text style={[styles.bigLetter, { transform: [{ scale: nScale }] }]}>N</Animated.Text>
              <Animated.Text style={[styles.wordPart, { opacity: middleFade, transform: [{ translateY: middleSlide }] }]}>utri</Animated.Text>
              <Animated.Text style={[styles.bigLetter, { transform: [{ scale: lScale }] }]}>L</Animated.Text>
              <Animated.Text style={[styles.wordPart, { opacity: middleFade, transform: [{ translateY: middleSlide }] }]}>ens</Animated.Text>
            </View>
          </Animated.View>
        </View>
      )}

      {introFinished && (
        <>
          <Animated.View style={[styles.shapeOne, { transform: [{ scale: shapePulse }] }]} />
          <Animated.View style={[styles.shapeTwo, { transform: [{ scale: shapePulse }] }]} />

          <Animated.View style={[styles.welcomeContent, { opacity: welcomeFade, transform: [{ translateY: welcomeSlide }] }]}> 
            <Image source={wordmark} resizeMode="contain" style={styles.wordmark} />

            <Text style={styles.title}>{profile ? `Welcome, ${profile.name}` : "Welcome"}</Text>
            <Text style={styles.subtitle}>Scan smarter. Check labels faster.</Text>
            <Text style={styles.description}>
              NutriLens helps you scan food products, flag ingredients you choose to avoid, and view basic nutrient awareness information.
            </Text>

            <View style={styles.card}>
              <View style={styles.cardRow}><View style={styles.dot} /><Text style={styles.cardText}>Ingredient flagging from your avoid list</Text></View>
              <View style={styles.cardRow}><View style={styles.dot} /><Text style={styles.cardText}>Barcode scanning with product data lookup</Text></View>
              <View style={[styles.cardRow, styles.cardRowLast]}><View style={styles.dot} /><Text style={styles.cardText}>Local profiles. No account required.</Text></View>
            </View>

            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleContinue}>
              <Text style={styles.primaryButtonText}>Continue to Home</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={handleScan}>
              <Text style={styles.secondaryButtonText}>{profile ? "Scan Product" : "Create Profile"}</Text>
            </Pressable>

            <View style={styles.linkRow}>
              <Pressable onPress={() => router.push("/profile-select")}><Text style={styles.inlineLink}>Profiles</Text></Pressable>
              <Text style={styles.linkDot}>•</Text>
              <Pressable onPress={() => router.push("/terms-disclaimer")}><Text style={styles.inlineLink}>Terms</Text></Pressable>
              <Text style={styles.linkDot}>•</Text>
              <Pressable onPress={() => router.push("/privacy-policy")}><Text style={styles.inlineLink}>Privacy</Text></Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", overflow: "hidden" },
  introContainer: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 10 },
  introLogo: { width: 220, height: 220, position: "absolute" },
  lettersContainer: { position: "absolute", alignItems: "center", justifyContent: "center", width: "100%" },
  wordBuildRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", minWidth: 310 },
  bigLetter: { fontFamily: "CinzelBold", fontSize: 78, color: COLORS.primary, letterSpacing: 0 },
  wordPart: { fontFamily: "CinzelBold", fontSize: 42, color: COLORS.primary, marginHorizontal: -3 },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: height * 0.08,
    paddingBottom: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  wordmark: { width: width * 0.78, height: 95, marginBottom: SPACING.lg },
  title: { fontFamily: "CinzelBold", fontSize: 30, color: COLORS.text, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: "900", color: COLORS.primary, marginBottom: SPACING.md, textAlign: "center" },
  description: { fontSize: 15, lineHeight: 23, textAlign: "center", color: COLORS.muted, maxWidth: 340, marginBottom: SPACING.xl, fontWeight: "600" },
  card: { width: "100%", backgroundColor: "rgba(255,255,255,0.88)", borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl, ...SHADOWS.soft },
  cardRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md },
  cardRowLast: { marginBottom: 0 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.primary, marginRight: SPACING.md },
  cardText: { flex: 1, fontSize: 14, fontWeight: "800", color: COLORS.text, lineHeight: 20 },
  primaryButton: { width: "100%", backgroundColor: COLORS.primary, paddingVertical: 17, borderRadius: RADIUS.lg, alignItems: "center", marginBottom: SPACING.md, ...SHADOWS.strong },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  secondaryButton: { width: "100%", backgroundColor: "rgba(5,123,117,0.08)", paddingVertical: 15, borderRadius: RADIUS.lg, alignItems: "center", borderWidth: 1, borderColor: "rgba(5,123,117,0.16)" },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: "900" },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  profileManageButton: { position: "absolute", top: 56, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", zIndex: 50, ...SHADOWS.soft },
  profileManageButtonText: { fontSize: 20 },
  shapeOne: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(5,123,117,0.06)", top: -80, right: -90 },
  shapeTwo: { position: "absolute", width: 210, height: 210, borderRadius: 80, backgroundColor: "rgba(16,183,167,0.08)", bottom: 70, left: -90, transform: [{ rotate: "24deg" }] },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: SPACING.lg, gap: 8 },
  inlineLink: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },
  linkDot: { color: COLORS.muted, fontWeight: "900" },
});
