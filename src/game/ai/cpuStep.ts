// src/game/ai/cpuStep.ts
import { getLegalMoves } from "../move";
import { getAttackableTargets, applyNormalAttack } from "../attack";
import { getEffectiveMaxHp } from "../stats";
import type { Side } from "../types";

import { pickBest, type CpuAction, type EvalCtx } from "./eval";

type StateLike = {
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  selectedInstanceId?: string | null;
};

function isEvolveCell(r: number) {
  return r === 3; // あなたのルール（進化ライン）
}

function simulateMoveAndEvolve(params: {
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  actor: any;
  to: { r: number; c: number };
}) {
  const { unitsById, instances, actor, to } = params;

  let next = instances.map((u) =>
    u.instanceId === actor.instanceId ? { ...u, pos: { r: to.r, c: to.c } } : u
  );

  let evolved = false;

  if (isEvolveCell(to.r)) {
    next = next.map((u) => {
      if (u.instanceId !== actor.instanceId) return u;

      const form = u.form ?? "base";
      if (form === "g") return u;

      const def = unitsById[u.unitId];
      const newMaxHp = getEffectiveMaxHp(def.base.hp, "g");
      const newHp = Math.min((u.hp ?? 0) + 1, newMaxHp);
      evolved = true;

      return { ...u, form: "g", hp: newHp };
    });
  }

  return { nextInstances: next, evolved };
}

export function cpuStepV1(opts: {
  side: Side;
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  actorId: string;
}): { nextInstances: any[]; action: CpuAction } {
  const { side, rows, cols, unitsById, instances, actorId } = opts;

  const actor = instances.find((u) => u.instanceId === actorId);
  if (!actor) {
    return { nextInstances: instances, action: { kind: "skip", actorId, reason: "missing" } };
  }
  if (actor.side !== side) {
    return { nextInstances: instances, action: { kind: "skip", actorId, reason: "not-my-side" } };
  }
  if ((actor.stun ?? 0) > 0) {
    return { nextInstances: instances, action: { kind: "skip", actorId, reason: "stunned" } };
  }

  const ctx: EvalCtx = { side, rows, cols, unitsById, instances, actorId };

  const candidates: Array<{ action: CpuAction; nextInstances: any[] }> = [];

  // 1) 攻撃候補（全部作って評価に投げる）
  {
    const stateLike: StateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: actor.instanceId,
    };

    const targets = getAttackableTargets(stateLike as any, actor as any);
    for (const t of targets as any[]) {
      const tid = t.instanceId;
      const next = applyNormalAttack(stateLike as any, actor as any, tid) as any[];
      candidates.push({
        action: { kind: "attack", actorId, targetId: tid },
        nextInstances: next,
      });
    }
  }

  // 2) 移動候補（全部作って評価に投げる）
  {
    const stateLike: StateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: actor.instanceId,
    };

    const moves = getLegalMoves(stateLike as any, actor as any);
    for (const m of moves as any[]) {
      const sim = simulateMoveAndEvolve({
        rows,
        cols,
        unitsById,
        instances,
        actor,
        to: { r: m.r, c: m.c },
      });

      candidates.push({
        action: { kind: "move", actorId, r: m.r, c: m.c, evolved: sim.evolved },
        nextInstances: sim.nextInstances,
      });
    }
  }

  // 候補ゼロならスキップ
  if (!candidates.length) {
    return { nextInstances: instances, action: { kind: "skip", actorId, reason: "no-actions" } };
  }

  // 3) 評価で最良を選ぶ
  const best = pickBest(ctx, candidates);
  if (!best) {
    return { nextInstances: instances, action: { kind: "skip", actorId, reason: "no-best" } };
  }

  return { nextInstances: best.nextInstances, action: best.action };
}
