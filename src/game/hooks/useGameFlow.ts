import { useEffect } from "react";
import { buildTurnKey, canRunEndTurn, canRunTurnStart } from "../turnFlow";
import { otherSide } from "../turn";
import type { Side } from "../types";

type Phase = "setup_draw" | "setup_deploy" | "battle";
type CurrentRef<T> = { current: T };

type UseGameFlowArgs = {
  phase: Phase;
  turn: Side;
  turnSeq: number;
  victory: unknown;
  gameIdRef: CurrentRef<string>;
  prevPhaseRef: CurrentRef<Phase>;
  lastTurnStartKeyRef: CurrentRef<string>;
  lastEndTurnKeyRef: CurrentRef<string>;
  endTurnTickLockRef: CurrentRef<boolean>;
  drawAtStartOfTurn: (side: Side, turnKey: string) => void;
  resetTurnStartRuleState: () => void;
  clearTurnStartUiState: () => void;
  stopCpuLoopNorth: () => void;
  setShowEndTurnConfirm: (show: boolean) => void;
  setSelectedId: (id: string | null) => void;
  setTurnState: (updater: (state: { side: Side; seq: number }) => { side: Side; seq: number }) => void;
};

export function useGameFlow({
  phase,
  turn,
  turnSeq,
  victory,
  gameIdRef,
  prevPhaseRef,
  lastTurnStartKeyRef,
  lastEndTurnKeyRef,
  endTurnTickLockRef,
  drawAtStartOfTurn,
  resetTurnStartRuleState,
  clearTurnStartUiState,
  stopCpuLoopNorth,
  setShowEndTurnConfirm,
  setSelectedId,
  setTurnState,
}: UseGameFlowArgs) {
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    const enteringBattle = prevPhase !== "battle";

    const key = buildTurnKey({ gameId: gameIdRef.current, turnSeq, turn });
    if (
      !canRunTurnStart({
        phase,
        victory,
        lastTurnStartKey: lastTurnStartKeyRef.current,
        currentTurnKey: key,
      })
    ) {
      return;
    }
    lastTurnStartKeyRef.current = key;

    if (!enteringBattle) {
      drawAtStartOfTurn(turn, key);
    }

    resetTurnStartRuleState();

    clearTurnStartUiState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnSeq, turn, phase, victory]);

  function prepareEndTurnRun() {
    stopCpuLoopNorth();
    setShowEndTurnConfirm(false);
  }

  function beginEndTurnOnce() {
    const currentTurnKey = `${buildTurnKey({ gameId: gameIdRef.current, turnSeq, turn })}:endturn`;
    if (
      !canRunEndTurn({
        lastEndTurnKey: lastEndTurnKeyRef.current,
        currentTurnKey,
        tickLocked: endTurnTickLockRef.current,
      })
    ) {
      return false;
    }

    endTurnTickLockRef.current = true;
    window.setTimeout(() => {
      endTurnTickLockRef.current = false;
    }, 0);

    lastEndTurnKeyRef.current = currentTurnKey;
    return true;
  }

  function finishEndTurn() {
    setSelectedId(null);
    setTurnState((state) => ({ side: otherSide(state.side), seq: state.seq + 1 }));
  }

  return { beginEndTurnOnce, prepareEndTurnRun, finishEndTurn };
}
