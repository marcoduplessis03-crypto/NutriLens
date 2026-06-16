import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="profile-select" />
      <Stack.Screen name="profile-manage" />
      <Stack.Screen name="history" />
      <Stack.Screen name="history-detail" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="terms-disclaimer" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-of-use" />
      <Stack.Screen name="disclaimer-about" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
