// src/game/attack.ts
import type { Side } from "./types";
import { computeFinalDamage } from "./combat/damage";
import { applyUnitDamage } from "./combat/unitDamage";

type Pos = { r: number; c: number };
export type AttackMark = { kind: "range" | "blocker"; r: number; c: number };

export type StateLike = {
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  selectedInstanceId?: string | null;
};

type AttackDirectionMode = "all8" | "orthogonal" | "diagonal" | "front3";
type AttackDir = { dr: number; dc: number };

function chebDist(a: Pos, b: Pos) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
}

function getByInstanceId(instances: any[], id: string) {
  return instances.find((u) => u.instanceId === id) ?? null;
}

function occMap(instances: any[]) {
  const m = new Map<string, any>();
  for (const u of instances) m.set(`${u.pos.r},${u.pos.c}`, u);
  return m;
}

function damageOne(instances: any[], targetId: string, amount: number, sourceId?: string) {
  return applyUnitDamage(instances, targetId, amount, sourceId, { applyDmgReduction: false });
}

function sign(n: number) {
  if (n > 0) return 1;
  if (n < 0) return -1;
  return 0;
}

function isLine8(a: Pos, b: Pos) {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  if (dr === 0 && dc === 0) return false;
  // orthogonal or diagonal
  return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
}

function isOrthogonalLine(a: Pos, b: Pos) {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  return (dr !== 0 || dc !== 0) && (dr === 0 || dc === 0);
}

function isDiagonalLine(a: Pos, b: Pos) {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  return dr !== 0 && Math.abs(dr) === Math.abs(dc);
}

function isFront3Line(a: Pos, b: Pos, side: Side) {
  const front = side === "south" ? -1 : 1;
  return b.r - a.r === front && Math.abs(b.c - a.c) <= 1;
}

function getAttackDirectionMode(spec: any): AttackDirectionMode {
  const directions = spec?.directions;
  if (directions === "orthogonal" || directions === "diagonal" || directions === "front3") return directions;
  return "all8";
}

function isInAttackDirection(a: Pos, b: Pos, mode: AttackDirectionMode, side: Side) {
  if (mode === "orthogonal") return isOrthogonalLine(a, b);
  if (mode === "diagonal") return isDiagonalLine(a, b);
  if (mode === "front3") return isFront3Line(a, b, side);
  return isLine8(a, b);
}

function getAttackDirs(mode: AttackDirectionMode, side: Side): AttackDir[] {
  const orthogonal = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  const diagonal = [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 },
  ];

  if (mode === "orthogonal") return orthogonal;
  if (mode === "diagonal") return diagonal;
  if (mode === "front3") {
    const front = side === "south" ? -1 : 1;
    return [
      { dr: front, dc: -1 },
      { dr: front, dc: 0 },
      { dr: front, dc: 1 },
    ];
  }
  return [...orthogonal, ...diagonal];
}

function stepDir8(a: Pos, b: Pos) {
  return { dr: sign(b.r - a.r), dc: sign(b.c - a.c) };
}

function isLineOfSightClear(instances: any[], from: Pos, to: Pos) {
  if (!isLine8(from, to)) return false;
  const { dr, dc } = stepDir8(from, to);
  const occ = occMap(instances);

  let r = from.r + dr;
  let c = from.c + dc;

  while (!(r === to.r && c === to.c)) {
    if (occ.has(`${r},${c}`)) return false;
    r += dr;
    c += dc;
  }
  return true;
}

// ATKは「必ず unitsById から」引く（instance.atk は見ない）
function getBaseAtk(stateLike: StateLike, attacker: any): number {
  const def = stateLike.unitsById?.[attacker.unitId];
  const baseAtk = def?.base?.atk ?? 1;
  const form = attacker.form ?? "base";
  const formAtk = form === "g" ? baseAtk + 1 : baseAtk;
  return formAtk + Math.max(0, attacker.dmgBonus ?? 0);
}

function isMeleeAttackable(_stateLike: StateLike, attacker: any, target: any) {
  // 隣接（チェビ1）
  return chebDist(attacker.pos, target.pos) <= 1;
}

function isRangedLineAttackable(
  stateLike: StateLike,
  attacker: any,
  target: any,
  range: number,
  losBlocked: boolean,
  directions: AttackDirectionMode
) {
  if (!isInAttackDirection(attacker.pos, target.pos, directions, attacker.side)) return false;

  const dist = chebDist(attacker.pos, target.pos);
  if (dist > range) return false;

  if (losBlocked) {
    return isLineOfSightClear(stateLike.instances, attacker.pos, target.pos);
  }
  return true;
}

