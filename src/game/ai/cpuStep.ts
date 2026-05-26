// src/game/ai/cpuStep.ts
import { getLegalMoves } from "../move";
import { getAttackableTargets, applyNormalAttack } from "../attack";
import { getEffectiveMaxHp } from "../stats";
import type { Side } from "../types";
import { isAtOrBeyondEvolveRow } from "../boardConfig";
import { getAvailableSkillsForUnit, type SkillDef } from "../skills/registry";
import { executeSkillToInstances } from "../skills/execution";
import { createSkillExecutionContext } from "../skills/executionContext";

import { pickBest, type CpuAction, type EvalCtx } from "./eval";

type StateLike = {
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  selectedInstanceId?: string | null;
};

function isEvolveCell(side: Side, r: number, rows: number) {
  return isAtOrBeyondEvolveRow(side, r, rows);
}

function simulateMoveAndEvolve(params: {
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  actor: any;
  to: { r: number; c: number };
}) {
  const { rows, unitsById, instances, actor, to } = params;

  let next = instances.map((u) =>
    u.instanceId === actor.instanceId ? { ...u, pos: { r: to.r, c: to.c } } : u
  );

  let evolved = false;

  if (isEvolveCell(actor.side, to.r, rows)) {
    next = next.map((u) => {
      if (u.instanceId !== actor.instanceId) return u;

      const form = u.form ?? "base";
      if (form !== "base") return u;

      const def = unitsById[u.unitId];
      const newMaxHp = getEffectiveMaxHp(def.base.hp, "g");
      const newHp = Math.min((u.hp ?? 0) + 1, newMaxHp);
      evolved = true;

      return { ...u, form: "g", hp: newHp };
    });
  }

  return { nextInstances: next, evolved };
}

function isLineTarget(from: { r: number; c: number }, to: { r: number; c: number }, range: number) {
  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  const isLine = (absR === 0 && absC > 0) || (absC === 0 && absR > 0) || (absR === absC && absR > 0);
  return isLine && Math.max(absR, absC) <= range;
}

function skillTargetForEnemy(def: SkillDef, actor: any, enemy: any) {
  switch (def.targetMode) {
    case "chooseEnemyAdjacent": {
      const dr = Math.abs(enemy.pos.r - actor.pos.r);
      const dc = Math.abs(enemy.pos.c - actor.pos.c);
      return Math.max(dr, dc) === 1 ? { r: enemy.pos.r, c: enemy.pos.c, inst: enemy } : null;
    }
    case "chooseLineDirection":
      return isLineTarget(actor.pos, enemy.pos, def.range) ? { r: enemy.pos.r, c: enemy.pos.c, inst: enemy } : null;
    default:
      return null;
  }
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

  {
    const skillContext = createSkillExecutionContext({ rows, cols, instances, unitsById, selected: actor });
    const enemies = instances.filter((u) => u.side !== actor.side);

    for (const def of getAvailableSkillsForUnit(actor.unitId)) {
      if (def.requiresForm && actor.form !== def.requiresForm) continue;
      if (def.targetMode === "chooseAllyInRange") continue;

      if (
        def.targetMode === "instant" ||
        def.targetMode === "chooseFront3Cells" ||
        def.targetMode === "enemiesInRange"
      ) {
        const next = executeSkillToInstances({ def, skillContext, selected: actor });
        if (next && next !== instances) {
          candidates.push({ action: { kind: "skill", actorId, skillId: def.id }, nextInstances: next });
        }
        continue;
      }

      for (const enemy of enemies) {
        const target = skillTargetForEnemy(def, actor, enemy);
        if (!target) continue;
        const next = executeSkillToInstances({ def, skillContext, selected: actor, target });
        if (!next || next === instances) continue;
        candidates.push({
          action: { kind: "skill", actorId, skillId: def.id, targetId: enemy.instanceId },
          nextInstances: next,
        });
      }
    }
  }

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
