export const SHINOBI_VILLAGE_PROGRESS_STORAGE_KEY = "gnoheya_tcg_shinobi_village_progress";

export type ShinobiVillageProgress = {
  visitedRokudoHouse: boolean;
  souunBowFound: boolean;
  souunJoined: boolean;
  nachaFound: boolean;
  nachaJoined: boolean;
  mijinJoined: boolean;
  rokuPartsQuestStarted: boolean;
};

const DEFAULT_PROGRESS: ShinobiVillageProgress = {
  visitedRokudoHouse: false,
  souunBowFound: false,
  souunJoined: false,
  nachaFound: false,
  nachaJoined: false,
  mijinJoined: false,
  rokuPartsQuestStarted: false,
};

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
