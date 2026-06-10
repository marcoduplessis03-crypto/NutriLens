import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../src/theme";

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: "📷",
    title: "Scan any barcode",
    text: "Instantly look up food products using Open Food Facts.",
  },
  {
    icon: "🛡️",
    title: "Personalised warnings",
    text: "NutriLens checks products against your saved health profile.",
  },
  {
    icon: "🛒",
    title: "Shop with confidence",
    text: "See risk scores, ingredient insights, and clear food guidance.",
  },
];

export default function WelcomeScreen() {
  const [activeSlide, setActiveSlide] = useState(0);

  const logoScale = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const enterApp = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.logoIcon}>◉</Text>
          <Text style={styles.logoLeaf}>✓</Text>
        </Animated.View>

        <Text style={styles.title}>NutriLens</Text>
        <Text style={styles.subtitle}>
          Scan smarter. Eat safer. Understand your food.
        </Text>
      </Animated.View>

      <View style={styles.carouselCard}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (width - SPACING.lg * 2)
            );
            setActiveSlide(index);
          }}
        >
          {slides.map((slide) => (
            <View key={slide.title} style={styles.slide}>
              <Text style={styles.slideIcon}>{slide.icon}</Text>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideText}>{slide.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, activeSlide === index && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.primaryButton} onPress={enterApp}>
          <Text style={styles.primaryButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.authButton} onPress={enterApp}>
          <Text style={styles.authButtonText}>G Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.authButton} onPress={enterApp}>
          <Text style={styles.authButtonText}> Sign in with Apple</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Sign-in buttons are placeholders for now. NutriLens does not replace medical advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  glow: {
    position: "absolute",
    top: 8,
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: "#99F6E4",
    opacity: 0.35,
  },
  logoCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  logoIcon: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "900",
    marginTop: -4,
  },
  logoLeaf: {
    position: "absolute",
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },
  title: {
    fontSize: 44,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
  },
  carouselCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  slide: {
    width: width - SPACING.lg * 2,
    padding: 24,
    alignItems: "center",
  },
  slideIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },
  slideText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 18,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 22,
    backgroundColor: COLORS.primary,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    padding: 17,
    borderRadius: RADIUS.lg,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
  },
  authButton: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  authButtonText: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
  },
  disclaimer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 18,
  },
});