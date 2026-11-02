/**
 * Runtime require that bundlers can't statically analyze.
 *
 * Metro resolves every literal `require("pkg")` at bundle time and fails the
 * whole build when the package is absent — a try/catch does NOT help. For
 * genuinely-optional peers (expo-haptics, safe-area-context, expo-constants)
 * the specifier must be hidden from static analysis, hence eval("require").
 * If the module isn't installed, this resolves to null and callers degrade.
 */
export function optionalRequire<T>(name: string): T | null {
  try {
    const req = eval("require") as (n: string) => T;
    return req(name);
  } catch {
    return null;
  }
}
