import type { Side } from "./types";
import type { UnitInstance } from "./state";

type Phase = "setup_draw" | "setup_deploy" | "battle";

export function canStartCpuTurn({
  phase,
  cpuEnabled,
  gameOver,
  turn,
  lastCpuTurnKey,
  currentTurnKey,
}: {
  phase: Phase;
  cpuEnabled: boolean;
  gameOver: boolean;
  turn: Side;
  lastCpuTurnKey: string;
  currentTurnKey: string;
}) {
  if (phase !== "battle") return false;
  if (!cpuEnabled) return false;
  if (gameOver) return false;
  if (turn !== "north") return false;
  if (lastCpuTurnKey === currentTurnKey) return false;
  return true;
}

export function isCpuActorAlive(instances: UnitInstance[], actorId: string) {
  return instances.some((u) => u.instanceId === actorId);
}

export function canContinueCpuLoop({
  runId,
  currentRunId,
  victory,
  cpuEnabled,
  phase,
  turn,
}: {
  runId: number;
  currentRunId: number;
  victory: unknown;
  cpuEnabled: boolean;
  phase: Phase;
  turn: Side;
}) {
  if (runId !== currentRunId) return false;
  if (victory) return false;
  if (!cpuEnabled) return false;
  if (phase !== "battle") return false;
  if (turn !== "north") return false;
  return true;
}

export function shouldEndCpuLoop({
  guard,
  index,
  orderLength,
}: {
  guard: number;
  index: number;
  orderLength: number;
}) {
  return guard <= 0 || index >= orderLength;
}
