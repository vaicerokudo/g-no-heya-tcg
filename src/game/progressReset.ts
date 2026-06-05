import { UNLOCKED_SKINS_STORAGE_KEY } from "../assets/skinUnlocks";
import {
  NECRO_CITY_PROGRESS_STORAGE_KEY,
  SHIP_PARTS_STORAGE_KEY,
} from "./blackNoiseBay/progress";
import { DELTA_EVENT_FLAGS_STORAGE_KEY } from "./delta/eventFlags";
import { DELTA_MACHINE_PARTS_STORAGE_KEY } from "./delta/progress";
import { ISOLATION_PROGRESS_STORAGE_KEY } from "./isolation/progress";
import { HIDDEN_HINT_FLAGS_STORAGE_KEY } from "./scenario/hiddenHints";
import { CLEARED_SCENARIOS_STORAGE_KEY } from "./scenario/progress";
import { WASTELAND_PROGRESS_STORAGE_KEY } from "./wasteland/progress";

export const GAME_PROGRESS_STORAGE_KEYS = [
  CLEARED_SCENARIOS_STORAGE_KEY,
  UNLOCKED_SKINS_STORAGE_KEY,
  HIDDEN_HINT_FLAGS_STORAGE_KEY,
  DELTA_EVENT_FLAGS_STORAGE_KEY,
  DELTA_MACHINE_PARTS_STORAGE_KEY,
  WASTELAND_PROGRESS_STORAGE_KEY,
  SHIP_PARTS_STORAGE_KEY,
  NECRO_CITY_PROGRESS_STORAGE_KEY,
  ISOLATION_PROGRESS_STORAGE_KEY,
  // Legacy one-off flags from earlier development builds.
  "delta_chapter_cleared",
  "deli_metal_machine_unlocked",
  "wasteland_chapter_cleared",
  "black_noise_bay_chapter_cleared",
] as const;

export function hasStoredGameProgress(): boolean {
  if (typeof window === "undefined") return false;
  return GAME_PROGRESS_STORAGE_KEYS.some((key) => window.localStorage.getItem(key) !== null);
}

export function resetGameProgressStorage() {
  if (typeof window === "undefined") return;
  for (const key of GAME_PROGRESS_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}
