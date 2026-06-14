import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="terms-disclaimer" />
      <Stack.Screen name="terms-of-use" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="disclaimer-about" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="profile-select" />
      <Stack.Screen name="profile-manage" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="history-detail" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
