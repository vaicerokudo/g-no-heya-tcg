// src/game/victory.ts
import type { Side } from "./types";

export type Victory = { winner: Side; detail: string };

const GATE_COLS = new Set([1, 3, 5]);

export function checkVictory(
  rows: number,
  _cols: number,
  instances: Array<{ side: Side; pos: { r: number; c: number } }>
): Victory | null {
  const southAlive = instances.some((u) => u.side === "south");
  const northAlive = instances.some((u) => u.side === "north");

  if (!southAlive) {
    return { winner: "north", detail: "勝利条件：全滅（SOUTHが全滅）→ NORTHの勝利" };
  }
  if (!northAlive) {
    return { winner: "south", detail: "勝利条件：全滅（NORTHが全滅）→ SOUTHの勝利" };
  }

  const southOnGate = instances.some(
    (u) => u.side === "south" && u.pos.r === 0 && GATE_COLS.has(u.pos.c)
  );
  if (southOnGate) {
    return {
      winner: "south",
      detail: "勝利条件：ゲート制圧（SOUTHがNORTH側ゲートに到達）→ SOUTHの勝利",
    };
  }

  const northOnGate = instances.some(
    (u) => u.side === "north" && u.pos.r === rows - 1 && GATE_COLS.has(u.pos.c)
  );
  if (northOnGate) {
    return {
      winner: "north",
      detail: "勝利条件：ゲート制圧（NORTHがSOUTH側ゲートに到達）→ NORTHの勝利",
    };
  }

  return null;
}

export default checkVictory;
