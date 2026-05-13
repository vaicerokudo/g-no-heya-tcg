import type { Side, UnitInstance } from "./types";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type LastMove = {
  turn: Side;
  instanceId: string;
} | null;

export function canSelectUnit({
  inst,
  gameOver,
  turn,
  perUnitTurn,
}: {
  inst: UnitInstance;
  gameOver: boolean;
  turn: Side;
  perUnitTurn: PerUnitTurn;
}) {
  return !gameOver && inst.side === turn && !(perUnitTurn[inst.instanceId]?.done ?? false);
}

export function canUndoLastMove({
  gameOver,
  lastMove,
  turn,
  perUnitTurn,
  selectedId,
}: {
  gameOver: boolean;
  lastMove: LastMove;
  turn: Side;
  perUnitTurn: PerUnitTurn;
  selectedId: string | null;
}) {
  if (gameOver) return false;
  if (!lastMove) return false;
  if (lastMove.turn !== turn) return false;

  const me = perUnitTurn[lastMove.instanceId];
  if (!me) return false;

  if (!me.moved) return false;
  if (me.attacked) return false;
  if (me.done) return false;

  if (selectedId && selectedId !== lastMove.instanceId) return false;

  return true;
}

export function canStartMove({
  selected,
  gameOver,
  turn,
  perUnitTurn,
  legalMoveSet,
  r,
  c,
}: {
  selected: UnitInstance | null;
  gameOver: boolean;
  turn: Side;
  perUnitTurn: PerUnitTurn;
  legalMoveSet: Set<string>;
  r: number;
  c: number;
}) {
  if (!selected) return false;
  if (gameOver) return false;
  if (selected.side !== turn) return false;

  const me = perUnitTurn[selected.instanceId];
  if (me?.done) return false;
  if (me?.moved) return false;

  return legalMoveSet.has(`${r},${c}`);
}

export function canStartNormalAttack({
  selected,
  gameOver,
  turn,
  attackSet,
  targetId,
}: {
  selected: UnitInstance | null;
  gameOver: boolean;
  turn: Side;
  attackSet: Set<string>;
  targetId: string;
}) {
  if (!selected) return false;
  if (gameOver) return false;
  if (selected.side !== turn) return false;
  if (!attackSet.has(targetId)) return false;

  return true;
}
