import type { ScenarioId } from "../scenario/scenarios";

export const WASTELAND_PROGRESS_STORAGE_KEY = "gnoheya_tcg_wasteland_progress";

export type WastelandEventFlag = "wasteland_chapter_cleared";

export type WastelandProgress = {
  clearedScenarios: ScenarioId[];
  flags: WastelandEventFlag[];
};

const WASTELAND_SCENARIO_IDS: ScenarioId[] = ["scenario12", "scenario13", "scenario14", "scenario15"];
const WASTELAND_EVENT_FLAGS: WastelandEventFlag[] = ["wasteland_chapter_cleared"];

function isWastelandScenarioId(value: unknown): value is ScenarioId {
  return typeof value === "string" && WASTELAND_SCENARIO_IDS.includes(value as ScenarioId);
}

function isWastelandEventFlag(value: unknown): value is WastelandEventFlag {
  return typeof value === "string" && WASTELAND_EVENT_FLAGS.includes(value as WastelandEventFlag);
}

function normalizeWastelandProgress(value: unknown): WastelandProgress {
  if (!value || typeof value !== "object") {
    return { clearedScenarios: [], flags: [] };
  }

  const raw = value as Partial<Record<keyof WastelandProgress, unknown>>;
  const clearedScenarios = Array.isArray(raw.clearedScenarios)
    ? Array.from(new Set(raw.clearedScenarios.filter(isWastelandScenarioId)))
    : [];
  const flags = Array.isArray(raw.flags)
    ? Array.from(new Set(raw.flags.filter(isWastelandEventFlag)))
    : [];

  return { clearedScenarios, flags };
}

export function readWastelandProgress(): WastelandProgress {
  if (typeof window === "undefined") return { clearedScenarios: [], flags: [] };

  try {
    const raw = window.localStorage.getItem(WASTELAND_PROGRESS_STORAGE_KEY);
    if (!raw) return { clearedScenarios: [], flags: [] };

    return normalizeWastelandProgress(JSON.parse(raw));
  } catch {
    return { clearedScenarios: [], flags: [] };
  }
}

export function writeWastelandProgress(progress: WastelandProgress) {
  if (typeof window === "undefined") return;

  const normalized = normalizeWastelandProgress(progress);
  window.localStorage.setItem(WASTELAND_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
}

export function markWastelandScenarioCleared(scenarioId: ScenarioId): WastelandProgress {
  const current = readWastelandProgress();
  const flags = [...current.flags];
  if (scenarioId === "scenario15" && !flags.includes("wasteland_chapter_cleared")) {
    flags.push("wasteland_chapter_cleared");
  }

  const next = normalizeWastelandProgress({
    clearedScenarios: [...current.clearedScenarios, scenarioId],
    flags,
  });
  writeWastelandProgress(next);
  return next;
}

export function hasWastelandEventFlag(flag: WastelandEventFlag): boolean {
  return readWastelandProgress().flags.includes(flag);
}
