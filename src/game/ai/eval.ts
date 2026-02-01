// src/game/ai/eval.ts
import type { Side } from "../types";
import checkVictory from "../victory";
import { buildDangerCells } from "./danger";

export type CpuAction =
  | { kind: "attack"; actorId: string; targetId: string }
  | { kind: "move"; actorId: string; r: number; c: number; evolved?: boolean }
  | { kind: "skip"; actorId: string; reason: string };

export type EvalCtx = {
  side: Side;
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  actorId: string;

  // 任意：危険セルやゲート（今は未使用でもOK）
  dangerCells?: Set<string>;
  gateCells?: Set<string>;
};

export type Candidate = {
  action: CpuAction;
  nextInstances: any[];
  score: number;
};

export function posKey(r: number, c: number) {
  return `${r},${c}`;
}

export function manhattan(a: { r: number; c: number }, b: { r: number; c: number }) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}


export function scoreCandidate(ctx: EvalCtx, cand: { action: CpuAction; nextInstances: any[] }) {
  const { action, nextInstances } = cand;

  // まず勝てる手は最優先（あなたのcpuStep内の方針を移植）
  const v = checkVictory(ctx.rows, ctx.cols, nextInstances as any);
  if (v && v.winner === ctx.side) return 1_000_000;

  let s = 0;

  if (action.kind === "attack") {
    s += 150;

    const tgt = ctx.instances.find((u) => u.instanceId === action.targetId);
    if (tgt) {
      // 低HP優先（雑でOK）
      s += 120 - (tgt.hp ?? 0) * 10;
    }
  }

  if (action.kind === "move") {
    s += 10;

    // 進化
    if (action.evolved) s += 5000;

    const danger =
      ctx.dangerCells ??
      buildDangerCells({
        side: ctx.side,
        rows: ctx.rows,
        cols: ctx.cols,
        unitsById: ctx.unitsById,
        instances: nextInstances,
      });

    if (danger.has(posKey(action.r, action.c))) {
      s -= 120; // ←ここを調整するだけで難易度が変わる
    }

    // 前進（ざっくり）
    const actor = ctx.instances.find((u) => u.instanceId === ctx.actorId);
    if (actor) {
      const forward = ctx.side === "south" ? -1 : 1;
      s += (action.r - actor.pos.r) * forward * 10;

      // 敵に近づく
      const enemies = ctx.instances.filter((u) => u.side !== ctx.side);
      if (enemies.length) {
        const curDist = Math.min(...enemies.map((e) => manhattan(actor.pos, e.pos)));
        const nextDist = Math.min(...enemies.map((e) => manhattan({ r: action.r, c: action.c }, e.pos)));
        s += (curDist - nextDist) * 15;
      }
    }

    // ゲートが渡されてたら、近いほど少し加点（今は未使用でもOK）
    if (ctx.gateCells && ctx.gateCells.size) {
      const gates = Array.from(ctx.gateCells).map((k) => {
        const [rr, cc] = k.split(",").map(Number);
        return { r: rr, c: cc };
      });
      const dg = Math.min(...gates.map((g) => manhattan({ r: action.r, c: action.c }, g)));
      s += 80 - dg * 6;
    }
  }

  if (action.kind === "skip") {
    s -= 5;
  }

  return s;
}

export function pickBest(ctx: EvalCtx, candidates: Array<{ action: CpuAction; nextInstances: any[] }>) {
  let best: Candidate | null = null;

  for (const c of candidates) {
    const score = scoreCandidate(ctx, c);
    if (!best || score > best.score) {
      best = { action: c.action, nextInstances: c.nextInstances, score };
    }
  }

  return best;
}

