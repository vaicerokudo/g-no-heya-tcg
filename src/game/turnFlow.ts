import { tickStartOfSide } from "./statusEffects";
import type { UnitInstance } from "./types";
import type { Side } from "./types";

type ApplyInstancesTransform = (instances: UnitInstance[]) => UnitInstance[];
type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

export function buildTurnKey({
  gameId,
  turnSeq,
  turn,
}: {
  gameId: string;
  turnSeq: number;
  turn: Side;
}) {
  return `${gameId}:${turnSeq}:${turn}`;
}

export function canRunEndTurn({
  lastEndTurnKey,
  currentTurnKey,
  tickLocked,
}: {
  lastEndTurnKey: string;
  currentTurnKey: string;
  tickLocked: boolean;
}) {
  if (tickLocked) return false;
  return lastEndTurnKey !== currentTurnKey;
}

export function canRunTurnStart({
  phase,
  victory,
  lastTurnStartKey,
  currentTurnKey,
}: {
  phase: "setup_draw" | "setup_deploy" | "battle";
  victory: unknown;
  lastTurnStartKey: string;
  currentTurnKey: string;
}) {
  if (victory) return false;
  if (phase !== "battle") return false;
  return lastTurnStartKey !== currentTurnKey;
}

export function buildTurnStartPerUnitTurn({
  instances,
  turn,
}: {
  instances: UnitInstance[];
  turn: Side;
}): PerUnitTurn {
  const perUnitTurn: PerUnitTurn = {};

  for (const unit of instances) {
    if (unit.side !== turn) continue;
    const stunned = (unit.stun ?? 0) > 0;
    perUnitTurn[unit.instanceId] = { moved: false, attacked: false, done: stunned };
  }

  return perUnitTurn;
}

export function buildEndTurnInstances({
  instances,
  currentSide,
  nextSide,
  applyInstancesTransform,
}: {
  instances: UnitInstance[];
  currentSide: UnitInstance["side"];
  nextSide: UnitInstance["side"];
  applyInstancesTransform: ApplyInstancesTransform;
}) {
  const afterEnd = instances
    .map((u) => {
      if (u.side !== currentSide) return u;

      const stun = u.stun ?? 0;
      const nextStun = stun > 0 ? Math.max(0, stun - 1) : 0;

      const burn = u.burn ?? 0;
      const burnDamage = burn > 0 ? 1 : 0;
      const nextBurn = burn > 0 ? Math.max(0, burn - 1) : 0;

      const next = { ...u, hp: u.hp - burnDamage };

      if (nextStun > 0) next.stun = nextStun;
      else delete next.stun;

      if (nextBurn > 0) next.burn = nextBurn;
      else delete next.burn;

      return next;
    })
    .filter((u) => u.hp > 0);

  const afterEndTransform = applyInstancesTransform(afterEnd);
  return tickStartOfSide({ instances: afterEndTransform }, nextSide);
}
