/**
 * Native biometric app-lock. After the first password (or passkey) login, the patient
 * can require Face ID / Touch ID / fingerprint to re-open the portal — gating the
 * already-persisted session, not a second auth factor against our server.
 *
 * Web has no biometric sensor; utils/biometric.web.ts stubs all of this to no-ops so
 * expo-local-authentication is never bundled for web.
 */
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const ENABLED_KEY = "biometric:enabled";

/** Device has biometric hardware AND the user has enrolled at least one credential. */
export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && enrolled;
}

/** Human label for whatever the device offers, so the UI can say "Face ID" not "biometrics". */
export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "fingerprint";
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return "iris";
  return "biometrics";
}

/** Whether the patient has opted into the biometric lock. */
export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ENABLED_KEY)) === "1";
}

/** Run the OS biometric prompt. Returns true only on a successful match. */
export async function authenticateBiometric(reason = "Unlock your health records"): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: "Use device passcode",
    cancelLabel: "Cancel",
  });
  return res.success;
}

/** Turn the lock on — but only after a successful biometric check, so it can't lock the user out. */
export async function enableBiometric(): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;
  const ok = await authenticateBiometric("Confirm to enable biometric unlock");
  if (!ok) return false;
  await SecureStore.setItemAsync(ENABLED_KEY, "1");
  return true;
}

export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync(ENABLED_KEY);
}
