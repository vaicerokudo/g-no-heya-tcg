import type { Dispatch, SetStateAction } from "react";
import {
  buildDeployInstances,
  canStartNorthReinforce,
  canStartSouthDeploy,
  canStartSouthReinforce,
  getNorthReinforceUnitId,
  getTopRowEmptyCols,
} from "../deploy";
import { removeHandCardAtIndex } from "../handDeck";
import type { GameState, UnitInstance } from "../state";
import type { Side } from "../types";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type UseDeployActionsArgs = {
  setInstancesAndRef: (nextOrFn: UnitInstance[] | ((prev: UnitInstance[]) => UnitInstance[])) => void;
  setHandSouth: Dispatch<SetStateAction<string[]>>;
  setHandNorth: Dispatch<SetStateAction<string[]>>;
  setSelectedHandKey: Dispatch<SetStateAction<string | null>>;
  setDeployPlaced: Dispatch<SetStateAction<number>>;
  setPhase: Dispatch<SetStateAction<"setup_draw" | "setup_deploy" | "battle">>;
  setTurnState: Dispatch<SetStateAction<{ side: Side; seq: number }>>;
  setBattleDeployUsed: Dispatch<SetStateAction<boolean>>;
  setPerUnitTurn: Dispatch<SetStateAction<PerUnitTurn>>;
  initialDeployCount: number;
};

type FinishSouthDeployArgs = {
  nextInstances: UnitInstance[];
  handIndex: number;
};

type FinishSouthReinforceArgs = {
  nextInstances: UnitInstance[];
  handIndex: number;
  instanceId: string;
};

type TrySouthDeployArgs = {
  phase: "setup_draw" | "setup_deploy" | "battle";
  selectedHandPick: { idx: number } | null;
  handSouth: string[];
  unitsById: GameState["unitsById"];
  instances: UnitInstance[];
  r: number;
  c: number;
  rows: number;
  initialDeployCandidateCols?: readonly number[];
  spawnUnit: Parameters<typeof buildDeployInstances>[0]["spawnUnit"];
};

type TrySouthReinforceArgs = {
  phase: "setup_draw" | "setup_deploy" | "battle";
  turn: Side;
  battleDeployUsed: boolean;
  selectedHandPick: { idx: number } | null;
  handSouth: string[];
  unitsById: GameState["unitsById"];
  instances: UnitInstance[];
  r: number;
  c: number;
  rows: number;
  initialDeployCandidateCols?: readonly number[];
  spawnUnit: Parameters<typeof buildDeployInstances>[0]["spawnUnit"];
};

type TryNorthReinforceArgs = {
  phase: "setup_draw" | "setup_deploy" | "battle";
  turn: Side;
  turnSeq: number;
  handNorth: string[];
  unitsById: GameState["unitsById"];
  instances: UnitInstance[];
  cols: number;
  spawnUnit: Parameters<typeof buildDeployInstances>[0]["spawnUnit"];
};

