import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge NativeWind/Tailwind class names.
 * Resolves conflicts so the last conflicting utility wins.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
