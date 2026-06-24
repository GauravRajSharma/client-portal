/**
 * Web build: no biometric sensor. All no-ops so the lock gate and Profile toggle simply
 * never appear on web (where passkeys are the equivalent), and expo-local-authentication
 * is never bundled for the web target.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  return false;
}
export async function getBiometricLabel(): Promise<string> {
  return "biometrics";
}
export async function isBiometricEnabled(): Promise<boolean> {
  return false;
}
export async function authenticateBiometric(): Promise<boolean> {
  return true;
}
export async function enableBiometric(): Promise<boolean> {
  return false;
}
export async function disableBiometric(): Promise<void> {}