export function useDeployActions({
  setInstancesAndRef,
  setHandSouth,
  setHandNorth,
  setSelectedHandKey,
  setDeployPlaced,
  setPhase,
  setTurnState,
  setBattleDeployUsed,
  setPerUnitTurn,
  initialDeployCount,
}: UseDeployActionsArgs) {
  function finishSouthDeploy({ nextInstances, handIndex }: FinishSouthDeployArgs) {
    setInstancesAndRef(nextInstances);

    setHandSouth((prev) => removeHandCardAtIndex(prev, handIndex));
    setSelectedHandKey(null);

    setDeployPlaced((n) => {
      const nn = n + 1;
      if (nn >= initialDeployCount) {
        setPhase("battle");
        setTurnState((s) => ({ side: "south", seq: s.seq + 1 }));
      }
      return nn;
    });
  }

  function trySouthDeploy({
    phase,
    selectedHandPick,
    handSouth,
    unitsById,
    instances,
    r,
    c,
    rows,
    initialDeployCandidateCols,
    spawnUnit,
  }: TrySouthDeployArgs) {
    const occupied = instances.some((u) => u.pos.r === r && u.pos.c === c);
    if (
      !canStartSouthDeploy({
        phase,
        selectedHandPick,
        r,
        c,
        rows,
        candidateCols: initialDeployCandidateCols,
        occupied,
      })
    ) {
      return false;
    }
    if (!selectedHandPick) return false;

    const unitId = handSouth[selectedHandPick.idx];
    if (!unitId) return false;

    const def = unitsById[unitId];
    if (!def) return false;

    const instanceId = `S-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextInstances = buildDeployInstances({
      instances,
      unitId,
      side: "south",
      r,
      c,
      instanceId,
      spawnUnit,
    });
    if (!nextInstances) return false;

    finishSouthDeploy({ nextInstances, handIndex: selectedHandPick.idx });
    return true;
  }

  function finishSouthReinforce({
    nextInstances,
    handIndex,
    instanceId,
  }: FinishSouthReinforceArgs) {
    setInstancesAndRef(nextInstances);

    setHandSouth((prev) => removeHandCardAtIndex(prev, handIndex));
    setSelectedHandKey(null);

    setBattleDeployUsed(true);

    setPerUnitTurn((m) => ({
      ...m,
      [instanceId]: { moved: true, attacked: true, done: true },
    }));
  }

  function trySouthReinforce({
    phase,
    turn,
    battleDeployUsed,
    selectedHandPick,
    handSouth,
    unitsById,
    instances,
    r,
    c,
    rows,
    initialDeployCandidateCols,
    spawnUnit,
  }: TrySouthReinforceArgs) {
    const occupied = instances.some((u) => u.pos.r === r && u.pos.c === c);
    if (
      !canStartSouthReinforce({
        phase,
        turn,
        battleDeployUsed,
        selectedHandPick,
        r,
        c,
        rows,
        candidateCols: initialDeployCandidateCols,
        occupied,
      })
    ) {
      return false;
    }
    if (!selectedHandPick) return false;

    const unitId = handSouth[selectedHandPick.idx];
    if (!unitId) return false;

    const def = unitsById[unitId];
    if (!def) return false;

    const instanceId = `S-R-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextInstances = buildDeployInstances({
      instances,
      unitId,
      side: "south",
      r,
      c,
      instanceId,
      spawnUnit,
    });
    if (!nextInstances) return false;

    finishSouthReinforce({
      nextInstances,
      handIndex: selectedHandPick.idx,
      instanceId,
    });
    return true;
  }

  function finishNorthReinforce(nextInstances: UnitInstance[]) {
    setInstancesAndRef(nextInstances);

    setHandNorth((prev) => prev.slice(1));
  }

  function tryNorthReinforce({
    phase,
    turn,
    turnSeq,
    handNorth,
    unitsById,
    instances,
    cols,
    spawnUnit,
  }: TryNorthReinforceArgs) {
    if (!canStartNorthReinforce({ phase, turn, handNorth })) return false;

    const empties = getTopRowEmptyCols(instances, cols);
    if (empties.length === 0) return false;

    const unitId = getNorthReinforceUnitId({ handNorth, unitsById });
    if (!unitId) return false;

    const c = empties[Math.floor(Math.random() * empties.length)];
    const instanceId = `N-R-${turnSeq}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const nextInstances = buildDeployInstances({
      instances,
      unitId,
      side: "north",
      r: 0,
      c,
      instanceId,
      spawnUnit,
    });
    if (!nextInstances) return false;

    finishNorthReinforce(nextInstances);
    return true;
  }

  return {
    finishSouthDeploy,
    finishSouthReinforce,
    finishNorthReinforce,
    trySouthDeploy,
    trySouthReinforce,
    tryNorthReinforce,
  };
}
