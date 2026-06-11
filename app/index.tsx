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
import { getUserProfile, UserProfile } from "../src/storage/profileStorage";
import { COLORS, RADIUS, SPACING } from "../src/theme";

const { width, height } = Dimensions.get("window");

const eyeLogo = require("../assets/images/nutrilens-eye-logo.png");
const wordmark = require("../assets/images/nutrilens-wordmark.png");

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
  const nMove = useRef(new Animated.Value(0)).current;
  const lMove = useRef(new Animated.Value(0)).current;

  const welcomeFade = useRef(new Animated.Value(0)).current;
  const welcomeSlide = useRef(new Animated.Value(25)).current;

  const shapePulse = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      async function loadProfile() {
        const savedProfile = await getUserProfile();
        setProfile(savedProfile);
      }

      loadProfile();
    }, [])
  );

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.sequence([
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
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(nMove, {
          toValue: -55,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lMove, {
          toValue: 55,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(800),

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
      ]),
    ]).start(() => {
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
    });

    Animated.loop(
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
    ).start();
  }, [fontsLoaded]);

  function handleGetStarted() {
    if (profile) {
      router.push("/scanner");
    } else {
      router.push("/profile-setup");
    }
  }

  if (!fontsLoaded) {
    return <View style={styles.container} />;
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

          <Animated.View style={[styles.lettersContainer, { opacity: lettersFade }]}>
            <Animated.Text
              style={[
                styles.bigLetter,
                {
                  transform: [{ translateX: nMove }],
                },
              ]}
            >
              N
            </Animated.Text>

            <Animated.Text
              style={[
                styles.bigLetter,
                {
                  transform: [{ translateX: lMove }],
                },
              ]}
            >
              L
            </Animated.Text>
          </Animated.View>
        </View>
      )}

      {introFinished && (
        <>
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

            <Text style={styles.title}>
              {profile ? `Welcome, ${profile.name}` : "Welcome"}
            </Text>

            <Text style={styles.subtitle}>Scan smarter. Eat safer.</Text>

            <Text style={styles.description}>
              NutriLens checks food products for ingredient and nutrition risks based on
              your personal health profile.
            </Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.dot} />
                <Text style={styles.cardText}>Offline profile storage</Text>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.dot} />
                <Text style={styles.cardText}>Condition-specific warnings</Text>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.dot} />
                <Text style={styles.cardText}>Simple barcode scanning</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>
                {profile ? "Continue" : "Get Started"}
              </Text>
            </Pressable>

            {profile && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/scanner",
                    params: { mode: "friend" },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Scan for a Friend</Text>
              </Pressable>
            )}

            <Text style={styles.footerText}>
              No account needed. Your profile stays on this device.
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  bigLetter: {
    fontFamily: "CinzelBold",
    fontSize: 86,
    color: COLORS.primary,
    letterSpacing: 2,
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
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
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
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
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

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  footerText: {
    marginTop: SPACING.lg,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
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
    transform: [{ rotate: "24deg" }],
  },
});