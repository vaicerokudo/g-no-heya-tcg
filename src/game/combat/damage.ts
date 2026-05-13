// src/game/combat/damage.ts
import type { Side } from "../types";

type Pos = { r: number; c: number };
type DamageUnitLike = {
  unitId?: string;
  side: Side;
  pos: Pos;
  form?: string;
  aegisLineActive?: boolean;
  hibikiShieldAllActive?: boolean;
  dmgReduction?: number;
};

export type StateLike = {
  rows: number;
  cols: number;
 
  instances: any[];
  selectedInstanceId?: string | null;
};

function chebDist(a: Pos, b: Pos) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
}

// 公式ルール：ROCKEL はダメ軽減を無視する
function ignoresDamageReduction(attacker: any) {
  return attacker?.unitId === "ROCKEL";
}

// hibiki aura: 距離1の味方が受けるダメージ-1（最小0）
export function applyDamageReductionByHibiki(
  stateLike: StateLike,
  attacker: any,
  target: any,
  raw: number
) {
  if (ignoresDamageReduction(attacker)) return raw;

  const targetSide: Side = target.side;
  const instances = stateLike.instances;

  const hasHibikiAura = instances.some((u) => {
    if (u.side !== targetSide) return false;
    if (u.unitId !== "HIBIKI") return false;
    const d = chebDist(u.pos, target.pos);
    return d <= 1;
  });

  if (!hasHibikiAura) return raw;
  return Math.max(0, raw - 1);
}

// damage.ts（追記）
function hasAegisLineActive(stateLike: StateLike, side: Side) {
  return stateLike.instances.some((u: any) => {
    if (u.side !== side) return false;
    if (u.unitId !== "HIBIKI") return false;
    if ((u.form ?? "base") !== "g") return false;
    return !!u.aegisLineActive;
  });
}

function hasHibikiShieldAllActive(stateLike: StateLike, target: DamageUnitLike) {
  return stateLike.instances.some((u: DamageUnitLike) => {
    if (u.side !== target.side) return false;
    if (u.unitId !== "HIBIKI") return false;
    if (!u.hibikiShieldAllActive) return false;

    const d = chebDist(u.pos, target.pos);
    return d <= 2;
  });
}

// computeFinalDamage（差し替え）
export function computeFinalDamage(
  stateLike: StateLike,
  attacker: any,
  target: any,
  raw: number
) {
  let x = applyDamageReductionByHibiki(stateLike, attacker, target, raw);

  // ROCKEL はすべての軽減を無視（Aegis Line も無視）
  if (ignoresDamageReduction(attacker)) {
    return Math.max(0, x);
  }

  // Aegis Line：対象側（target.side）が受けるダメージ-1（非スタック）
  if (hasAegisLineActive(stateLike, target.side)) {
    x = Math.max(0, x - 1);
  }

  // Shield All：発動したHIBIKIから距離2以内の味方が受けるダメージ-1（非スタック）
  if (hasHibikiShieldAllActive(stateLike, target)) {
    x = Math.max(0, x - 1);
  }

  const red = Math.max(0, target.dmgReduction ?? 0);
  return Math.max(0, x - red);
}



