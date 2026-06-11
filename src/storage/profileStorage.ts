import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserProfile = {
  name: string;
  conditions: string[];
  createdAt: string;
};

const PROFILE_KEY = "nutrilens_user_profile";

export async function saveUserProfile(profile: UserProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);

  if (!savedProfile) {
    return null;
  }

  return JSON.parse(savedProfile);
}

export async function clearUserProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}