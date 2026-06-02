export const SHIP_PARTS_STORAGE_KEY = "gnoheya_tcg_ship_parts";

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
  | "necro_market_record_found"
  | "necro_clock_mechanism_found"
  | "necro_tavern_route_found";

export type ShipProgress = {
  parts: ShipPartId[];
  flags: BlackNoiseBayEventFlag[];
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

const KNOWN_FLAGS: BlackNoiseBayEventFlag[] = [
  "black_noise_bay_front_cleared",
  "ship_required_discovered",
  "ship_built",
  "black_noise_bay_ship_ready",
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
