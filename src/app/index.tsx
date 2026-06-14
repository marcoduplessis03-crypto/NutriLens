import {
  Cinzel_400Regular,
  Cinzel_700Bold,
  useFonts,
} from "@expo-google-fonts/cinzel";
import { Redirect, router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

import { getUserProfile, UserProfile } from "../storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../theme";

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
  const [shouldGoToTerms, setShouldGoToTerms] = useState(false);

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

  async function checkProfileAfterIntro() {
    const activeProfile = await getUserProfile();

    if (!activeProfile) {
      setProfile(null);
      setShouldGoToTerms(true);
      return;
    }

    setProfile(activeProfile);
    setShouldGoToTerms(false);
    setIntroFinished(true);

    Animated.parallel([
      Animated.timing(welcomeFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeSlide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }

  useFocusEffect(
    useCallback(() => {
      async function refreshProfile() {
        if (!introFinished) return;

        const activeProfile = await getUserProfile();

        if (!activeProfile) {
          setProfile(null);
          setShouldGoToTerms(true);
          return;
        }

        setProfile(activeProfile);
        setShouldGoToTerms(false);
      }

      refreshProfile();
    }, [introFinished])
  );

  useEffect(() => {
    if (!fontsLoaded) return;

    setProfile(null);
    setIntroFinished(false);
    setShouldGoToTerms(false);

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

    const introAnimation = Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(logoY, {
          toValue: -height * 0.22,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.72,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(lettersFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(nScale, {
          toValue: 0.9,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lScale, {
          toValue: 0.9,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(middleFade, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(middleSlide, {
          toValue: 0,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(lettersFade, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(middleFade, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]);

    introAnimation.start(() => {
      checkProfileAfterIntro();
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

    return () => {
      introAnimation.stop();
      pulseAnimation.stop();
    };
  }, [fontsLoaded]);

  if (shouldGoToTerms) {
    return <Redirect href="/terms-disclaimer" />;
  }

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  function handleGetStarted() {
    router.push("/scanner");
  }

  function handleSelectProfile() {
    router.push("/profile-select");
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {!introFinished && (
        <View style={styles.introContainer}>
          <Animated.Image
            source={eyeLogo}
            resizeMode="contain"
            style={[
              styles.introLogo,
              {
                opacity: logoFade,
                transform: [{ translateY: logoY }, { scale: logoScale }],
              },
            ]}
          />

          <Animated.View style={styles.lettersContainer}>
            <View style={styles.wordBuildRow}>
              <Animated.Text
                style={[
                  styles.bigLetter,
                  {
                    opacity: lettersFade,
                    transform: [{ scale: nScale }],
                  },
                ]}
              >
                N
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.wordPart,
                  {
                    opacity: middleFade,
                    transform: [{ translateY: middleSlide }],
                  },
                ]}
              >
                utri
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.bigLetter,
                  {
                    opacity: lettersFade,
                    transform: [{ scale: lScale }],
                  },
                ]}
              >
                L
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.wordPart,
                  {
                    opacity: middleFade,
                    transform: [{ translateY: middleSlide }],
                  },
                ]}
              >
                ens
              </Animated.Text>
            </View>
          </Animated.View>
        </View>
      )}

      {introFinished && profile && (
        <>
          <Pressable
            style={styles.profileManageButton}
            onPress={() => router.push("/profile-manage")}
          >
            <Text style={styles.profileManageButtonText}>⚙️</Text>
          </Pressable>

          <Animated.View
            style={[
              styles.shapeOne,
              {
                transform: [{ scale: shapePulse }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.shapeTwo,
              {
                transform: [{ scale: shapePulse }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.welcomeContent,
              {
                opacity: welcomeFade,
                transform: [{ translateY: welcomeSlide }],
              },
            ]}
          >
            <Image source={wordmark} resizeMode="contain" style={styles.wordmark} />

            <Text style={styles.title}>Welcome, {profile.name}</Text>

            <Text style={styles.subtitle}>Scan smarter. Check labels faster.</Text>

            <Text style={styles.description}>
              NutriLens helps you scan food products, flag ingredients you choose
              to avoid, and view basic nutrient awareness information.
            </Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.dot} />
                <Text style={styles.cardText}>Local profile storage</Text>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.dot} />
                <Text style={styles.cardText}>Personal avoid-list checks</Text>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.dot} />
                <Text style={styles.cardText}>Simple barcode scanning</Text>
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Continue to Scanner</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleSelectProfile}>
              <Text style={styles.secondaryButtonText}>Select Profile</Text>
            </Pressable>

            <Text style={styles.footerText}>
              No account needed. Your profiles stay on this device.
            </Text>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  introContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  introLogo: {
    width: 220,
    height: 220,
    position: "absolute",
  },
  lettersContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  wordBuildRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  bigLetter: {
    fontFamily: "CinzelBold",
    fontSize: 80,
    color: COLORS.primary,
  },
  wordPart: {
    fontFamily: "CinzelBold",
    fontSize: 42,
    color: COLORS.primary,
    marginHorizontal: -3,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: height * 0.08,
    paddingBottom: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    width: width * 0.78,
    height: 95,
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: "CinzelBold",
    fontSize: 30,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: COLORS.muted,
    maxWidth: 340,
    marginBottom: SPACING.xl,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  cardText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 17,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "rgba(15, 118, 110, 0.08)",
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.16)",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  footerText: {
    marginTop: SPACING.lg,
    fontSize: 12,
    color: COLORS.muted,
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
  },
  profileManageButtonText: {
    fontSize: 20,
  },
  shapeOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(15, 118, 110, 0.06)",
    top: -80,
    right: -90,
  },
  shapeTwo: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 80,
    backgroundColor: "rgba(22, 163, 74, 0.07)",
    bottom: 70,
    left: -90,
  },
});