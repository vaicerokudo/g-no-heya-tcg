

import type { GameState, UnitInstance } from "./state";

function inBounds(r: number, c: number, rows: number, cols: number) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}
function key(r: number, c: number) {
  return `${r},${c}`;
}

export type AttackMarkKind = "range" | "target" | "blocker";
export type AttackMark = { r: number; c: number; kind: AttackMarkKind };

export function buildOcc(instances: UnitInstance[]) {
  const m = new Map<string, UnitInstance>();
  for (const inst of instances) m.set(key(inst.pos.r, inst.pos.c), inst);
  return m;
}

const DIRS_4 = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 }
];

const DIRS_8 = [
  ...DIRS_4,
  { dr: -1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: 1, dc: 1 }
];

export function getAttackMarks(state: GameState, attacker: UnitInstance): AttackMark[] {
  const def = state.unitsById[attacker.unitId] as any;
  const occ = buildOcc(state.instances);

  // 近接デフォ（上下左右1）
  const marks: AttackMark[] = [];
  for (const d of DIRS_4) {
    const r = attacker.pos.r + d.dr;
    const c = attacker.pos.c + d.dc;
    if (!inBounds(r, c, state.rows, state.cols)) continue;
    const t = occ.get(key(r, c));
    if (!t) marks.push({ r, c, kind: "range" });
    else if (t.side !== attacker.side) marks.push({ r, c, kind: "target" });
    else marks.push({ r, c, kind: "blocker" });
  }

  const na = def?.attacks?.normalAttack;
  if (!na || na.type !== "rangedLine") return marks;

  // rangedLine（つつ用）
  marks.length = 0;
  const range: number = na.range ?? 3;
  const blockByUnits: boolean = !!na.lineOfSightBlockedByUnits;

  for (const d of DIRS_8) {
    for (let step = 1; step <= range; step++) {
      const r = attacker.pos.r + d.dr * step;
      const c = attacker.pos.c + d.dc * step;
      if (!inBounds(r, c, state.rows, state.cols)) break;

      const t = occ.get(key(r, c));
      if (!t) {
        marks.push({ r, c, kind: "range" });
        continue;
      }

      if (t.side !== attacker.side) marks.push({ r, c, kind: "target" });
      else marks.push({ r, c, kind: "blocker" });

      if (blockByUnits) break;
    }
  }

  return marks;
}

export function getAttackableTargets(state: GameState, attacker: UnitInstance): UnitInstance[] {
  const marks = getAttackMarks(state, attacker);
  const occ = buildOcc(state.instances);
  const targets: UnitInstance[] = [];
  for (const m of marks) {
    if (m.kind !== "target") continue;
    const t = occ.get(key(m.r, m.c));
    if (t) targets.push(t);
  }
  return targets;
}

export function applyNormalAttack(state: GameState, attacker: UnitInstance, targetId: string) {
  const atk = state.unitsById[attacker.unitId].base.atk;
  const next = state.instances.map((u) => (u.instanceId === targetId ? { ...u, hp: u.hp - atk } : u));
  return next.filter((u) => u.hp > 0);
}
