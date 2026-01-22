import type { GameState, Pos, UnitInstance } from "./state";
import type { Side } from "./types";

function inBounds(r: number, c: number, rows: number, cols: number) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

function key(r: number, c: number) {
  return `${r},${c}`;
}

export function buildOccupancy(instances: UnitInstance[]) {
  const m = new Map<string, UnitInstance>();
  for (const inst of instances) m.set(key(inst.pos.r, inst.pos.c), inst);
  return m;
}

export function applyFacing(dy: number, side: Side): number {
  // southの前は上（dy=-）、northの前は下（dy=+）
  // なので「相対dy（前=-1）」を、sideに応じて実dyへ変換する
  return side === "south" ? dy : -dy;
}

export function getLegalMoves(state: GameState, inst: UnitInstance): Pos[] {
if (inst.stun && inst.stun > 0) return [];
  

  const def = state.unitsById[inst.unitId];
  const mp: any = def.base.movePattern;
  const occ = buildOccupancy(state.instances);

  const addIf = (r: number, c: number, out: Pos[]) => {
    if (!inBounds(r, c, state.rows, state.cols)) return;
    if (occ.has(key(r, c))) return; // マスが埋まってたら行けない（通過は別）
    out.push({ r, c });
  };

  const out: Pos[] = [];

  if (mp.type === "orthogonal") {
    const range = mp.range as number;

    // 上下左右に1..range
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    for (const d of dirs) {
      for (let step = 1; step <= range; step++) {
        const r = inst.pos.r + d.dr * step;
        const c = inst.pos.c + d.dc * step;
        if (!inBounds(r, c, state.rows, state.cols)) break;
        if (occ.has(key(r, c))) break; // ブロックされる
        out.push({ r, c });
      }
    }
    return out;
  }

  if (mp.type === "custom") {
    for (const m of mp.movesRelative as Array<{ dx: number; dy: number }>) {
      // JSONは dx/dy で、dyは「前=-」前提の相対系なのでsideで反転
      const dr = applyFacing(m.dy, inst.side);
      const dc = m.dx;
      addIf(inst.pos.r + dr, inst.pos.c + dc, out);
    }
    return out;
  }

  if (mp.type === "teleportFixed") {
    for (const m of mp.destinationsRelative as Array<{ dx: number; dy: number }>) {
      const dr = applyFacing(m.dy, inst.side);
      const dc = m.dx;
      addIf(inst.pos.r + dr, inst.pos.c + dc, out);
    }
    return out;
  }

  return out;
}
