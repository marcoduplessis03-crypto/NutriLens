import AsyncStorage from "@react-native-async-storage/async-storage";

const TERMS_ACCEPTANCE_KEY = "@nutrilens_terms_accepted_v1";

export async function hasAcceptedTerms(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TERMS_ACCEPTANCE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function acceptTerms(): Promise<void> {
  await AsyncStorage.setItem(TERMS_ACCEPTANCE_KEY, "true");
}

export async function resetTermsAcceptance(): Promise<void> {
  await AsyncStorage.removeItem(TERMS_ACCEPTANCE_KEY);
}