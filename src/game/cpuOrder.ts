import type { UnitInstance } from "./state";
import type { Side } from "./types";

export function getCpuActorOrder(instances: UnitInstance[], side: Side) {
  return instances
    .filter((u) => u.side === side)
    .map((u) => u.instanceId)
    .sort();
}
