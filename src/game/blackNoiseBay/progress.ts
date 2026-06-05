export const SHIP_PARTS_STORAGE_KEY = "gnoheya_tcg_ship_parts";
export const NECRO_CITY_PROGRESS_STORAGE_KEY = "gnoheya_tcg_necro_city_progress";

export type ShipPartId =
  | "wood"
  | "sailcloth"
  | "helm"
  | "waterproof_material"
  | "hull_reinforcement"
  | "anchor_chain"
  | "compass"
  | "lantern";

export type BlackNoiseBayEventFlag =
  | "black_noise_bay_front_cleared"
  | "ship_required_discovered"
  | "ship_built"
  | "black_noise_bay_ship_ready"
  | "black_noise_bay_departed"
  | "black_noise_bay_leviathan_hooked"
  | "black_noise_bay_chapter_cleared"
  | "necro_market_record_found"
  | "necro_clock_mechanism_found"
  | "necro_tavern_route_found";

export type ShipProgress = {
  parts: ShipPartId[];
  flags: BlackNoiseBayEventFlag[];
};

export type NecroCitySpotId =
  | "entrance"
  | "plaza"
  | "market"
  | "residential"
  | "clock"
  | "waterfront"
  | "oldShipyard"
  | "lighthouse"
  | "shipyard";

export type NecroCityProgress = {
  unlockedSpotIds: NecroCitySpotId[];
  kruitzConsultStep: number;
};

export const SHIP_PART_LABELS: Record<ShipPartId, string> = {
  wood: "木材",
  sailcloth: "帆布",
  helm: "舵輪",
  waterproof_material: "防水材",
  hull_reinforcement: "船底補強材",
  anchor_chain: "錨鎖",
  compass: "羅針盤",
  lantern: "航海灯",
};

export const SHIP_PART_IDS: ShipPartId[] = [
  "wood",
  "sailcloth",
  "helm",
  "waterproof_material",
  "hull_reinforcement",
  "anchor_chain",
  "compass",
  "lantern",
];

export const NECRO_CITY_INITIAL_UNLOCKED_SPOT_IDS: NecroCitySpotId[] = ["entrance", "plaza"];
export const NECRO_CITY_UNLOCK_ORDER: NecroCitySpotId[] = [
  "market",
  "residential",
  "clock",
  "waterfront",
  "oldShipyard",
  "lighthouse",
  "shipyard",
];
export const NECRO_CITY_ALL_SPOT_IDS: NecroCitySpotId[] = [
  ...NECRO_CITY_INITIAL_UNLOCKED_SPOT_IDS,
  ...NECRO_CITY_UNLOCK_ORDER,
];

const KNOWN_FLAGS: BlackNoiseBayEventFlag[] = [
  "black_noise_bay_front_cleared",
  "ship_required_discovered",
  "ship_built",
  "black_noise_bay_ship_ready",
  "black_noise_bay_departed",
  "black_noise_bay_leviathan_hooked",
  "black_noise_bay_chapter_cleared",
  "necro_market_record_found",
  "necro_clock_mechanism_found",
  "necro_tavern_route_found",
];

function isShipPartId(value: unknown): value is ShipPartId {
  return typeof value === "string" && SHIP_PART_IDS.includes(value as ShipPartId);
}

function isBlackNoiseBayEventFlag(value: unknown): value is BlackNoiseBayEventFlag {
  return typeof value === "string" && KNOWN_FLAGS.includes(value as BlackNoiseBayEventFlag);
}

function isNecroCitySpotId(value: unknown): value is NecroCitySpotId {
  return typeof value === "string" && NECRO_CITY_ALL_SPOT_IDS.includes(value as NecroCitySpotId);
}

function normalizeShipProgress(value: unknown): ShipProgress {
  if (Array.isArray(value)) {
    return { parts: Array.from(new Set(value.filter(isShipPartId))), flags: [] };
  }

  if (!value || typeof value !== "object") {
    return { parts: [], flags: [] };
  }

  const raw = value as Partial<Record<keyof ShipProgress, unknown>>;
  const parts = Array.isArray(raw.parts) ? Array.from(new Set(raw.parts.filter(isShipPartId))) : [];
  const flags = Array.isArray(raw.flags) ? Array.from(new Set(raw.flags.filter(isBlackNoiseBayEventFlag))) : [];

  return { parts, flags };
}

export function readShipProgress(): ShipProgress {
  if (typeof window === "undefined") return { parts: [], flags: [] };

  try {
    const raw = window.localStorage.getItem(SHIP_PARTS_STORAGE_KEY);
    if (!raw) return { parts: [], flags: [] };
    return normalizeShipProgress(JSON.parse(raw));
  } catch {
    return { parts: [], flags: [] };
  }
}

export function writeShipProgress(progress: ShipProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHIP_PARTS_STORAGE_KEY, JSON.stringify(normalizeShipProgress(progress)));
}

export function getShipParts(): ShipPartId[] {
  return readShipProgress().parts;
}

export function hasShipPart(partId: ShipPartId): boolean {
  return getShipParts().includes(partId);
}

export function addShipPart(partId: ShipPartId): ShipProgress {
  const current = readShipProgress();
  const next = normalizeShipProgress({
    parts: [...current.parts, partId],
    flags: current.flags,
  });
  writeShipProgress(next);
  return next;
}

export function hasAllShipParts(): boolean {
  return getShipParts().length === SHIP_PART_IDS.length;
}

