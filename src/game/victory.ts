// src/game/victory.ts
import type { Side } from "./types";
import { getGateCols, getNorthGateRow, getSouthGateRow } from "./boardConfig";

export type Victory = { winner: Side; detail: string };
export type ScenarioId = "scenario1";

export function checkVictory(
  rows: number,
  cols: number,
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

  const gateCols = new Set(getGateCols(cols));
  const southOnGate = instances.some(
    (u) => u.side === "south" && u.pos.r === getNorthGateRow() && gateCols.has(u.pos.c)
  );
  if (southOnGate) {
    return {
      winner: "south",
      detail: "勝利条件：ゲート制圧（SOUTHがNORTH側ゲートに到達）→ SOUTHの勝利",
    };
  }

  const northOnGate = instances.some(
    (u) => u.side === "north" && u.pos.r === getSouthGateRow(rows) && gateCols.has(u.pos.c)
  );
  if (northOnGate) {
    return {
      winner: "north",
      detail: "勝利条件：ゲート制圧（NORTHがSOUTH側ゲートに到達）→ NORTHの勝利",
    };
  }

  return null;
}

export function checkScenarioVictory(
  scenarioId: ScenarioId,
  instances: Array<{ unitId: string; side: Side }>
): Victory | null {
  if (scenarioId !== "scenario1") return null;

  const boarAlive = instances.some((u) => u.unitId === "BOAR" && u.side === "north");
  const sochoAlive = instances.some((u) => u.unitId === "SOCHO" && u.side === "south");
  const southAlive = instances.some((u) => u.side === "south");

  if (!boarAlive) {
    return { winner: "south", detail: "Scenario 1 clear: BOAR defeated." };
  }
  if (!sochoAlive) {
    return { winner: "north", detail: "Scenario 1 failed: SOCHO was defeated." };
  }
  if (!southAlive) {
    return { winner: "north", detail: "Scenario 1 failed: all allies were defeated." };
  }

  return null;
}

export default checkVictory;
