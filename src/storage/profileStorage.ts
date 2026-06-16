import AsyncStorage from "@react-native-async-storage/async-storage";

export type AvoidOption = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
};

export type UserProfile = {
  id: string;
  name: string;
  avoidIds: string[];
  createdAt: string;
  updatedAt?: string;
};

export const AVOID_OPTIONS: AvoidOption[] = [
  { id: "phosphates", label: "Phosphates", description: "Flags common phosphate additives and phosphate wording.", keywords: ["phosphate", "phosphoric", "polyphosphate", "diphosphate", "triphosphate", "e338", "e339", "e340", "e341", "e450", "e451", "e452"] },
  { id: "potassium_additives", label: "Potassium additives", description: "Flags potassium salts and additive wording.", keywords: ["potassium", "potassium chloride", "potassium sorbate", "potassium carbonate", "potassium citrate", "e202", "e501", "e332"] },
  { id: "sodium_salt", label: "Sodium / salt", description: "Flags salt and sodium wording.", keywords: ["salt", "sodium", "sodium chloride", "sea salt", "brine"] },
  { id: "added_sugars", label: "Added sugars", description: "Flags common added sugar names.", keywords: ["sugar", "glucose", "fructose", "sucrose", "dextrose", "maltose", "syrup", "corn syrup", "honey", "molasses", "caramel"] },
  { id: "gluten_wheat", label: "Gluten / wheat", description: "Flags wheat, gluten and related grains.", keywords: ["wheat", "gluten", "barley", "rye", "spelt", "malt"] },
  { id: "dairy", label: "Dairy", description: "Flags milk and common dairy-derived ingredients.", keywords: ["milk", "whey", "lactose", "casein", "caseinate", "butter", "cream", "cheese", "milk powder", "skimmed milk"] },
  { id: "nuts", label: "Nuts", description: "Flags common tree nuts and peanuts.", keywords: ["peanut", "almond", "cashew", "hazelnut", "walnut", "pecan", "pistachio", "macadamia", "brazil nut"] },
  { id: "caffeine", label: "Caffeine", description: "Flags caffeine-containing ingredients.", keywords: ["caffeine", "coffee", "guarana", "yerba mate", "green tea extract"] },
  { id: "msg", label: "MSG", description: "Flags monosodium glutamate and MSG wording.", keywords: ["monosodium glutamate", "msg", "e621", "glutamate"] },
  { id: "yeast_extract", label: "Yeast extract", description: "Flags yeast extract and autolysed yeast wording.", keywords: ["yeast extract", "autolyzed yeast", "autolysed yeast"] },
  { id: "artificial_sweeteners", label: "Artificial sweeteners", description: "Flags common non-sugar sweeteners.", keywords: ["aspartame", "sucralose", "acesulfame", "saccharin", "cyclamate", "stevia", "e951", "e955", "e950", "e954", "e952"] },
  { id: "sulphites", label: "Sulphites", description: "Flags sulphite preservatives.", keywords: ["sulphite", "sulfite", "sulfur dioxide", "sulphur dioxide", "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228"] },
  { id: "nitrates_nitrites", label: "Nitrates / nitrites", description: "Flags nitrate and nitrite preservatives.", keywords: ["nitrate", "nitrite", "sodium nitrite", "potassium nitrate", "e249", "e250", "e251", "e252"] },
  { id: "colourants", label: "Colourants", description: "Flags common colourant wording and selected E-numbers.", keywords: ["colour", "color", "colourant", "colorant", "tartrazine", "sunset yellow", "allura red", "brilliant blue", "e102", "e110", "e129", "e133"] },
  { id: "preservatives", label: "Preservatives", description: "Flags common preservative wording.", keywords: ["preservative", "benzoate", "sorbate", "sodium benzoate", "potassium sorbate", "e200", "e202", "e210", "e211"] },
];

const PROFILES_KEY = "nutrilens_user_profiles";
const ACTIVE_PROFILE_KEY = "nutrilens_active_profile_id";

function normalizeProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<UserProfile>;
  if (!raw.id || !raw.name || !Array.isArray(raw.avoidIds)) return null;
  return {
    id: String(raw.id),
    name: String(raw.name),
    avoidIds: raw.avoidIds.map(String),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
  };
}

export async function getUserProfiles(): Promise<UserProfile[]> {
  try {
    const saved = await AsyncStorage.getItem(PROFILES_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProfile).filter(Boolean) as UserProfile[];
  } catch (error) {
    console.log("Failed to load profiles:", error);
    return [];
  }
}

export async function saveUserProfiles(profiles: UserProfile[]): Promise<void> {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function createUserProfile(name: string, avoidIds: string[]): Promise<UserProfile> {
  const profiles = await getUserProfiles();
  const profile: UserProfile = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name.trim() || "My Profile",
    avoidIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const nextProfiles = [profile, ...profiles];
  await saveUserProfiles(nextProfiles);
  await setActiveProfileId(profile.id);
  return profile;
}

export async function updateUserProfile(updatedProfile: UserProfile): Promise<void> {
  const profiles = await getUserProfiles();
  const nextProfiles = profiles.map((profile) =>
    profile.id === updatedProfile.id
      ? { ...updatedProfile, updatedAt: new Date().toISOString() }
      : profile
  );
  await saveUserProfiles(nextProfiles);
}

export async function deleteUserProfile(profileId: string): Promise<void> {
  const profiles = await getUserProfiles();
  const nextProfiles = profiles.filter((profile) => profile.id !== profileId);
  await saveUserProfiles(nextProfiles);
  const activeId = await getActiveProfileId();
  if (activeId === profileId) {
    await setActiveProfileId(nextProfiles[0]?.id ?? null);
  }
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch (error) {
    console.log("Failed to read active profile:", error);
    return null;
  }
}

export async function setActiveProfileId(profileId: string | null): Promise<void> {
  if (!profileId) {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
    return;
  }
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

export async function getActiveProfile(): Promise<UserProfile | null> {
  const profiles = await getUserProfiles();
  const activeProfileId = await getActiveProfileId();
  return profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return getActiveProfile();
}

export async function signOutUser(): Promise<void> {
  await setActiveProfileId(null);
}
