// src/game/skills.ts

import { tryKnockback } from "./knockback";

import type { UnitInstance } from "./types";


// ---- status helpers (single source of truth) ----

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

// skills.ts に追記（applyStun/applyBurnの下あたり）

function decOrUndef(n?: number) {
  if (!n) return undefined;
  const v = n - 1;
  return v > 0 ? v : undefined;
}

export function tickStartOfSide(
  stateLike: { instances: UnitInstance[] },
  side: UnitInstance["side"],
  burnDamagePerTick = 1
): UnitInstance[] {
  // 対象サイドのユニットだけtick（他サイドは据え置き）
  let next = stateLike.instances.map((u) => {
    if (u.side !== side) return u;

    let v = { ...u };

    // burn: ダメ→減らす
    if (v.burn && v.burn > 0) {
      v.hp = v.hp - burnDamagePerTick;
      v.burn = decOrUndef(v.burn);
    }

    // stun: 減らす（行動不能判定は別の場所で）
    if (v.stun && v.stun > 0) {
      v.stun = decOrUndef(v.stun);
    }

    // undefinedに整える（残ってても害はないけど見た目綺麗）
    if (!v.burn) delete (v as any).burn;
    if (!v.stun) delete (v as any).stun;

    return v;
  });

  // 死亡除外
  next = next.filter((u) => u.hp > 0);
  return next;
}



export function applyTsutsuGChikayoraseneeYo(
  stateLike: { rows: number; cols: number; instances: UnitInstance[] },

  casterId: string,
  radius: number,
  damage: number,
  knockback: number,
  stunTurns: number = 1
) {
  const caster = stateLike.instances.find((u) => u.instanceId === casterId);
  if (!caster) return stateLike.instances;

  let next = [...stateLike.instances];

  const targets = next
    .filter((u) => u.side !== caster.side)
    .filter((u) => {
      const dr = Math.abs(u.pos.r - caster.pos.r);
      const dc = Math.abs(u.pos.c - caster.pos.c);
      return Math.max(dr, dc) <= radius;
    })
    .map((u) => u.instanceId);

  for (const tid of targets) {
    const t = next.find((u) => u.instanceId === tid);
    if (!t) continue;

    const afterDamage = next.map((u) =>
      u.instanceId === tid ? { ...u, hp: u.hp - damage } : u
    );

    next = afterDamage.filter((u) => u.hp > 0);

    const t2 = next.find((u) => u.instanceId === tid);
    if (!t2) continue;

    next = next.map((u) => (u.instanceId === tid ? applyStun(u, stunTurns) : u));

    const t3 = next.find((u) => u.instanceId === tid);
    if (!t3) continue;

    const dirR = Math.sign(t3.pos.r - caster.pos.r);
    const dirC = Math.sign(t3.pos.c - caster.pos.c);

    if (dirR !== 0 || dirC !== 0) {
      const res = tryKnockback(
        { ...stateLike, instances: next } as any,
        tid,
        dirR,
        dirC,
        knockback
      );
      if (res.ok) next = res.instances;
    }
  }

  return next;
}

// --- うしまる(G) 貫徹 ---
type StateLikeU = { rows: number; cols: number; instances: UnitInstance[] };

function inside(rows: number, cols: number, r: number, c: number) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}
function posKey(r: number, c: number) {
  return `${r},${c}`;
}
function sign(x: number) {
  return x === 0 ? 0 : x > 0 ? 1 : -1;
}

