// src/game/ai/cpu.ts
import { getLegalMoves } from "../move";
import { getAttackableTargets, applyNormalAttack } from "../attack";
import checkVictory from "../victory";
import { getEffectiveMaxHp } from "../stats";
import type { Side } from "../types";

type StateLike = {
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
  selectedInstanceId?: string | null;
};

// 進化マス：あなたの実装に合わせて r===3
function isEvolveCell(r: number) {
  return r === 3;
}


/**
 * CPUが1ターン分（sideの全ユニット）行動した後の instances を返す
 * ※ v1: 攻撃 > 進化マス移動 > それ以外
 */
export function runCpuTurnV1(opts: {
  side: Side;
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
}) {
  const { side, rows, cols, unitsById } = opts;
  let instances = opts.instances.map((x) => ({ ...x }));

  // 対象ユニット（このturn側）
  const myUnits = instances.filter((u) => u.side === side);

  for (const me of myUnits) {
    // 途中で死んでる可能性があるので最新を参照
    const cur = instances.find((u) => u.instanceId === me.instanceId);
    if (!cur) continue;

    // スタン中は行動スキップ（あなたの perUnitTurn の仕様に合わせる）
    if ((cur.stun ?? 0) > 0) continue;

    // 1) 攻撃できるなら攻撃（確殺優先）
    {
      const stateLike: StateLike = { rows, cols, unitsById, instances, selectedInstanceId: cur.instanceId };
      const targets = getAttackableTargets(stateLike as any, cur as any);

      if (targets.length) {
        // 確殺/HP低い相手を優先
        const best = targets
          .map((t: any) => {
            const enemy = instances.find((u) => u.instanceId === t.instanceId);
            const enemyHp = enemy?.hp ?? 0;

            // ざっくり：HP低いほど高得点
            const score = 1000 - enemyHp * 10;
            return { id: t.instanceId, score };
          })
          .sort((a, b) => b.score - a.score)[0];

        instances = applyNormalAttack(stateLike as any, cur as any, best.id) as any[];
        continue; // このユニットは行動終了
      }
    }

    // 2) 攻撃できないなら移動（進化マス優先 + 勝利チェック）
    {
      const stateLike: StateLike = { rows, cols, unitsById, instances, selectedInstanceId: cur.instanceId };
      const moves = getLegalMoves(stateLike as any, cur as any);

      if (!moves.length) continue;

      let bestMove = moves[0];
      let bestScore = -1e18;

      for (const m of moves) {
        // 移動を仮適用
        let next = instances.map((u) =>
          u.instanceId === cur.instanceId ? { ...u, pos: { r: m.r, c: m.c } } : u
        );

        // 進化マスなら進化（あなたの moveTo と同じ処理）
        if (isEvolveCell(m.r)) {
          next = next.map((u) => {
            if (u.instanceId !== cur.instanceId) return u;
            const form = u.form ?? "base";
            if (form === "g") return u;

            const def = unitsById[u.unitId];
            const newMaxHp = getEffectiveMaxHp(def.base.hp, "g");
            const newHp = Math.min((u.hp ?? 0) + 1, newMaxHp);
            return { ...u, form: "g", hp: newHp };
          });
        }

        // スコアリング（超簡易）
        let score = 0;

        // 勝利できるなら最優先
        const v = checkVictory(rows, cols, next as any);
        if (v && v.winner === side) score += 1_000_000;

        // 進化マスに乗れたら高得点
        if (isEvolveCell(m.r)) score += 5000;

        // 前に出る（雑）：southは上、northは下 に進めたら少し加点
        const forward = side === "south" ? -1 : 1;
        score += (m.r - cur.pos.r) * forward * 10;

        // 敵に近づく（マンハッタン距離を減らす）
        const enemies = instances.filter((u) => u.side !== side);
        if (enemies.length) {
          const curDist = Math.min(...enemies.map((e) => Math.abs(e.pos.r - cur.pos.r) + Math.abs(e.pos.c - cur.pos.c)));
          const nextDist = Math.min(...enemies.map((e) => Math.abs(e.pos.r - m.r) + Math.abs(e.pos.c - m.c)));
          score += (curDist - nextDist) * 15;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      }

      // bestMove を確定適用
      let next = instances.map((u) =>
        u.instanceId === cur.instanceId ? { ...u, pos: { r: bestMove.r, c: bestMove.c } } : u
      );

      if (isEvolveCell(bestMove.r)) {
        next = next.map((u) => {
          if (u.instanceId !== cur.instanceId) return u;
          const form = u.form ?? "base";
          if (form === "g") return u;

          const def = unitsById[u.unitId];
          const newMaxHp = getEffectiveMaxHp(def.base.hp, "g");
          const newHp = Math.min((u.hp ?? 0) + 1, newMaxHp);
          return { ...u, form: "g", hp: newHp };
        });
      }

      instances = next;
    }
  }

  return { instances };
}
