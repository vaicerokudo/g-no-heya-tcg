import type { UnitInstance } from "./types";

export function applyStun(inst: UnitInstance, turns: number): UnitInstance {
  if (!turns || turns <= 0) return inst;
  const cur = inst.stun ?? 0;
  return { ...inst, stun: Math.max(cur, turns) };
}

export function applyBurn(inst: UnitInstance, ticks: number): UnitInstance {
  if (!ticks || ticks <= 0) return inst;
  const cur = inst.burn ?? 0;
  return { ...inst, burn: Math.max(cur, ticks) };
}

function decOrUndef(n?: number) {
  if (!n) return undefined;
  const v = n - 1;
  return v > 0 ? v : undefined;
}

function withoutStatusCounters<T extends UnitInstance>(inst: T): Omit<T, "burn" | "stun"> {
  const next = { ...inst };
  delete next.burn;
  delete next.stun;
  return next;
}

export function tickStartOfSide(
  stateLike: { instances: UnitInstance[] },
  side: UnitInstance["side"],
  burnDamagePerTick = 1
): UnitInstance[] {
  let next = stateLike.instances.map((u) => {
    if (u.side !== side) return u;

    let hp = u.hp;
    let burn = u.burn;
    let stun = u.stun;

    if (burn && burn > 0) {
      hp -= burnDamagePerTick;
      burn = decOrUndef(burn);
    }

    if (stun && stun > 0) {
      stun = decOrUndef(stun);
    }

    return {
      ...withoutStatusCounters(u),
      hp,
      ...(burn ? { burn } : {}),
      ...(stun ? { stun } : {}),
    };
  });

  next = next.filter((u) => u.hp > 0);
  return next;
}
