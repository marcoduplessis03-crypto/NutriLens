import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserProfile = {
  id: string;
  name: string;
  avoidIds: string[];
  createdAt: string;
};

type NewUserProfile = {
  name: string;
  avoidIds: string[];
  createdAt: string;
};

type ProfileUpdates = {
  name?: string;
  avoidIds?: string[];
};

const PROFILES_KEY = "nutrilens_user_profiles";
const ACTIVE_PROFILE_KEY = "nutrilens_active_profile_id";

function createProfileId() {
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getUserProfiles(): Promise<UserProfile[]> {
  try {
    const savedProfiles = await AsyncStorage.getItem(PROFILES_KEY);
    if (!savedProfiles) return [];

    const parsed = JSON.parse(savedProfiles);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveUserProfile(profile: NewUserProfile) {
  const profiles = await getUserProfiles();

  const newProfile: UserProfile = {
    id: createProfileId(),
    ...profile,
  };

  await AsyncStorage.setItem(
    PROFILES_KEY,
    JSON.stringify([...profiles, newProfile])
  );

  await setActiveProfile(newProfile.id);

  return newProfile;
}

export async function updateUserProfile(
  profileId: string,
  updates: ProfileUpdates
) {
  const profiles = await getUserProfiles();

  const updatedProfiles = profiles.map((profile) =>
    profile.id === profileId ? { ...profile, ...updates } : profile
  );

  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));

  return updatedProfiles.find((profile) => profile.id === profileId) || null;
}

export async function setActiveProfile(profileId: string) {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

export async function clearActiveProfile() {
  await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
}

export async function getActiveProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const profiles = await getUserProfiles();
  const activeProfileId = await getActiveProfileId();

  if (!activeProfileId) return null;

  return profiles.find((profile) => profile.id === activeProfileId) || null;
}

export async function signOutUser() {
  await clearActiveProfile();
}

export async function deleteProfile(profileId: string) {
  const profiles = await getUserProfiles();
  const activeProfileId = await getActiveProfileId();

  const updatedProfiles = profiles.filter((profile) => profile.id !== profileId);

  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));

  if (activeProfileId === profileId) {
    await clearActiveProfile();
  }
}

export async function deleteAllProfiles() {
  await AsyncStorage.removeItem(PROFILES_KEY);
  await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
}

export async function clearUserProfile() {
  await clearActiveProfile();
}