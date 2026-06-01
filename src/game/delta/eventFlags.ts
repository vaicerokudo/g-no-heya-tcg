export const DELTA_EVENT_FLAGS_STORAGE_KEY = "gnoheya_tcg_delta_event_flags";

export type DeltaEventFlag =
  | "part5_heard_from_7171"
  | "delta_chapter_cleared"
  | "deli_metal_machine_unlocked";

const KNOWN_DELTA_EVENT_FLAGS: DeltaEventFlag[] = [
  "part5_heard_from_7171",
  "delta_chapter_cleared",
  "deli_metal_machine_unlocked",
];

function isDeltaEventFlag(value: unknown): value is DeltaEventFlag {
  return typeof value === "string" && KNOWN_DELTA_EVENT_FLAGS.includes(value as DeltaEventFlag);
}

function normalizeDeltaEventFlags(values: unknown[]): DeltaEventFlag[] {
  return Array.from(new Set(values.filter(isDeltaEventFlag)));
}

export function getDeltaEventFlags(): DeltaEventFlag[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(DELTA_EVENT_FLAGS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normalizeDeltaEventFlags(parsed);
  } catch {
    return [];
  }
}

export function hasDeltaEventFlag(flag: DeltaEventFlag): boolean {
  return getDeltaEventFlags().includes(flag);
}

export function addDeltaEventFlag(flag: DeltaEventFlag): DeltaEventFlag[] {
  const next = normalizeDeltaEventFlags([...getDeltaEventFlags(), flag]);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DELTA_EVENT_FLAGS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
