export const DELTA_MACHINE_PARTS_STORAGE_KEY = "gnoheya_tcg_delta_machine_parts";

const MIN_PART_ID = 1;
const MAX_PART_ID = 9;

function isDeltaMachinePartId(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= MIN_PART_ID && Number(value) <= MAX_PART_ID;
}

function normalizeDeltaMachineParts(values: unknown[]): number[] {
  return Array.from(new Set(values.filter(isDeltaMachinePartId))).sort((a, b) => a - b);
}

export function getDeltaMachineParts(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(DELTA_MACHINE_PARTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normalizeDeltaMachineParts(parsed);
  } catch {
    return [];
  }
}

export function hasDeltaMachinePart(partId: number): boolean {
  if (!isDeltaMachinePartId(partId)) return false;
  return getDeltaMachineParts().includes(partId);
}

export function addDeltaMachinePart(partId: number): number[] {
  if (!isDeltaMachinePartId(partId)) return getDeltaMachineParts();

  const next = normalizeDeltaMachineParts([...getDeltaMachineParts(), partId]);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DELTA_MACHINE_PARTS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function hasAllDeltaMachineParts(): boolean {
  return getDeltaMachineParts().length === MAX_PART_ID;
}
