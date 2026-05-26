// src/game/skills/skillRuntime.ts
import { tryKnockback } from "../knockback";
import { getEffectiveMaxHp } from "../stats";
import type { UnitDef } from "../types";
import { applyUnitDamage } from "../combat/unitDamage";

type Inst = any;

export function clampHp(u: Inst) {
  return { ...u, hp: Math.max(0, u.hp ?? 0) };
}

/** dmgReduction を考慮してダメージを与える */
export function dealDamage(instances: Inst[], targetId: string, amount: number, sourceId?: string) {
  const dmg = Math.max(0, amount ?? 0);
  if (dmg <= 0) return instances;

  return applyUnitDamage(instances, targetId, dmg, sourceId, { applyDmgReduction: true });
}

export function healUnit(
  instances: Inst[],
  targetId: string,
  amount: number,
  unitsById: Record<string, UnitDef>
) {
  const heal = Math.max(0, amount ?? 0);
  if (heal <= 0) return instances;

  return instances.map((u) => {
    if (!u || u.instanceId !== targetId) return u;

    const def = unitsById[u.unitId];
    if (!def) return u;

    const maxHp = getEffectiveMaxHp(def.base.hp, u.form ?? "base");
    return { ...u, hp: Math.min(maxHp, (u.hp ?? 0) + heal) };
  });
}

export function addStun(instances: Inst[], targetId: string, turns: number) {
  const t = Math.max(0, turns ?? 0);
  if (t <= 0) return instances;
  return instances.map((u) =>
    u.instanceId === targetId && !u.stunImmune ? { ...u, stun: Math.max(u.stun ?? 0, t) } : u
  );
}

export function addBurn(instances: Inst[], targetId: string, ticks: number) {
  const t = Math.max(0, ticks ?? 0);
  if (t <= 0) return instances;
  return instances.map((u) =>
    u.instanceId === targetId ? { ...u, burn: Math.max(u.burn ?? 0, t) } : u
  );
}

export function removeDead(instances: Inst[]) {
  return instances.filter((u) => (u.hp ?? 0) > 0);
}

export function knockback1(stateLike: any, targetId: string, dr: number, dc: number) {
  const res = tryKnockback(stateLike, targetId, dr, dc, 1);
  return res.ok ? (res.instances as Inst[]) : (stateLike.instances as Inst[]);
}

/** 方向ライン上のユニットを range まで集める */
export function collectLineTargets(opts: {
  rows: number;
  cols: number;
  instances: Inst[];
  casterId: string;
  dirR: number;
  dirC: number;
  range: number;
  stopOnFirstHit?: boolean; // trueなら最初に当たったユニットで止める
}) {
  const { rows, cols, instances, casterId, dirR, dirC, range, stopOnFirstHit } = opts;

  const occ = new Map<string, Inst>();
  for (const u of instances) occ.set(`${u.pos.r},${u.pos.c}`, u);

  const caster = instances.find((u) => u.instanceId === casterId);
  if (!caster) return [];

  const hits: Inst[] = [];
  for (let i = 1; i <= range; i++) {
    const rr = caster.pos.r + dirR * i;
    const cc = caster.pos.c + dirC * i;
    if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;

    const u = occ.get(`${rr},${cc}`);
    if (!u) continue;

    hits.push(u);
    if (stopOnFirstHit) break;
  }

  return hits;
}

