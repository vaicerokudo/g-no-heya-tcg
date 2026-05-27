export const HIDDEN_HINT_FLAGS_STORAGE_KEY = "gnoheya_tcg_hidden_hint_flags";

export type HiddenHintFlag = "monten_defeated";

const HIDDEN_HINT_FLAGS: HiddenHintFlag[] = ["monten_defeated"];

function isHiddenHintFlag(value: unknown): value is HiddenHintFlag {
  return typeof value === "string" && HIDDEN_HINT_FLAGS.includes(value as HiddenHintFlag);
}

export function readHiddenHintFlags(): HiddenHintFlag[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HIDDEN_HINT_FLAGS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isHiddenHintFlag);
  } catch {
    return [];
  }
}

export function writeHiddenHintFlags(flags: HiddenHintFlag[]) {
  if (typeof window === "undefined") return;

  const unique = Array.from(new Set(flags)).filter(isHiddenHintFlag);
  window.localStorage.setItem(HIDDEN_HINT_FLAGS_STORAGE_KEY, JSON.stringify(unique));
}

export function markHiddenHintFlag(flag: HiddenHintFlag) {
  const current = readHiddenHintFlags();
  if (current.includes(flag)) return current;

  const next = [...current, flag];
  writeHiddenHintFlags(next);
  return next;
}
