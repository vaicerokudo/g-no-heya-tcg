// src/game/ai/danger.ts
import type { Side } from "../types";
import { getAttackMarks } from "../attack";


/**
 * 「opts.side が次に動く側」として、
 * その相手（enemySide）が攻撃できる “危険マス(range)” を Set で返す。
 */
export function buildDangerCells(opts: {
  side: Side;
  rows: number;
  cols: number;
  unitsById: Record<string, any>;
  instances: any[];
}) {
  const { side, rows, cols, unitsById, instances } = opts;
  const enemySide: Side = side === "south" ? "north" : "south";

  const danger = new Set<string>();

  for (const enemy of instances) {
    if (enemy.side !== enemySide) continue;
    if ((enemy.stun ?? 0) > 0) continue; // スタン中は脅威にしない（好みで外してもOK）

    const stateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: enemy.instanceId,
    };

    const marks = getAttackMarks(stateLike as any, enemy as any);

    // 危険マスは、攻撃範囲として到達できるセルだけを使う。
    for (const mark of marks) {
      if (mark.kind !== "range") continue;
      danger.add(`${mark.r},${mark.c}`);
    }
  }

  return danger;
}
