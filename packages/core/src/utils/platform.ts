import { Platform } from "react-native";
import { optionalRequire } from "./optionalRequire";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

/**
 * Pick a value per platform — mobile-scoped variant of Platform.select
 * with an ergonomic signature.
 */
export function platformSelect<T>(options: { ios?: T; android?: T; default: T }): T {
  return Platform.select(options) ?? options.default;
}

/** True when running in Expo Go (approximation — no custom native modules). */
export function isExpoGo(): boolean {
  // expo-constants exposes appOwnership 'expo' inside Expo Go. Optional peer —
  // hidden from Metro via optionalRequire so bare RN hosts still bundle.
  const Constants = optionalRequire<{ default?: { appOwnership?: string } }>(
    "expo-constants"
  )?.default;
  return Constants?.appOwnership === "expo";
}