function getNormalAttackSpec(stateLike: StateLike, attacker: any) {
  const def = stateLike.unitsById?.[attacker.unitId];
  const spec = def?.attacks?.normalAttack ?? null;
  return spec;
}

/**
 * 攻撃可能な敵一覧（UI/CPU共通）
 */
export function getAttackableTargets(stateLike: StateLike, attacker: any): any[] {
  const instances = stateLike.instances;
  const spec = getNormalAttackSpec(stateLike, attacker);

  const enemies = instances.filter((u) => u.side !== attacker.side);

  // rangedLine
  if (spec?.type === "rangedLine") {
    const range = spec.range ?? 3;
    const blocked = spec.lineOfSightBlockedByUnits ?? true;
    const directions = getAttackDirectionMode(spec);

    return enemies.filter((t) =>
      isRangedLineAttackable(stateLike, attacker, t, range, blocked, directions)
    );
  }

  // default melee
  return enemies.filter((t) => isMeleeAttackable(stateLike, attacker, t));
}

/**
 * 通常攻撃を適用して instances を返す
 */
export function applyNormalAttack(
  stateLike: StateLike,
  attacker: any,
  targetId: string
): any[] {
  const instances = stateLike.instances;

  const target = getByInstanceId(instances, targetId);
  if (!target) return instances;

  // そもそも攻撃可能かチェック（UI/CPUのズレ防止）
  const legalTargets = getAttackableTargets(stateLike, attacker);
  const ok = legalTargets.some((t) => t.instanceId === targetId);
  if (!ok) return instances;

  // raw damage = ATK（Gなら+1込み）
  const raw = getBaseAtk(stateLike, attacker);

  // B案：共通最終ダメ（hibiki aura / dmgReduction / aegis line / rockel無視 などを damage.ts 側で処理）
  const finalDmg = computeFinalDamage(stateLike as any, attacker, target, raw);

  // ターゲットにダメージ（イミュータブル更新）
  let next = damageOne(instances, targetId, finalDmg, attacker.instanceId);

  // Player 反射（被弾したら1ダメ返す）※finalDmg>0 のときだけ
  if (target.unitId === "PLAYER" && finalDmg > 0) {
    next = damageOne(next, attacker.instanceId, 1);
  }

  return next;
}

export function buildNormalAttackInstances({
  rows,
  cols,
  unitsById,
  instances,
  selectedInstanceId,
  attacker,
  targetId,
}: StateLike & {
  attacker: any;
  targetId: string;
}) {
  return applyNormalAttack(
    { rows, cols, unitsById, instances, selectedInstanceId },
    attacker,
    targetId
  );
}

// --- danger / UI 用：攻撃可能マスのマーキング ---
function isInBounds(stateLike: StateLike, r: number, c: number) {
  return r >= 0 && r < stateLike.rows && c >= 0 && c < stateLike.cols;
}

export function getAttackMarks(stateLike: StateLike, attacker: any): AttackMark[] {
  const marks: AttackMark[] = [];
  const spec = stateLike.unitsById?.[attacker.unitId]?.attacks?.normalAttack ?? null;
  const occ = occMap(stateLike.instances);

  const add = (kind: AttackMark["kind"], r: number, c: number) => {
    marks.push({ kind, r, c });
  };

  // rangedLine の場合：8方向直線上（射程内）をマーク
  if (spec?.type === "rangedLine") {
    const range = spec.range ?? 3;
    const blocked = spec.lineOfSightBlockedByUnits ?? true;
    const dirs = getAttackDirs(getAttackDirectionMode(spec), attacker.side);

    for (const d of dirs) {
      for (let step = 1; step <= range; step++) {
        const r = attacker.pos.r + d.dr * step;
        const c = attacker.pos.c + d.dc * step;
        if (!isInBounds(stateLike, r, c)) break;

        const occupant = occ.get(`${r},${c}`);
        if (!occupant) {
          add("range", r, c);
          continue;
        }

        if (occupant.side !== attacker.side) {
          add("range", r, c);
        } else {
          add("blocker", r, c);
        }

        if (blocked) break;
      }
    }
    return marks;
  }

  // default melee（隣接：チェビ1）
  for (let r = attacker.pos.r - 1; r <= attacker.pos.r + 1; r++) {
    for (let c = attacker.pos.c - 1; c <= attacker.pos.c + 1; c++) {
      if (!isInBounds(stateLike, r, c)) continue;
      if (r === attacker.pos.r && c === attacker.pos.c) continue;
      const occupant = occ.get(`${r},${c}`);
      add(occupant && occupant.side === attacker.side ? "blocker" : "range", r, c);
    }
  }
  return marks;
}
