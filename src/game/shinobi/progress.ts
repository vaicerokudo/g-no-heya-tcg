export const SHINOBI_VILLAGE_PROGRESS_STORAGE_KEY = "gnoheya_tcg_shinobi_village_progress";

export type RokuPartId = "core_stone" | "voice_unit" | "eye_tracker" | "tail_drive" | "memory_gear";

export const ROKU_PART_IDS: RokuPartId[] = [
  "core_stone",
  "voice_unit",
  "eye_tracker",
  "tail_drive",
  "memory_gear",
];

export const ROKU_PART_LABELS: Record<RokuPartId, string> = {
  core_stone: "小さな核石",
  voice_unit: "音声からくり",
  eye_tracker: "視線追尾の玉",
  tail_drive: "しっぽ駆動部",
  memory_gear: "記憶の歯車",
};

export type ShinobiVillageProgress = {
  visitedRokudoHouse: boolean;
  souunBowFound: boolean;
  souunJoined: boolean;
  nachaFound: boolean;
  nachaJoined: boolean;
  mijinJoined: boolean;
  rokuPartsQuestStarted: boolean;
  rokuPartsFound: RokuPartId[];
  rokuBuildReady: boolean;
};

const DEFAULT_PROGRESS: ShinobiVillageProgress = {
  visitedRokudoHouse: false,
  souunBowFound: false,
  souunJoined: false,
  nachaFound: false,
  nachaJoined: false,
  mijinJoined: false,
  rokuPartsQuestStarted: false,
  rokuPartsFound: [],
  rokuBuildReady: false,
};

function isRokuPartId(value: unknown): value is RokuPartId {
  return typeof value === "string" && ROKU_PART_IDS.includes(value as RokuPartId);
}

function normalizeProgress(value: unknown): ShinobiVillageProgress {
  if (!value || typeof value !== "object") return { ...DEFAULT_PROGRESS };
  const raw = value as Partial<Record<keyof ShinobiVillageProgress, unknown>>;
  return {
    visitedRokudoHouse: raw.visitedRokudoHouse === true,
    souunBowFound: raw.souunBowFound === true,
    souunJoined: raw.souunJoined === true,
    nachaFound: raw.nachaFound === true,
    nachaJoined: raw.nachaJoined === true,
    mijinJoined: raw.mijinJoined === true,
    rokuPartsQuestStarted: raw.rokuPartsQuestStarted === true,
    rokuPartsFound: Array.isArray(raw.rokuPartsFound)
      ? Array.from(new Set(raw.rokuPartsFound.filter(isRokuPartId)))
      : [],
    rokuBuildReady: raw.rokuBuildReady === true,
  };
}

export function readShinobiVillageProgress(): ShinobiVillageProgress {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = window.localStorage.getItem(SHINOBI_VILLAGE_PROGRESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function writeShinobiVillageProgress(progress: ShinobiVillageProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHINOBI_VILLAGE_PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
}

export function updateShinobiVillageProgress(
  updater: (progress: ShinobiVillageProgress) => ShinobiVillageProgress
): ShinobiVillageProgress {
  const next = normalizeProgress(updater(readShinobiVillageProgress()));
  writeShinobiVillageProgress(next);
  return next;
}
