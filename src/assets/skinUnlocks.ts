import type { Skin } from "./imagePaths";

export const UNLOCKED_SKINS_STORAGE_KEY = "gnoheya_tcg_unlocked_skins";
export const COMIC_SKIN_ID: Skin = "comic";
export const TRAVEL_SKIN_ID: Skin = "travel";

const KNOWN_SKINS = new Set<Skin>(["default", "dark", "travel", "comic"]);
const ALWAYS_UNLOCKED_SKINS = new Set<Skin>(["default", "dark"]);

export function readUnlockedSkins(): Skin[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(UNLOCKED_SKINS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is Skin => typeof value === "string" && KNOWN_SKINS.has(value as Skin))
      : [];
  } catch {
    return [];
  }
}

export function isSkinUnlocked(skin: Skin, unlockedSkins: readonly Skin[]): boolean {
  return ALWAYS_UNLOCKED_SKINS.has(skin) || unlockedSkins.includes(skin);
}

export function unlockSkin(skin: Skin): "unlocked" | "already-unlocked" {
  const unlockedSkins = readUnlockedSkins();
  if (unlockedSkins.includes(skin)) return "already-unlocked";

  window.localStorage.setItem(UNLOCKED_SKINS_STORAGE_KEY, JSON.stringify([...unlockedSkins, skin]));
  return "unlocked";
}
