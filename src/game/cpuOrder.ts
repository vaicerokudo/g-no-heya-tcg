import type { Side, UnitInstance } from "./types";

export function getCpuActorOrder(instances: UnitInstance[], side: Side) {
  return instances
    .filter((u) => u.side === side)
    .flatMap((u) => Array.from({ length: Math.max(1, 1 + (u.extraActionsPerTurn ?? 0)) }, () => u.instanceId))
    .sort();
}