export function applyUshimaruGKantetsu(
  state: StateLikeU,
  attackerInstanceId: string,
  dr: number,
  dc: number,
  maxRange = 4,
  damage = 3,
  kbDist = 1
): UnitInstance[] {
  dr = sign(dr);
  dc = sign(dc);

  const attacker = state.instances.find((x) => x.instanceId === attackerInstanceId);
  if (!attacker) return state.instances;
  if (dr === 0 && dc === 0) return state.instances;

  const occ = new Map<string, UnitInstance>();
  for (const inst of state.instances) occ.set(posKey(inst.pos.r, inst.pos.c), inst);

  const line: { inst: UnitInstance; dist: number }[] = [];
  let r = attacker.pos.r;
  let c = attacker.pos.c;

  for (let d = 1; d <= maxRange; d++) {
    r += dr;
    c += dc;
    if (!inside(state.rows, state.cols, r, c)) break;

    const hit = occ.get(posKey(r, c));
    if (hit) line.push({ inst: hit, dist: d });
  }

  let next: UnitInstance[] = state.instances.map((u) => {
    const hit = line.find((x) => x.inst.instanceId === u.instanceId);
    if (!hit) return u;
    if (u.side === attacker.side) return u;
    return { ...u, hp: u.hp - damage };
  });

  next = next.filter((u) => u.hp > 0);

  const survivors = new Map<string, UnitInstance>();
  for (const u of next) survivors.set(u.instanceId, u);

  const targetsFarToNear = line
    .filter((x) => {
      const alive = survivors.get(x.inst.instanceId);
      return !!alive && alive.side !== attacker.side;
    })
    .sort((a, b) => b.dist - a.dist);

  for (const t of targetsFarToNear) {
    const res = tryKnockback(
      { rows: state.rows, cols: state.cols, instances: next } as any,
      t.inst.instanceId,
      dr,
      dc,
      kbDist
    );
    if (res.ok) next = res.instances as UnitInstance[];
  }

  return next;
}





// --- 総長 居合い ---
export function applySochoIaijutsu(
  stateLike: { rows: number; cols: number; instances: UnitInstance[] },
  casterId: string,
  targetId: string,
  damage: number
) {
  const instances = stateLike.instances;

  const caster = instances.find((u) => u.instanceId === casterId);
  const target = instances.find((u) => u.instanceId === targetId);
  if (!caster || !target) return instances;

  if (caster.side === target.side) return instances;

  const dr = Math.abs(caster.pos.r - target.pos.r);
  const dc = Math.abs(caster.pos.c - target.pos.c);
  if (Math.max(dr, dc) !== 1) return instances;

  return instances
    .map((u) => (u.instanceId === targetId ? { ...u, hp: u.hp - damage } : u))
    .filter((u) => u.hp > 0);
}

export function applyMyououYakiHarau(
  stateLike: { rows: number; cols: number; instances: UnitInstance[] },
  casterId: string,
  targetId: string,
  damage: number
) {
  const instances = stateLike.instances;

  const caster = instances.find((u) => u.instanceId === casterId);
  const target = instances.find((u) => u.instanceId === targetId);
  if (!caster || !target) return instances;

  if (caster.side === target.side) return instances;

  const dr = Math.abs(caster.pos.r - target.pos.r);
  const dc = Math.abs(caster.pos.c - target.pos.c);
  if (Math.max(dr, dc) !== 1) return instances;

  return instances
    .map((u) => (u.instanceId === targetId ? { ...u, hp: u.hp - damage } : u))
    .filter((u) => u.hp > 0);
}




export function applyMyououGKaryuraFront3(
  stateLike: { rows: number; cols: number; instances: UnitInstance[] },
  casterId: string,
  damage: number,
  burnTicks: number = 3,
  stunTurns: number = 1
) {
  const caster = stateLike.instances.find((u) => u.instanceId === casterId);
  if (!caster) return stateLike.instances;

  const fr = caster.side === "south" ? -1 : 1;
  const rr = caster.pos.r + fr;

  const targets = [
    { r: rr, c: caster.pos.c - 1 },
    { r: rr, c: caster.pos.c },
    { r: rr, c: caster.pos.c + 1 },
  ].filter(
    (p) =>
      p.r >= 0 &&
      p.r < stateLike.rows &&
      p.c >= 0 &&
      p.c < stateLike.cols
  );

  let next = [...stateLike.instances];

  for (const p of targets) {
    const t = next.find((u) => u.pos.r === p.r && u.pos.c === p.c);
    if (!t) continue;
    if (t.side === caster.side) continue;

    next = next.map((u) => {
      if (u.instanceId !== t.instanceId) return u;
      let v = { ...u, hp: u.hp - damage };
      v = applyStun(v, stunTurns);
      v = applyBurn(v, burnTicks);
      return v;
    });

    next = next.filter((u) => u.hp > 0);
  }

  return next;
}


export const __skills_exports_check = {
  applySochoIaijutsu,
  applyTsutsuGChikayoraseneeYo,
  applyUshimaruGKantetsu,
  applyMyououYakiHarau,
  applyMyououGKaryuraFront3,
};





