// src/game/victory.ts
import type { Side } from "./types";
import { getGateCols, getNorthGateRow, getSouthGateRow } from "./boardConfig";
import type { ScenarioId } from "./scenario/scenarios";

export type Victory = { winner: Side; detail: string };

const ISOLATION_DUEL_MATCHUPS: Partial<Record<ScenarioId, { allyUnitId: string; darkUnitId: string }>> = {
  scenario22: { allyUnitId: "USHIMARU", darkUnitId: "DARK_USHIMARU" },
  scenario23: { allyUnitId: "SOCHO", darkUnitId: "DARK_SOCHO" },
  scenario24: { allyUnitId: "TSUTSU", darkUnitId: "DARK_TSUTSU" },
  scenario25: { allyUnitId: "ROKUDO", darkUnitId: "DARK_ROKUDO" },
  scenario26: { allyUnitId: "7171", darkUnitId: "DARK_7171" },
  scenario27: { allyUnitId: "MYOUOU", darkUnitId: "DARK_MYOUOU" },
  scenario28: { allyUnitId: "HIBIKI", darkUnitId: "DARK_HIBIKI" },
  scenario29: { allyUnitId: "DELI", darkUnitId: "DARK_DELI" },
  scenario30: { allyUnitId: "YABUKO_NORMAL", darkUnitId: "DARK_YABUKO" },
  scenario31: { allyUnitId: "ROCKEL", darkUnitId: "DARK_ROCKEL" },
  scenario32: { allyUnitId: "PLAYER", darkUnitId: "DARK_PLAYER" },
};

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
  instances: Array<{ unitId: string; side: Side; pos?: { r: number; c: number }; hp?: number }>
): Victory | null {
  if (["scenario16", "scenario17", "scenario19"].includes(scenarioId)) {
    const northAlive = instances.some((u) => u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!northAlive) {
      return { winner: "south", detail: `${scenarioId} clear: the bay monsters were defeated.` };
    }
    if (!southAlive) {
      return { winner: "north", detail: `${scenarioId} failed: all allies were defeated.` };
    }

    return null;
  }

  if (scenarioId === "scenario20") {
    const ushimaru = instances.find((u) => u.unitId === "USHIMARU" && u.side === "south");
    const southAlive = instances.some((u) => u.side === "south");
    const northAlive = instances.some((u) => u.side === "north");

    if (!southAlive) {
      return { winner: "north", detail: "Scenario 20 failed: the fishing team was defeated." };
    }
    if (ushimaru?.pos?.r === 0 && ushimaru.pos.c === 3) {
      return {
        winner: "south",
        detail: "釣り上げ成功：うしまるが湾中央の釣り場でリヴァイアサンの気配を捉えた！",
      };
    }
    if (!northAlive) {
      return { winner: "south", detail: "Scenario 20 clear: the fishing route was secured." };
    }

    return null;
  }

  if (scenarioId === "scenario21") {
    const leviathanAlive = instances.some((u) => u.unitId === "LEVIATHAN" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!southAlive) {
      return { winner: "north", detail: "Scenario 21 failed: the leviathan battle team was defeated." };
    }
    if (!leviathanAlive) {
      return { winner: "south", detail: "Scenario 21 clear: LEVIATHAN was defeated." };
    }

    return null;
  }

  const isolationDuel = ISOLATION_DUEL_MATCHUPS[scenarioId];
  if (isolationDuel) {
    const darkAlive = instances.some((u) => u.unitId === isolationDuel.darkUnitId && u.side === "north");
    const allyAlive = instances.some((u) => u.unitId === isolationDuel.allyUnitId && u.side === "south");

    if (!allyAlive) {
      return { winner: "north", detail: `${scenarioId} failed: the isolation duel was lost.` };
    }
    if (!darkAlive) {
      return { winner: "south", detail: `${scenarioId} clear: the shadow was defeated.` };
    }

    return null;
  }

  if (scenarioId === "scenario18") {
    const leviathan = instances.find((u) => u.unitId === "MIST_LEVIATHAN" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!southAlive) {
      return { winner: "north", detail: "Scenario 18 failed: the survey team was defeated." };
    }
    if (!leviathan || (leviathan.hp ?? 0) <= 12) {
      return { winner: "south", detail: "Scenario 18 clear: enough data was gathered from the mist leviathan." };
    }

    return null;
  }

  if (["scenario12", "scenario13", "scenario14", "scenario15"].includes(scenarioId)) {
    const northAlive = instances.some((u) => u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!northAlive) {
      return { winner: "south", detail: `${scenarioId} clear: all wasteland enemies were defeated.` };
    }
    if (!southAlive) {
      return { winner: "north", detail: `${scenarioId} failed: all allies were defeated.` };
    }

    return null;
  }

  if (scenarioId === "scenario11") {
    const blackNoiseAlive = instances.some((u) => u.unitId === "BLACK_NOISE_ROKU" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!blackNoiseAlive) {
      return { winner: "south", detail: "Scenario 11 clear: all BLACK_NOISE_ROKU units were defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Scenario 11 failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario10") {
    const cloneAlive = instances.some((u) => u.unitId === "ROKU_CLONE" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!cloneAlive) {
      return { winner: "south", detail: "Scenario 10 clear: all ROKU_CLONE units were defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Scenario 10 failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario9") {
    const robotAlive = instances.some((u) => u.unitId === "PROTO_ROBOT" && u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!robotAlive) {
      return { winner: "south", detail: "Scenario 9 clear: all prototype robots were defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Scenario 9 failed: all allies were defeated." };
    }

    return null;
  }

  if (scenarioId === "scenario8") {
    const deli = instances.find((u) => u.unitId === "DELI" && u.side === "south");
    const zima = instances.find((u) => u.unitId === "ZIMA" && u.side === "north");

    if (!deli) {
      return { winner: "north", detail: "Scenario 8 failed: DELI lost track of ZIMA." };
    }
    if (!zima) {
      return { winner: "south", detail: "Scenario 8 clear: ZIMA was caught." };
    }
    if (deli.pos && zima.pos) {
      const distance = Math.abs(deli.pos.r - zima.pos.r) + Math.abs(deli.pos.c - zima.pos.c);
      if (distance <= 1) {
        return { winner: "south", detail: "Scenario 8 clear: DELI caught ZIMA." };
      }
    }

    return null;
  }

  if (scenarioId === "scenario7") {
    const northAlive = instances.some((u) => u.side === "north");
    const southAlive = instances.some((u) => u.side === "south");

    if (!northAlive) {
      return { winner: "south", detail: "Scenario 7 clear: all mine monsters were defeated." };
    }
    if (!southAlive) {
      return { winner: "north", detail: "Scenario 7 failed: all allies were defeated." };
    }

    return null;
  }

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
