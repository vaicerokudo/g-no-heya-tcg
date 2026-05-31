// src/game/victory.ts
import type { Side } from "./types";
import { getGateCols, getNorthGateRow, getSouthGateRow } from "./boardConfig";
import type { ScenarioId } from "./scenario/scenarios";

export type Victory = { winner: Side; detail: string };

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
  instances: Array<{ unitId: string; side: Side; pos?: { r: number; c: number } }>
): Victory | null {
  if (scenarioId === "scenario6") {
    const rokudoAlive = instances.some((u) => u.unitId === "ROKUDO" && u.side === "north");
    const sochoAlive = instances.some((u) => u.unitId === "SOCHO" && u.side === "south");

    if (!rokudoAlive) {
      return { winner: "south", detail: "Scenario 6 clear: ROKUDO was defeated in training." };
    }
    if (!sochoAlive) {
      return { winner: "north", detail: "Scenario 6 failed: SOCHO was defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario5") {
    const rockelAlive = instances.some((u) => u.unitId === "ROCKEL" && u.side === "north");
    const ushimaruAlive = instances.some((u) => u.unitId === "USHIMARU" && u.side === "south");

    if (!rockelAlive) {
      return { winner: "south", detail: "Scenario 5 clear: ROCKEL was stopped." };
    }
    if (!ushimaruAlive) {
      return { winner: "north", detail: "Scenario 5 failed: USHIMARU was defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario4") {
    const bakerFound = instances.some(
      (u) =>
        u.side === "south" &&
        (u.unitId === "HIBIKI" || u.unitId === "YABUKO_NORMAL") &&
        u.pos?.r === 2 &&
        u.pos?.c === 3
    );

    if (bakerFound) {
      return { winner: "south", detail: "Scenario 4 clear: the hidden bakery was found." };
    }

    return null;
  }

  if (scenarioId === "scenario_plaza_monten") {
    const montenAlive = instances.some((u) => u.unitId === "MONTEN" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!montenAlive) {
      return { winner: "south", detail: "Plaza trial clear: MONTEN defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Plaza trial failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario_hidden_author") {
    const authorAlive = instances.some((u) => u.unitId === "ROKUDO_AUTHOR" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!authorAlive) {
      return { winner: "south", detail: "Hidden author trial clear: ROKUDO_AUTHOR defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Hidden author trial failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario_hidden_myouou") {
    const myououAlive = instances.some((u) => u.unitId === "HIDDEN_MYOUOU" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!myououAlive) {
      return { winner: "south", detail: "Hidden trial clear: HIDDEN_MYOUOU defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Hidden trial failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario3") {
    const goblinAlive = instances.some((u) => u.unitId === "GOBLIN" && u.side === "north");
    const sochoAlive = instances.some((u) => u.unitId === "SOCHO" && u.side === "south");
    const southAlive = instances.some((u) => u.side === "south");

    if (!goblinAlive) {
      return { winner: "south", detail: "Scenario 3 clear: all GOBLIN units defeated." };
    }
    if (!sochoAlive) {
      return { winner: "north", detail: "Scenario 3 failed: SOCHO was defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Scenario 3 failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario2") {
    const wyvernAlive = instances.some((u) => u.unitId === "LESSER_WYVERN" && u.side === "north");
    const sochoAlive = instances.some((u) => u.unitId === "SOCHO" && u.side === "south");
    const southAlive = instances.some((u) => u.side === "south");

    if (!wyvernAlive) {
      return { winner: "south", detail: "Scenario 2 clear: LESSER_WYVERN defeated." };
    }
    if (!sochoAlive) {
      return { winner: "north", detail: "Scenario 2 failed: SOCHO was defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Scenario 2 failed: all allies were defeated." };
    }

    return null;
  }

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
