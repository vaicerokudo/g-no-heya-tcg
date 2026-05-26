import type { ScenarioId } from "./scenarios";

export const CLEARED_SCENARIOS_STORAGE_KEY = "gnoheya_tcg_cleared_scenarios";

const SCENARIO_IDS: ScenarioId[] = [
  "scenario1",
  "scenario2",
  "scenario3",
  "scenario_hidden_myouou",
  "scenario_hidden_author",
];

function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === "string" && SCENARIO_IDS.includes(value as ScenarioId);
}

export function readClearedScenarios(): ScenarioId[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CLEARED_SCENARIOS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isScenarioId);
  } catch {
    return [];
  }
}

export function writeClearedScenarios(scenarioIds: ScenarioId[]) {
  if (typeof window === "undefined") return;

  const unique = Array.from(new Set(scenarioIds)).filter(isScenarioId);
  window.localStorage.setItem(CLEARED_SCENARIOS_STORAGE_KEY, JSON.stringify(unique));
}
