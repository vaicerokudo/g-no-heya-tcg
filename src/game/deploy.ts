import { shuffle } from "./deck";
import type { UnitInstance } from "./state";
import type { Side } from "./types";
import { getInitialDeployCandidateCols, getSouthReinforceStartRow } from "./boardConfig";

type SpawnDeployUnit = (opts: {
  unitId: string;
  side: "south" | "north";
  r: number;
  c: number;
  instanceId: string;
}) => UnitInstance | null;

export function canDeployCellSouth(r: number, rows: number, c?: number, candidateCols?: readonly number[]) {
  if (r !== rows - 1) return false;
  if (c === undefined || !candidateCols) return true;
  return candidateCols.includes(c);
}

export function canDeployCellSouthReinforce(r: number, rows: number) {
  return r >= getSouthReinforceStartRow(rows) && r <= rows - 1;
}

export function canStartSouthDeploy({
  phase,
  selectedHandPick,
  r,
  c,
  rows,
  candidateCols,
  occupied,
}: {
  phase: "setup_draw" | "setup_deploy" | "battle";
  selectedHandPick: unknown;
  r: number;
  c?: number;
  rows: number;
  candidateCols?: readonly number[];
  occupied: boolean;
}) {
  if (phase !== "setup_deploy") return false;
  if (!selectedHandPick) return false;
  if (!canDeployCellSouth(r, rows, c, candidateCols)) return false;
  if (occupied) return false;
  return true;
}

export function buildSouthInitialDeploySet({
  gameOver,
  phase,
  selectedHandPick,
  rows,
  cols,
  candidateCols,
  isOccupied,
}: {
  gameOver: boolean;
  phase: "setup_draw" | "setup_deploy" | "battle";
  selectedHandPick: unknown;
  rows: number;
  cols: number;
  candidateCols?: readonly number[];
  isOccupied: (r: number, c: number) => boolean;
}) {
  const deploySet = new Set<string>();
  if (gameOver) return deploySet;

  for (let c = 0; c < cols; c++) {
    const r = rows - 1;
    if (
      canStartSouthDeploy({
        phase,
        selectedHandPick,
        r,
        c,
        rows,
        candidateCols,
        occupied: isOccupied(r, c),
      })
    ) {
      deploySet.add(`${r},${c}`);
    }
  }

  return deploySet;
}

export function canStartSouthReinforce({
  phase,
  turn,
  battleDeployUsed,
  selectedHandPick,
  r,
  rows,
  occupied,
}: {
  phase: "setup_draw" | "setup_deploy" | "battle";
  turn: "south" | "north";
  battleDeployUsed: boolean;
  selectedHandPick: unknown;
  r: number;
  rows: number;
  occupied: boolean;
}) {
  if (phase !== "battle") return false;
  if (turn !== "south") return false;
  if (battleDeployUsed) return false;
  if (!selectedHandPick) return false;
  if (!canDeployCellSouthReinforce(r, rows)) return false;
  if (occupied) return false;
  return true;
}

export function canStartNorthReinforce({
  phase,
  turn,
  handNorth,
}: {
  phase: "setup_draw" | "setup_deploy" | "battle";
  turn: "south" | "north";
  handNorth: readonly unknown[] | null | undefined;
}) {
  if (phase !== "battle") return false;
  if (turn !== "north") return false;
  if (!handNorth || handNorth.length === 0) return false;
  return true;
}

export function getTopRowEmptyCols(instances: UnitInstance[], cols: number) {
  const used = new Set<number>();
  for (const u of instances) {
    if (u.pos?.r === 0) used.add(u.pos.c);
  }

  const empties: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (!used.has(c)) empties.push(c);
  }

  return empties;
}

export function getNorthReinforceUnitId({
  handNorth,
  unitsById,
}: {
  handNorth: readonly string[] | null | undefined;
  unitsById: Record<string, unknown>;
}) {
  const unitId = handNorth?.[0];
  if (!unitId) return null;
  if (!unitsById[unitId]) return null;
  return unitId;
}

export function buildInitialNorthDeployCols(cols: number, count = 3) {
  const colsIdx = shuffle(getInitialDeployCandidateCols(cols));
  return colsIdx.slice(0, count);
}

export function buildInitialNorthInstances({
  handNorth,
  pickedCols,
  count = 3,
  spawnUnit,
}: {
  handNorth: readonly string[];
  pickedCols: readonly number[];
  count?: number;
  spawnUnit: SpawnDeployUnit;
}) {
  return handNorth
    .slice(0, count)
    .map((unitId, i) =>
      spawnUnit({
        unitId,
        side: "north",
        r: 0,
        c: pickedCols[i],
        instanceId: `N-${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
      })
    )
    .filter((unit): unit is UnitInstance => unit !== null);
}

export function buildSouthReinforceSet({
  gameOver,
  phase,
  turn,
  selectedHandKey,
  battleDeployUsed,
  rows,
  cols,
  isOccupied,
}: {
  gameOver: boolean;
  phase: "setup_draw" | "setup_deploy" | "battle";
  turn: "south" | "north";
  selectedHandKey: string | null;
  battleDeployUsed: boolean;
  rows: number;
  cols: number;
  isOccupied: (r: number, c: number) => boolean;
}) {
  const reinforceSet = new Set<string>();
  if (gameOver) return reinforceSet;
  if (phase !== "battle") return reinforceSet;
  if (turn !== "south") return reinforceSet;
  if (!selectedHandKey) return reinforceSet;
  if (battleDeployUsed) return reinforceSet;

  for (let r = getSouthReinforceStartRow(rows); r <= rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isOccupied(r, c)) reinforceSet.add(`${r},${c}`);
    }
  }

  return reinforceSet;
}

export function buildDeployInstances({
  instances,
  unitId,
  side,
  r,
  c,
  instanceId,
  spawnUnit,
}: {
  instances: UnitInstance[];
  unitId: string;
  side: Side;
  r: number;
  c: number;
  instanceId: string;
  spawnUnit: SpawnDeployUnit;
}) {
  const newUnit = spawnUnit({
    unitId,
    side,
    r,
    c,
    instanceId,
  });

  if (!newUnit) return null;
  return [...instances, newUnit];
}
