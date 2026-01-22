// src/game/knockback.ts
import type { UnitInstance } from "./types";

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function inside(rows: number, cols: number, r: number, c: number) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

function replacePos(
  instances: UnitInstance[],
  targetId: string,
  r: number,
  c: number
): UnitInstance[] {
  return instances.map((u) =>
    u.instanceId === targetId ? { ...u, pos: { r, c } } : u
  );
}

export function tryKnockback(
  stateLike: { rows: number; cols: number; instances: UnitInstance[] },
  targetId: string,
  dr: number,
  dc: number,
  dist: number
): { ok: boolean; instances: UnitInstance[]; moved: number; reason?: string } {
  const { rows, cols, instances } = stateLike;

  const idx = instances.findIndex((x) => x.instanceId === targetId);
  if (idx === -1) {
    return { ok: false, instances, moved: 0, reason: "not_found" };
  }

  // occupied map（target自身は後で除外して判定）
  const occ = new Map<string, string>();
  for (const inst of instances) {
    occ.set(posKey(inst.pos.r, inst.pos.c), inst.instanceId);
  }

  const target = instances[idx];
  let r = target.pos.r;
  let c = target.pos.c;
  let moved = 0;

  for (let i = 0; i < dist; i++) {
    const nr = r + dr;
    const nc = c + dc;

    if (!inside(rows, cols, nr, nc)) {
      return moved > 0
        ? { ok: true, instances: replacePos(instances, targetId, r, c), moved }
        : { ok: false, instances, moved: 0, reason: "out_of_board" };
    }

    const k = posKey(nr, nc);
    const hit = occ.get(k);
    // 自分以外がいたらブロック
    if (hit && hit !== targetId) break;

    r = nr;
    c = nc;
    moved++;
  }

  if (moved === 0) {
    return { ok: false, instances, moved: 0, reason: "blocked" };
  }

  return { ok: true, instances: replacePos(instances, targetId, r, c), moved };
}
