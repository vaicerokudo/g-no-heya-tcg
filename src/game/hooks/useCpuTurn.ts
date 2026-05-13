import { useCallback, useEffect, useRef } from "react";
import { cpuStepV1 } from "../ai/cpuStep";
import { getCpuActorOrder } from "../cpuOrder";
import {
  canContinueCpuLoop,
  canStartCpuTurn,
  isCpuActorAlive,
  shouldEndCpuLoop,
} from "../cpuTurnGuards";
import type { GameState, UnitInstance } from "../state";
import type { Side } from "../types";

type Phase = "setup_draw" | "setup_deploy" | "battle";
type CurrentRef<T> = { current: T };

type UseCpuTurnArgs = {
  cpuEnabled: boolean;
  phase: Phase;
  gameOver: boolean;
  turn: Side;
  turnSeq: number;
  rows: number;
  cols: number;
  unitsById: GameState["unitsById"];
  gameIdRef: CurrentRef<string>;
  turnRef: CurrentRef<Side>;
  phaseRef: CurrentRef<Phase>;
  instancesRef: CurrentRef<UnitInstance[]>;
  victoryRef: CurrentRef<unknown>;
  applyNextInstances: (nextInstances: UnitInstance[]) => void;
  endTurn: () => void;
};

const CPU_STEP_MS = 380;

export function useCpuTurn({
  cpuEnabled,
  phase,
  gameOver,
  turn,
  turnSeq,
  rows,
  cols,
  unitsById,
  gameIdRef,
  turnRef,
  phaseRef,
  instancesRef,
  victoryRef,
  applyNextInstances,
  endTurn,
}: UseCpuTurnArgs) {
  const cpuRunIdRef = useRef(0);
  const cpuTimerRef = useRef<number | null>(null);
  const lastCpuTurnKeyRef = useRef<string>("");
  const lastCpuEndRunIdRef = useRef<number>(0);

  const cpuEnabledRef = useRef(cpuEnabled);
  const applyNextInstancesRef = useRef(applyNextInstances);
  const endTurnRef = useRef(endTurn);

  useEffect(() => {
    cpuEnabledRef.current = cpuEnabled;
  }, [cpuEnabled]);

  useEffect(() => {
    applyNextInstancesRef.current = applyNextInstances;
  }, [applyNextInstances]);

  useEffect(() => {
    endTurnRef.current = endTurn;
  }, [endTurn]);

  const stopCpuLoopNorth = useCallback(() => {
    if (cpuTimerRef.current) {
      window.clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
  }, []);

  const startCpuLoopNorth = useCallback(() => {
    cpuRunIdRef.current += 1;
    const runId = cpuRunIdRef.current;

    if (cpuTimerRef.current) {
      window.clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }

    console.log("[CPU LOOP START]", `${gameIdRef.current}:${turnSeq}:north`, "runId=", cpuRunIdRef.current);

    const order0 = getCpuActorOrder(instancesRef.current, "north");

    let i = 0;
    let guard = Math.max(6, order0.length * 3);

    const cpuEndTurnOnce = () => {
      if (lastCpuEndRunIdRef.current === runId) return;
      lastCpuEndRunIdRef.current = runId;
      endTurnRef.current();
    };

    const step = () => {
      if (
        !canContinueCpuLoop({
          runId,
          currentRunId: cpuRunIdRef.current,
          victory: victoryRef.current,
          cpuEnabled: cpuEnabledRef.current,
          phase: phaseRef.current,
          turn: turnRef.current,
        })
      ) {
        return;
      }

      guard -= 1;
      if (shouldEndCpuLoop({ guard, index: i, orderLength: order0.length })) {
        stopCpuLoopNorth();
        cpuEndTurnOnce();
        return;
      }

      const actorId = order0[i];

      const curInstances = instancesRef.current;
      const actorAlive = isCpuActorAlive(curInstances, actorId);
      if (!actorAlive) {
        i += 1;
        cpuTimerRef.current = window.setTimeout(step, CPU_STEP_MS);
        return;
      }

      const { nextInstances, action } = cpuStepV1({
        side: "north",
        rows,
        cols,
        unitsById,
        instances: curInstances,
        actorId,
      });

      applyNextInstancesRef.current(nextInstances);
      console.log("[CPU STEP]", i, actorId, action);

      i += 1;
      cpuTimerRef.current = window.setTimeout(step, CPU_STEP_MS);
    };

    cpuTimerRef.current = window.setTimeout(step, CPU_STEP_MS);
  }, [
    cols,
    gameIdRef,
    instancesRef,
    phaseRef,
    rows,
    stopCpuLoopNorth,
    turnRef,
    turnSeq,
    unitsById,
    victoryRef,
  ]);

  useEffect(() => {
    const turnKey = `${gameIdRef.current}:${turnSeq}:north`;

    if (
      !canStartCpuTurn({
        phase,
        cpuEnabled,
        gameOver,
        turn,
        lastCpuTurnKey: lastCpuTurnKeyRef.current,
        currentTurnKey: turnKey,
      })
    ) {
      return;
    }

    lastCpuTurnKeyRef.current = turnKey;

    startCpuLoopNorth();

    return () => {
      stopCpuLoopNorth();
    };
  }, [
    cpuEnabled,
    gameIdRef,
    gameOver,
    phase,
    startCpuLoopNorth,
    stopCpuLoopNorth,
    turn,
    turnSeq,
  ]);

  return { stopCpuLoopNorth };
}
