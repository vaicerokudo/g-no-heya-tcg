import type { UnitInstance } from "./types";

export type DamageFxEvent = {
  id: string;
  instanceId: string;
  amount: number;
};

export function buildDamageFxEvents({
  prevInstances,
  nextInstances,
  createId,
}: {
  prevInstances: UnitInstance[];
  nextInstances: UnitInstance[];
  createId: (instanceId: string) => string;
}) {
  const prevById = new Map(prevInstances.map((unit) => [unit.instanceId, unit]));
  const events: DamageFxEvent[] = [];

  for (const next of nextInstances) {
    const prev = prevById.get(next.instanceId);
    if (!prev) continue;

    const hpDelta = next.hp - prev.hp;
    if (hpDelta < 0) {
      events.push({
        id: createId(next.instanceId),
        instanceId: next.instanceId,
        amount: -hpDelta,
      });
    }
  }

  return events;
}