export function hasBlackNoiseBayEventFlag(flag: BlackNoiseBayEventFlag): boolean {
  return readShipProgress().flags.includes(flag);
}

export function addBlackNoiseBayEventFlag(flag: BlackNoiseBayEventFlag): ShipProgress {
  const current = readShipProgress();
  const next = normalizeShipProgress({
    parts: current.parts,
    flags: [...current.flags, flag],
  });
  writeShipProgress(next);
  return next;
}

function normalizeNecroCityProgress(value: unknown): NecroCityProgress {
  if (!value || typeof value !== "object") {
    return { unlockedSpotIds: [...NECRO_CITY_INITIAL_UNLOCKED_SPOT_IDS], kruitzConsultStep: 0 };
  }

  const raw = value as Partial<Record<keyof NecroCityProgress, unknown>>;
  const unlockedSpotIds = Array.isArray(raw.unlockedSpotIds)
    ? Array.from(new Set([...NECRO_CITY_INITIAL_UNLOCKED_SPOT_IDS, ...raw.unlockedSpotIds.filter(isNecroCitySpotId)]))
    : [...NECRO_CITY_INITIAL_UNLOCKED_SPOT_IDS];
  const kruitzConsultStep = typeof raw.kruitzConsultStep === "number" && Number.isFinite(raw.kruitzConsultStep)
    ? Math.max(0, Math.min(NECRO_CITY_UNLOCK_ORDER.length, Math.floor(raw.kruitzConsultStep)))
    : 0;

  return { unlockedSpotIds, kruitzConsultStep };
}

function deriveNecroCityProgressFromShip(progress: NecroCityProgress, shipProgress: ShipProgress): NecroCityProgress {
  const unlocked = new Set<NecroCitySpotId>(progress.unlockedSpotIds);
  const parts = new Set(shipProgress.parts);
  const flags = new Set(shipProgress.flags);
  const shipBuilt = flags.has("ship_built") || flags.has("black_noise_bay_ship_ready");

  if (shipBuilt) {
    return { unlockedSpotIds: [...NECRO_CITY_ALL_SPOT_IDS], kruitzConsultStep: NECRO_CITY_UNLOCK_ORDER.length };
  }

  for (let i = 0; i < progress.kruitzConsultStep; i += 1) {
    unlocked.add(NECRO_CITY_UNLOCK_ORDER[i]);
  }

  if (parts.has("sailcloth") || flags.has("necro_market_record_found") || flags.has("necro_tavern_route_found")) unlocked.add("market");
  if (parts.has("helm") || parts.has("compass") || flags.has("necro_clock_mechanism_found")) unlocked.add("clock");
  if (parts.has("waterproof_material") || parts.has("anchor_chain")) unlocked.add("waterfront");
  if (parts.has("hull_reinforcement")) unlocked.add("oldShipyard");
  if (parts.has("lantern")) unlocked.add("lighthouse");
  if (parts.size >= 2 || flags.has("necro_market_record_found")) unlocked.add("residential");
  if (SHIP_PART_IDS.every((partId) => parts.has(partId))) unlocked.add("shipyard");

  const maxUnlockedIndex = NECRO_CITY_UNLOCK_ORDER.reduce(
    (maxIndex, spotId, index) => (unlocked.has(spotId) ? Math.max(maxIndex, index + 1) : maxIndex),
    progress.kruitzConsultStep
  );

  return {
    unlockedSpotIds: NECRO_CITY_ALL_SPOT_IDS.filter((spotId) => unlocked.has(spotId)),
    kruitzConsultStep: Math.min(NECRO_CITY_UNLOCK_ORDER.length, maxUnlockedIndex),
  };
}

export function readNecroCityProgress(shipProgress = readShipProgress()): NecroCityProgress {
  if (typeof window === "undefined") return deriveNecroCityProgressFromShip(normalizeNecroCityProgress(null), shipProgress);

  try {
    const raw = window.localStorage.getItem(NECRO_CITY_PROGRESS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return deriveNecroCityProgressFromShip(normalizeNecroCityProgress(parsed), shipProgress);
  } catch {
    return deriveNecroCityProgressFromShip(normalizeNecroCityProgress(null), shipProgress);
  }
}

export function writeNecroCityProgress(progress: NecroCityProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NECRO_CITY_PROGRESS_STORAGE_KEY, JSON.stringify(normalizeNecroCityProgress(progress)));
}

export function unlockNextNecroCitySpot(shipProgress = readShipProgress()): { progress: NecroCityProgress; unlockedSpotId: NecroCitySpotId | null } {
  const current = readNecroCityProgress(shipProgress);
  const currentUnlocked = new Set(current.unlockedSpotIds);
  const nextSpotId = NECRO_CITY_UNLOCK_ORDER.find((spotId) => !currentUnlocked.has(spotId)) ?? null;

  if (!nextSpotId) {
    writeNecroCityProgress(current);
    return { progress: current, unlockedSpotId: null };
  }

  const nextProgress = normalizeNecroCityProgress({
    unlockedSpotIds: [...current.unlockedSpotIds, nextSpotId],
    kruitzConsultStep: Math.max(current.kruitzConsultStep + 1, NECRO_CITY_UNLOCK_ORDER.indexOf(nextSpotId) + 1),
  });
  writeNecroCityProgress(nextProgress);
  return { progress: readNecroCityProgress(shipProgress), unlockedSpotId: nextSpotId };
}
