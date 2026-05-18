import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { GameState, UnitInstance } from "../state";
import type { Side } from "../types";
import type { SkillId } from "../skills/registry";
import { buildNormalAttackInstances } from "../attack";
import { canStartMove, canStartNormalAttack, canUndoLastMove } from "../playerActionGuards";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;
type LastMove = {
  turn: Side;
  instanceId: string;
  prevInstances: UnitInstance[];
  prevPerUnitTurn: PerUnitTurn;
} | null;

type BuildMoveInstances = (args: {
  instances: UnitInstance[];
  selectedInstanceId: string;
  r: number;
  c: number;
  rows: number;
  unitsById: GameState["unitsById"];
}) => UnitInstance[];

type UsePlayerActionsArgs = {
  applyNextInstances: (next: UnitInstance[]) => void;
  buildMoveInstances: BuildMoveInstances;
  onMoveFinished?: (payload: { instanceId: string }) => void;
  onNormalAttackFired?: (payload: { attackerId: string; dr: number; dc: number }) => void;
  onNormalAttackImpact?: (payload: { targetId: string; r: number; c: number }) => void;
  lastMove: LastMove;
  gameOver: boolean;
  turn: Side;
  perUnitTurn: PerUnitTurn;
  selectedId: string | null;
  setPerUnitTurn: Dispatch<SetStateAction<PerUnitTurn>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setLastMove: Dispatch<SetStateAction<LastMove>>;
  setSkillMode: Dispatch<SetStateAction<SkillId | null>>;
};

type PerformMoveArgs = {
  inst: UnitInstance | null;
  r: number;
  c: number;
  rows: number;
  instances: UnitInstance[];
  unitsById: GameState["unitsById"];
};

type TryNormalAttackArgs = {
  selected: UnitInstance | null;
  gameOver: boolean;
  turn: Side;
  attackSet: Set<string>;
  targetId: string;
  rows: number;
  cols: number;
  unitsById: GameState["unitsById"];
  instances: UnitInstance[];
  selectedId: string | null;
};

type TryMoveArgs = {
  selected: UnitInstance | null;
  gameOver: boolean;
  turn: Side;
  perUnitTurn: PerUnitTurn;
  legalMoveSet: Set<string>;
  r: number;
  c: number;
  rows: number;
  instances: UnitInstance[];
  unitsById: GameState["unitsById"];
};

export function usePlayerActions({
  applyNextInstances,
  buildMoveInstances,
  onMoveFinished,
  onNormalAttackFired,
  onNormalAttackImpact,
  lastMove,
  gameOver,
  turn,
  perUnitTurn,
  selectedId,
  setPerUnitTurn,
  setSelectedId,
  setLastMove,
  setSkillMode,
}: UsePlayerActionsArgs) {
  const canUndoMove = useMemo(() => {
    return canUndoLastMove({ gameOver, lastMove, turn, perUnitTurn, selectedId });
  }, [gameOver, lastMove, turn, perUnitTurn, selectedId]);

  function finishMove(instanceId: string) {
    setPerUnitTurn((m) => ({
      ...m,
      [instanceId]: {
        ...(m[instanceId] ?? { moved: false, attacked: false, done: false }),
        moved: true,
      },
    }));
  }

  function performMove({ inst, r, c, rows, instances, unitsById }: PerformMoveArgs) {
    if (!inst) return;

    const next = buildMoveInstances({
      instances,
      selectedInstanceId: inst.instanceId,
      r,
      c,
      rows,
      unitsById,
    });

    applyNextInstances(next);

    finishMove(inst.instanceId);
    onMoveFinished?.({ instanceId: inst.instanceId });
  }

  function finishNormalAttack(instanceId: string) {
    setPerUnitTurn((m) => ({
      ...m,
      [instanceId]: {
        ...(m[instanceId] ?? { moved: false, attacked: false, done: false }),
        attacked: true,
        done: true,
      },
    }));

    setSelectedId(null);
  }

  function tryNormalAttack({
    selected,
    gameOver,
    turn,
    attackSet,
    targetId,
    rows,
    cols,
    unitsById,
    instances,
    selectedId,
  }: TryNormalAttackArgs) {
    if (!canStartNormalAttack({ selected, gameOver, turn, attackSet, targetId })) return false;
    if (!selected) return false;

    const target = instances.find((unit) => unit.instanceId === targetId) ?? null;
    if (!target) return false;
    const dr = target.pos.r - selected.pos.r;
    const dc = target.pos.c - selected.pos.c;

    const next = buildNormalAttackInstances({
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: selectedId,
      attacker: selected,
      targetId,
    });

    onNormalAttackFired?.({
      attackerId: selected.instanceId,
      dr,
      dc,
    });

    onNormalAttackImpact?.({
      targetId,
      r: target.pos.r,
      c: target.pos.c,
    });

    applyNextInstances(next);

    finishNormalAttack(selected.instanceId);
    return true;
  }

  function tryMove({
    selected,
    gameOver,
    turn,
    perUnitTurn,
    legalMoveSet,
    r,
    c,
    rows,
    instances,
    unitsById,
  }: TryMoveArgs) {
    if (!selected) return false;
    if (gameOver) return false;
    if (selected.side !== turn) return false;

    setLastMove({
      turn,
      instanceId: selected.instanceId,
      prevInstances: instances,
      prevPerUnitTurn: perUnitTurn,
    });

    if (!canStartMove({ selected, gameOver, turn, perUnitTurn, legalMoveSet, r, c })) return false;

    performMove({ inst: selected, r, c, rows, instances, unitsById });
    return true;
  }

  function undoMove() {
    if (!lastMove) return false;
    if (gameOver) return false;
    if (lastMove.turn !== turn) return false;

    applyNextInstances(lastMove.prevInstances);
    setPerUnitTurn(lastMove.prevPerUnitTurn);
    setSelectedId(lastMove.instanceId);
    setSkillMode(null);
    setLastMove(null);
    return true;
  }

  return {
    finishMove,
    performMove,
    finishNormalAttack,
    tryNormalAttack,
    tryMove,
    undoMove,
    canUndoMove,
  };
}
