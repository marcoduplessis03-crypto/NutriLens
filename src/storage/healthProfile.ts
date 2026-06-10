import AsyncStorage from "@react-native-async-storage/async-storage";

const HEALTH_PROFILE_KEY = "nutrilens_health_profile";

export async function saveHealthProfile(conditions: string[]) {
  await AsyncStorage.setItem(HEALTH_PROFILE_KEY, JSON.stringify(conditions));
}

export async function getHealthProfile(): Promise<string[]> {
  const storedProfile = await AsyncStorage.getItem(HEALTH_PROFILE_KEY);

  if (!storedProfile) {
    return [];
  }

  return JSON.parse(storedProfile);
}

export async function clearHealthProfile() {
  await AsyncStorage.removeItem(HEALTH_PROFILE_KEY);
}