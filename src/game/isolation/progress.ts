import { DARK_SKIN_ID, unlockSkin } from "../../assets/skinUnlocks";

export const ISOLATION_PROGRESS_STORAGE_KEY = "gnoheya_tcg_isolation_progress";

export const ISOLATION_DUEL_MEMBER_IDS = [
  "socho",
  "tsutsu",
  "rokudo",
  "7171",
  "myouou",
  "hibiki",
  "ushimaru",
  "deli",
  "yabuko",
  "rockel",
  "player",
] as const;

export type IsolationDuelMemberId = (typeof ISOLATION_DUEL_MEMBER_IDS)[number];

export type IsolationProgress = {
  clearedDuels: IsolationDuelMemberId[];
  finalBattleCleared: boolean;
};

const ISOLATION_SCENARIO_MEMBER_IDS: Record<string, IsolationDuelMemberId> = {
  scenario22: "ushimaru",
  scenario23: "socho",
  scenario24: "tsutsu",
  scenario25: "rokudo",
  scenario26: "7171",
  scenario27: "myouou",
  scenario28: "hibiki",
  scenario29: "deli",
  scenario30: "yabuko",
  scenario31: "rockel",
  scenario32: "player",
};

const LEGACY_MEMBER_ID_ALIASES: Record<string, IsolationDuelMemberId> = {
  SOCHO: "socho",
  TSUTSU: "tsutsu",
  ROKUDO: "rokudo",
  MYOUOU: "myouou",
  HIBIKI: "hibiki",
  USHIMARU: "ushimaru",
  DELI: "deli",
  YABUKO_NORMAL: "yabuko",
  YABUKO_FM: "yabuko",
  YABUKO: "yabuko",
  ROCKEL: "rockel",
  PLAYER: "player",
};

function isIsolationDuelMemberId(value: unknown): value is IsolationDuelMemberId {
  return typeof value === "string" && ISOLATION_DUEL_MEMBER_IDS.includes(value as IsolationDuelMemberId);
}

function normalizeIsolationDuelMemberId(value: unknown): IsolationDuelMemberId | null {
  if (isIsolationDuelMemberId(value)) return value;
  if (typeof value !== "string") return null;
  return LEGACY_MEMBER_ID_ALIASES[value] ?? null;
}

function readScenarioClearedIsolationDuels(): IsolationDuelMemberId[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("gnoheya_tcg_cleared_scenarios");
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((scenarioId) => ISOLATION_SCENARIO_MEMBER_IDS[String(scenarioId)])
      .filter((memberId): memberId is IsolationDuelMemberId => Boolean(memberId));
  } catch {
    return [];
  }
}

function normalizeIsolationProgress(value: unknown): IsolationProgress {
  if (!value || typeof value !== "object") return { clearedDuels: [], finalBattleCleared: false };

  const raw = value as Partial<Record<keyof IsolationProgress, unknown>>;
  const clearedDuels = Array.isArray(raw.clearedDuels)
    ? Array.from(new Set(raw.clearedDuels.map(normalizeIsolationDuelMemberId).filter(isIsolationDuelMemberId)))
    : [];
  const finalBattleCleared = raw.finalBattleCleared === true;

  return { clearedDuels, finalBattleCleared };
}

export function getIsolationProgress(): IsolationProgress {
  if (typeof window === "undefined") return { clearedDuels: [], finalBattleCleared: false };

  try {
    const raw = window.localStorage.getItem(ISOLATION_PROGRESS_STORAGE_KEY);
    const stored = raw ? normalizeIsolationProgress(JSON.parse(raw)) : { clearedDuels: [], finalBattleCleared: false };
    return normalizeIsolationProgress({
      clearedDuels: [...stored.clearedDuels, ...readScenarioClearedIsolationDuels()],
      finalBattleCleared: stored.finalBattleCleared,
    });
  } catch {
    return normalizeIsolationProgress({
      clearedDuels: readScenarioClearedIsolationDuels(),
      finalBattleCleared: false,
    });
  }
}

export function writeIsolationProgress(progress: IsolationProgress) {
  if (typeof window === "undefined") return;

  const normalized = normalizeIsolationProgress(progress);
  window.localStorage.setItem(ISOLATION_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
}

export function hasClearedIsolationDuel(memberId: IsolationDuelMemberId): boolean {
  return getIsolationProgress().clearedDuels.includes(memberId);
}

export function hasClearedAllIsolationDuels(progress = getIsolationProgress()): boolean {
  return ISOLATION_DUEL_MEMBER_IDS.every((memberId) => progress.clearedDuels.includes(memberId));
}

export function markIsolationDuelCleared(memberId: IsolationDuelMemberId): IsolationProgress {
  const current = getIsolationProgress();
  const next = normalizeIsolationProgress({
    clearedDuels: [...current.clearedDuels, memberId],
    finalBattleCleared: current.finalBattleCleared,
  });

  writeIsolationProgress(next);
  return next;
}

export function hasClearedFinalIsolationBattle(progress = getIsolationProgress()): boolean {
  return progress.finalBattleCleared;
}

export function markFinalIsolationBattleCleared(): IsolationProgress {
  const current = getIsolationProgress();
  const next = normalizeIsolationProgress({
    clearedDuels: current.clearedDuels,
    finalBattleCleared: true,
  });

  writeIsolationProgress(next);
  unlockSkin(DARK_SKIN_ID);
  return next;
}
