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

function isIsolationDuelMemberId(value: unknown): value is IsolationDuelMemberId {
  return typeof value === "string" && ISOLATION_DUEL_MEMBER_IDS.includes(value as IsolationDuelMemberId);
}

function normalizeIsolationProgress(value: unknown): IsolationProgress {
  if (!value || typeof value !== "object") return { clearedDuels: [], finalBattleCleared: false };

  const raw = value as Partial<Record<keyof IsolationProgress, unknown>>;
  const clearedDuels = Array.isArray(raw.clearedDuels)
    ? Array.from(new Set(raw.clearedDuels.filter(isIsolationDuelMemberId)))
    : [];
  const finalBattleCleared = raw.finalBattleCleared === true;

  return { clearedDuels, finalBattleCleared };
}

export function getIsolationProgress(): IsolationProgress {
  if (typeof window === "undefined") return { clearedDuels: [], finalBattleCleared: false };

  try {
    const raw = window.localStorage.getItem(ISOLATION_PROGRESS_STORAGE_KEY);
    if (!raw) return { clearedDuels: [], finalBattleCleared: false };
    return normalizeIsolationProgress(JSON.parse(raw));
  } catch {
    return { clearedDuels: [], finalBattleCleared: false };
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
