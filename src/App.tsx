import "./App.css";
import unitsData from "./data/units.v1.2.json";
import { createDemoState } from "./game/state";
import { getLegalMoves } from "./game/move";
import { otherSide } from "./game/turn";
import type { Side } from "./game/types";
import {
  getAttackableTargets,
  applyNormalAttack,
  getAttackMarks,
} from "./game/attack";
import { tryKnockback } from "./game/knockback";

import {
  SKILLS,
  getAvailableSkillsForUnit,
  type SkillId,
} from "./game/skills/registry";

import checkVictory from "./game/victory";

import { useEffect, useMemo, useRef, useState } from "react";
import { tickStartOfSide } from "./game/skills";
import { getEffectiveMaxHp } from "./game/stats";

import { Board } from "./components/Board/Board";
import { UnitPopup } from "./components/Popup/UnitPopup";
import { TurnEndConfirm } from "./components/UI/TurnEndConfirm";
import { VictoryModal } from "./components/UI/VictoryModal";

import { cpuStepV1 } from "./game/ai/cpuStep";

import { shuffle, drawN } from "./game/deck";

import {
  getPortrait as getPortraitPath,
  cardCandidates,
  portraitCandidates,
  type Skin,
} from "./assets/imagePaths";

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function skillUseKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}

function parseHandKey(key: string | null): { uid: string; idx: number } | null {
  if (!key) return null;
  const m = key.match(/^(.*)-(\d+)$/);
  if (!m) return null;
  return { uid: m[1], idx: Number(m[2]) };
}

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;
type Phase = "setup_draw" | "setup_deploy" | "battle";

export default function App() {
  // ===== stable base =====
  const initial = useMemo(() => createDemoState(unitsData as any), []);
  const rows = initial.rows;
  const cols = initial.cols;
  const unitsById = initial.unitsById;

  // ===== turn state (統合) =====
  const [turnState, setTurnState] = useState<{ side: Side; seq: number }>({
    side: "south",
    seq: 0,
  });
  const turn = turnState.side;
  const turnSeq = turnState.seq;

  // ===== state (全部ここに集約) =====
  const [phase, setPhase] = useState<Phase>("setup_draw");
  const [cpuEnabled, setCpuEnabled] = useState(true);

  const [deckSouth, setDeckSouth] = useState<string[]>([]);
  const [handSouth, setHandSouth] = useState<string[]>([]);
  const [deckNorth, setDeckNorth] = useState<string[]>([]);
  const [handNorth, setHandNorth] = useState<string[]>([]);

  const [selectedHandKey, setSelectedHandKey] = useState<string | null>(null);

  const [deployPlaced, setDeployPlaced] = useState(0);
  const [battleDeployUsed, setBattleDeployUsed] = useState(false);

  const [instances, setInstances] = useState(initial.instances);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [skillMode, setSkillMode] = useState<SkillId | null>(null);
  const [usedSkills, setUsedSkills] = useState<Record<string, boolean>>({});
  const [perUnitTurn, setPerUnitTurn] = useState<PerUnitTurn>({});
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false);

  const [victory, setVictory] = useState<null | { winner: Side; detail: string }>(null);
  const gameOver = victory !== null;

  const [skin, setSkin] = useState<Skin>("default");

  const [popupId, setPopupId] = useState<string | null>(null);
  const popupOpen = popupId !== null;
  const popupUnit = instances.find((x) => x.instanceId === popupId) ?? null;

  const [debugTargetId, setDebugTargetId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [swapUnitId, setSwapUnitId] = useState<string>("");

  type DmgFx = { id: string; instanceId: string; amount: number };
  const [dmgFx, setDmgFx] = useState<DmgFx[]>([]);

  const [lastMove, setLastMove] = useState<null | {
    turn: Side;
    instanceId: string;
    prevInstances: any[];
    prevPerUnitTurn: PerUnitTurn;
  }>(null);

  const [bottomBarH, setBottomBarH] = useState(0);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);

  // ===== refs (CPU/各種ガード用) =====

const deckSouthRef = useRef<string[]>(deckSouth);
useEffect(() => { deckSouthRef.current = deckSouth; }, [deckSouth]);

const deckNorthRef = useRef<string[]>(deckNorth);
useEffect(() => { deckNorthRef.current = deckNorth; }, [deckNorth]);

const didInitRef = useRef(false);

  const endTurnLockRef = useRef(false);

  // HMR保険：このAppインスタンス固有ID
  const gameIdRef = useRef(`${Date.now()}-${Math.random().toString(16).slice(2)}`);

  // draw重複ガード（gameId×turnSeq×side）
  const lastDrawKeyRef = useRef<string>("");

  // ターン開始ガード（gameId×turnSeq×turn）
  const lastTurnStartKeyRef = useRef<string>("");

  // battle突入判定用
  const prevPhaseRef = useRef<Phase>("setup_draw");

  const cpuRunIdRef = useRef(0);
  const cpuTimerRef = useRef<number | null>(null);
  const CPU_STEP_MS = 380;

  const turnRef = useRef<Side>(turn);
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const handNorthRef = useRef<string[]>(handNorth);
  useEffect(() => {
    handNorthRef.current = handNorth;
  }, [handNorth]);

  const instancesRef = useRef(instances);
  useEffect(() => {
    instancesRef.current = instances;
  }, [instances]);

  const victoryRef = useRef(victory);
  useEffect(() => {
    victoryRef.current = victory;
  }, [victory]);

  // ===== helpers =====
  function stopCpuLoopNorth() {
    cpuRunIdRef.current += 1; // 走ってるstep全部無効化
    if (cpuTimerRef.current) {
      window.clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
  }

  function resetGuards() {
    lastDrawKeyRef.current = "";
    lastTurnStartKeyRef.current = "";
    prevPhaseRef.current = "setup_draw";
    endTurnLockRef.current = false;
  }

  function bumpGameId() {
    gameIdRef.current = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function setInstancesAndRef(
    nextOrFn:
      | typeof instances
      | ((prev: typeof instances) => typeof instances)
  ) {
    setInstances((prev) => {
      const next =
        typeof nextOrFn === "function"
          ? (nextOrFn as (p: typeof instances) => typeof instances)(prev)
          : nextOrFn;
      instancesRef.current = next;
      return next;
    });
  }

function getDeckBackPath(skin: Skin) {
  if (skin === "dark") return "/cards/back_dark.png";
  if (skin === "travel") return "/cards/back_travel.png";
  return "/cards/back_default.png";
}

function getHandCardSrc(unitId: string, side: Side, skin: Skin) {
  // まず “カード画像”候補（スキン込み）を探す
  const cands = cardCandidates(unitId, side, "base", skin);
  if (cands && cands.length > 0) return cands[0];

  // 無ければ “ポートレート”にフォールバック
  return getPortraitPath(unitId, side, "base", skin);
}


  const selectedHandPick = useMemo(
    () => parseHandKey(selectedHandKey),
    [selectedHandKey]
  );

  const selectedHandUnitId = useMemo(() => {
    if (!selectedHandPick) return null;
    return handSouth[selectedHandPick.idx] ?? null;
  }, [selectedHandPick, handSouth]);

// ===== setup =====
const setupCountRef = useRef(0);

const startSetup = () => {
  setupCountRef.current += 1;

  console.log(
    "[SETUP CALL]",
    "count=", setupCountRef.current,
    "gameId(before)=", gameIdRef.current,
    "phase=", phaseRef.current,
    "turn=", turnRef.current,
    "seq=", turnSeq
  );
  console.trace("[SETUP TRACE]"); // ★犯人特定

  // ---- ここから既存のstartSetup本体 ----
  stopCpuLoopNorth();
  bumpGameId();
  resetGuards();

  setVictory(null);
  setSkillMode(null);
  setUsedSkills({});
  setPerUnitTurn({});
  setShowEndTurnConfirm(false);
  setBattleDeployUsed(false);
  setDeployPlaced(0);

  setPhase("setup_deploy");
  setTurnState({ side: "south", seq: 0 });

  setSelectedId(null);
  setSelectedHandKey(null);

  const allUnitIdsRaw = Object.keys(unitsById);

  // nameでユニーク化（最初に見つかったものを採用）
  const uniqByName = new Map<string, string>();
  for (const id of allUnitIdsRaw) {
    const nm = unitsById[id]?.name ?? id;
    if (!uniqByName.has(nm)) uniqByName.set(nm, id);
  }
  const allUnitIds = [...uniqByName.values()];

  console.log("[SETUP] ALL", allUnitIds);
  console.log("[SETUP] ALL uniq", new Set(allUnitIds).size, "/", allUnitIds.length);

  // south 5 draw
  const sDeck0 = shuffle(allUnitIds);
  const { take: sHand, rest: sRest } = drawN(sDeck0, 5);

  console.log("[SETUP] south hand", sHand);
  console.log("[SETUP] south hand uniq", new Set(sHand).size, "/", sHand.length);

  setDeckSouth(sRest);
  setHandSouth(sHand);

  // north 5 draw
  const nDeck0 = shuffle(allUnitIds);
  const { take: nHand, rest: nRest } = drawN(nDeck0, 5);
  setDeckNorth(nRest);
  setHandNorth(nHand);

  // north 3 deploy top row
  const colsIdx = shuffle([...Array(cols)].map((_, i) => i));
  const pickedCols = colsIdx.slice(0, 3);

  const northUnits = nHand.slice(0, 3).map((unitId, i) => {
    const def = unitsById[unitId];
    return {
      instanceId: `N-${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
      unitId,
      side: "north" as const,
      pos: { r: 0, c: pickedCols[i] },
      form: "base" as const,
      hp: def.base.hp,
    };
  });

  // instancesRefも同期更新
  instancesRef.current = northUnits as any;
  setInstances(northUnits as any);

  setHandNorth(nHand.slice(3));
};



useEffect(() => {
  if (didInitRef.current) return;
  didInitRef.current = true;

  startSetup();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setSkillMode(null);
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);



  // ===== reinforcement (north: ターン開始時に上段へ1体) =====
  useEffect(() => {
    if (phaseRef.current !== "battle") return;
    if (turnRef.current !== "north") return;

    const hn = handNorthRef.current;
    if (!hn || hn.length === 0) return;

    const cur = instancesRef.current;
    const used = new Set<number>();
    for (const u of cur as any[]) if (u.pos?.r === 0) used.add(u.pos.c);

    const empties: number[] = [];
    for (let c = 0; c < cols; c++) if (!used.has(c)) empties.push(c);
    if (empties.length === 0) return;

    const unitId = hn[0];
    const def = unitsById[unitId];
    if (!def) return;

    const c = empties[Math.floor(Math.random() * empties.length)];

    const newUnit = {
      instanceId: `N-R-${turnSeq}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      unitId,
      side: "north" as const,
      pos: { r: 0, c },
      form: "base" as const,
      hp: def.base.hp,
    };

    setInstancesAndRef((prev) => [...prev, newUnit] as any);
    setHandNorth((prev) => prev.slice(1));
  }, [turnSeq, cols, unitsById]);

  const canDeployCellSouth = (r: number, _c: number) => r === rows - 1;

  const deploySouthAt = (r: number, c: number) => {
    if (phase !== "setup_deploy") return;
    if (!selectedHandPick) return;
    if (!canDeployCellSouth(r, c)) return;

    const occupied = instances.some((u: any) => u.pos.r === r && u.pos.c === c);
    if (occupied) return;

    const unitId = handSouth[selectedHandPick.idx];
    if (!unitId) return;

    const def = unitsById[unitId];
    if (!def) return;

    const instanceId = `S-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newUnit = {
      instanceId,
      unitId,
      side: "south" as const,
      pos: { r, c },
      form: "base" as const,
      hp: def.base.hp,
    };

    setInstancesAndRef((prev) => [...prev, newUnit] as any);
    setHandSouth((prev) => prev.filter((_, i) => i !== selectedHandPick.idx));
    setSelectedHandKey(null);

    setDeployPlaced((n) => {
      const nn = n + 1;
      if (nn >= 3) {
        // battle開始（ここで「battleの最初のターン」を開始扱いにする）
        setPhase("battle");
        setTurnState((s) => ({ side: "south", seq: s.seq + 1 }));
      }
      return nn;
    });
  };

  const deploySouthReinforceAt = (r: number, c: number) => {
    if (phase !== "battle") return;
    if (turn !== "south") return;
    if (battleDeployUsed) return;
    if (!selectedHandPick) return;

    if (r !== rows - 1) return;

    const occupied = instances.some((u: any) => u.pos.r === r && u.pos.c === c);
    if (occupied) return;

    const unitId = handSouth[selectedHandPick.idx];
    if (!unitId) return;

    const def = unitsById[unitId];
    if (!def) return;

    const instanceId = `S-R-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const newUnit = {
      instanceId,
      unitId,
      side: "south" as const,
      pos: { r, c },
      form: "base" as const,
      hp: def.base.hp,
    };

    setInstancesAndRef((prev) => [...prev, newUnit] as any);
    setHandSouth((prev) => prev.filter((_, i) => i !== selectedHandPick.idx));
    setSelectedHandKey(null);

    setBattleDeployUsed(true);

    setPerUnitTurn((m) => ({
      ...m,
      [instanceId]: { moved: false, attacked: false, done: false },
    }));
  };

  function startCpuLoopNorth() {
    cpuRunIdRef.current += 1;
    const runId = cpuRunIdRef.current;

    if (cpuTimerRef.current) {
      window.clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }

    // このnorthターンで処理する順番を固定
    const order0 = (instancesRef.current as any[])
      .filter((u) => u.side === "north")
      .map((u) => u.instanceId)
      .sort();

    let i = 0;
    let guard = Math.max(6, order0.length * 3);

    const step = () => {
      if (runId !== cpuRunIdRef.current) return;
      if (victoryRef.current) return;
      if (!cpuEnabled) return;
      if (phaseRef.current !== "battle") return;
      if (turnRef.current !== "north") return;

      guard -= 1;
      if (guard <= 0) {
        stopCpuLoopNorth();
        endTurn();
        return;
      }

      if (i >= order0.length) {
        stopCpuLoopNorth();
        endTurn();
        return;
      }

      const actorId = order0[i];

      const curInstances = instancesRef.current as any[];
      const actorAlive = curInstances.some((u) => u.instanceId === actorId);
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

      applyNextInstances(nextInstances as any);
      console.log("[CPU STEP]", i, actorId, action);

      i += 1;
      cpuTimerRef.current = window.setTimeout(step, CPU_STEP_MS);
    };

    cpuTimerRef.current = window.setTimeout(step, CPU_STEP_MS);
  }

  function resetGame() {
    stopCpuLoopNorth();
    bumpGameId();
    resetGuards();
    startSetup();
  }

  useEffect(() => {
    setLastMove(null);
  }, [turn]);

  // endTurnロック解除は「turnStateが進んだ後」に限定
  useEffect(() => {
    endTurnLockRef.current = false;
  }, [turnSeq, turn]);

 // ===== turn start (1ターン1回だけ) =====
useEffect(() => {
  if (victory) return;

  // ★ 先にprevPhaseを確定更新（早期returnでも履歴が壊れない）
  const prevPhase = prevPhaseRef.current;
  prevPhaseRef.current = phase;

  // battle以外はここで終わり
  if (phase !== "battle") return;

  const enteringBattle = prevPhase !== "battle";

  const key = `${gameIdRef.current}:${turnSeq}:${turn}`;
  if (lastTurnStartKeyRef.current === key) return;
  lastTurnStartKeyRef.current = key;

  // battle突入直後は除外（初期ドロー5枚があるため）
  if (!enteringBattle) {
    drawAtStartOfTurn(turn, key); // ← 下の②に合わせる
  }

  // 行動リセット（refから確実に最新を読む）
  setPerUnitTurn(() => {
    const m: PerUnitTurn = {};
    for (const u of instancesRef.current as any[]) {
      if (u.side !== turn) continue;
      const stunned = (u.stun ?? 0) > 0;
      m[u.instanceId] = { moved: false, attacked: false, done: stunned };
    }
    return m;
  });

  setSelectedId(null);
  setSkillMode(null);
  setShowEndTurnConfirm(false);

  if (turn === "south") setBattleDeployUsed(false);
  setSelectedHandKey(null);
}, [turnSeq, turn, phase, victory]); // ★ instancesは入れない


  function applyNextInstances(next: typeof instances) {
    const prevById = new Map((instancesRef.current as any[]).map((u) => [u.instanceId, u]));
    const born: DmgFx[] = [];

    for (const n of next as any[]) {
      const p = prevById.get(n.instanceId);
      if (!p) continue;
      const dh = (n.hp ?? 0) - (p.hp ?? 0);
      if (dh < 0) {
        born.push({
          id: `${Date.now()}-${n.instanceId}-${Math.random().toString(16).slice(2)}`,
          instanceId: n.instanceId,
          amount: -dh,
        });
      }
    }

    if (born.length) {
      setDmgFx((prev) => [...prev, ...born]);
      window.setTimeout(() => {
        setDmgFx((prev) => prev.filter((x) => !born.some((b) => b.id === x.id)));
      }, 700);
    }

    // refを先に更新してズレ防止
    instancesRef.current = next as any;
    setInstances(next as any);

    const v = checkVictory(rows, cols, next as any);
    if (v) setVictory(v);
  }

  function useWindowWidth() {
    const [w, setW] = useState<number>(
      typeof window !== "undefined" ? window.innerWidth : 1024
    );
    useEffect(() => {
      const onResize = () => setW(window.innerWidth);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    return w;
  }

  const winW = useWindowWidth();

  const cell = useMemo(() => {
    const pad = 24;
    const max = 64;
    const min = 44;
    const size = Math.floor((winW - pad) / cols);
    return Math.max(min, Math.min(max, size));
  }, [winW, cols]);

  const letters = ["A", "B", "C", "D", "E", "F", "G"];

  const unitOptions = useMemo(() => Object.keys(unitsById).sort(), [unitsById]);

  const selected = instances.find((x: any) => x.instanceId === selectedId) ?? null;

  const selectedSkills =
    selected && !(selected.stun && selected.stun > 0)
      ? getAvailableSkillsForUnit(selected.unitId)
      : [];

  const isEvolveCell = (r: number, _c: number) => r === 3;

  const occ = useMemo(() => {
    const m = new Map<string, any>();
    for (const inst of instances as any[]) m.set(posKey(inst.pos.r, inst.pos.c), inst);
    return m;
  }, [instances]);

  const legalMoves = useMemo(() => {
    if (!selected) return [];
    if (gameOver) return [];
    if (selected.side !== turn) return [];

    const me = perUnitTurn[selected.instanceId];
    if (me?.done) return [];
    if (me?.moved) return [];

    const stateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: selectedId,
    };
    return getLegalMoves(stateLike as any, selected as any);
  }, [selected, gameOver, turn, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

  const legalMoveSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of legalMoves as any[]) s.add(posKey(p.r, p.c));
    return s;
  }, [legalMoves]);

  const attackMarks = useMemo(() => {
    if (!selected) return [];
    if (gameOver) return [];
    if (selected.side !== turn) return [];

    const me = perUnitTurn[selected.instanceId];
    if (me?.done) return [];
    if (me?.attacked) return [];

    const stateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: selectedId,
    };
    return getAttackMarks(stateLike as any, selected as any);
  }, [selected, gameOver, turn, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

  const attackRangeSet = useMemo(() => {
    const s = new Set<string>();
    for (const mark of attackMarks as any[]) {
      if (mark.kind === "range") s.add(posKey(mark.r, mark.c));
    }
    return s;
  }, [attackMarks]);

  const attackBlockerSet = useMemo(() => {
    const s = new Set<string>();
    for (const mark of attackMarks as any[]) {
      if (mark.kind === "blocker") s.add(posKey(mark.r, mark.c));
    }
    return s;
  }, [attackMarks]);

  const skillTargetSet = useMemo(() => {
    const s = new Set<string>();
    if (!skillMode || !selected || gameOver) return s;

    const def = SKILLS[skillMode];
    if (!def) return s;
    if (def.requiresForm && selected.form !== def.requiresForm) return s;

    const occLocal = new Map<string, any>();
    for (const u of instances as any[]) occLocal.set(posKey(u.pos.r, u.pos.c), u);

    const dirs8 = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const;

    if (def.targetMode === "chooseEnemyAdjacent") {
      for (const [dr, dc] of dirs8) {
        const rr = selected.pos.r + dr;
        const cc = selected.pos.c + dc;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
        const hit = occLocal.get(posKey(rr, cc));
        if (hit && hit.side !== selected.side) s.add(posKey(rr, cc));
      }
    }

    if (def.targetMode === "chooseLineDirection") {
      for (const [dr, dc] of dirs8) {
        for (let i = 1; i <= def.range; i++) {
          const rr = selected.pos.r + dr * i;
          const cc = selected.pos.c + dc * i;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;

          const k = posKey(rr, cc);
          s.add(k);

          if (occLocal.get(k)) break;
        }
      }
    }

    if (def.targetMode === "instant") {
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const dr = Math.abs(rr - selected.pos.r);
          const dc = Math.abs(cc - selected.pos.c);
          if (Math.max(dr, dc) <= def.aoeRadius) s.add(posKey(rr, cc));
        }
      }
    }

    if (def.targetMode === "chooseFront3Cells") {
      const fr = selected.side === "south" ? -1 : 1;
      const rr = selected.pos.r + fr;
      for (const dc of [-1, 0, 1]) {
        const cc = selected.pos.c + dc;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
        s.add(posKey(rr, cc));
      }
    }

    return s;
  }, [skillMode, selected, gameOver, rows, cols, instances]);

  const attackables = useMemo(() => {
    if (!selected) return [];
    if (gameOver) return [];
    if (selected.side !== turn) return [];

    const me = perUnitTurn[selected.instanceId];
    if (me?.done) return [];
    if (me?.attacked) return [];

    const stateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: selectedId,
    };
    return getAttackableTargets(stateLike as any, selected as any);
  }, [selected, gameOver, turn, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

  const attackSet = useMemo(() => {
    const s = new Set<string>();
    for (const t of attackables as any[]) s.add(t.instanceId);
    return s;
  }, [attackables]);

  function undoMove() {
    if (!lastMove) return;
    if (gameOver) return;
    if (lastMove.turn !== turn) return;

    applyNextInstances(lastMove.prevInstances as any);
    setPerUnitTurn(lastMove.prevPerUnitTurn);
    setSelectedId(lastMove.instanceId);
    setSkillMode(null);
    setLastMove(null);
  }

  const moveTo = (r: number, c: number) => {
    if (!selected) return;
    if (gameOver) return;
    if (selected.side !== turn) return;

    setLastMove({
      turn,
      instanceId: selected.instanceId,
      prevInstances: instances as any,
      prevPerUnitTurn: perUnitTurn,
    });

    const me = perUnitTurn[selected.instanceId];
    if (me?.done) return;
    if (me?.moved) return;

    const k = posKey(r, c);
    if (!legalMoveSet.has(k)) return;

    let next = (instances as any[]).map((u) =>
      u.instanceId === selected.instanceId ? { ...u, pos: { r, c } } : u
    );

    if (isEvolveCell(r, c)) {
      next = next.map((u) => {
        if (u.instanceId !== selected.instanceId) return u;

        const form = u.form ?? "base";
        if (form === "g") return u;

        const def = unitsById[u.unitId];
        const newMaxHp = getEffectiveMaxHp(def.base.hp, "g");
        const newHp = Math.min(u.hp + 1, newMaxHp);

        return { ...u, form: "g", hp: newHp };
      });
    }

    applyNextInstances(next as any);

    setPerUnitTurn((m) => ({
      ...m,
      [selected.instanceId]: {
        ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
        moved: true,
      },
    }));
  };

  function tryExecuteSkillOnCell(opts: { r: number; c: number; inst: any | null }) {
    if (!skillMode) return false;
    if (!selected) {
      setSkillMode(null);
      return true;
    }

    const me = perUnitTurn[selected.instanceId];
    if (gameOver || selected.side !== turn || (me?.done ?? false) || (me?.attacked ?? false)) {
      setSkillMode(null);
      return true;
    }

    const def = SKILLS[skillMode];
    if (!def) {
      setSkillMode(null);
      return true;
    }

    if (!skillTargetSet.has(posKey(opts.r, opts.c))) {
      setSkillMode(null);
      return true;
    }

    if (def.requiresForm && selected.form !== def.requiresForm) {
      setSkillMode(null);
      return true;
    }

    const key = skillUseKey(turn, selected.instanceId, def.id);
    if (def.oncePerMatch && usedSkills[key]) {
      setSkillMode(null);
      return true;
    }

    switch (def.targetMode) {
      case "chooseFront3Cells": {
        const fr = selected.side === "south" ? -1 : 1;
        const rr = selected.pos.r + fr;

        const ok =
          opts.r === rr &&
          (opts.c === selected.pos.c - 1 ||
            opts.c === selected.pos.c ||
            opts.c === selected.pos.c + 1);

        if (!ok) {
          setSkillMode(null);
          return true;
        }

        const stateLike = { rows, cols, instances };
        const next = def.execute({
          stateLike,
          casterId: selected.instanceId,
          damage: def.damage,
          burnTicks: (def as any).burnTicks,
          stunTurns: def.stunTurns,
        } as any);

        applyNextInstances(next as any);

        setPerUnitTurn((m) => ({
          ...m,
          [selected.instanceId]: {
            ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
            attacked: true,
            done: true,
          },
        }));

        if (def.oncePerMatch) {
          const usedKey = skillUseKey(turn, selected.instanceId, def.id);
          setUsedSkills((m) => ({ ...m, [usedKey]: true }));
        }

        setSkillMode(null);
        setSelectedId(null);
        return true;
      }

      case "chooseEnemyAdjacent": {
        if (!opts.inst) {
          setSkillMode(null);
          return true;
        }
        if (opts.inst.side === selected.side) {
          setSkillMode(null);
          return true;
        }

        const dr = Math.abs(opts.r - selected.pos.r);
        const dc = Math.abs(opts.c - selected.pos.c);
        if (Math.max(dr, dc) !== 1) {
          setSkillMode(null);
          return true;
        }

        const stateLike = { rows, cols, instances };
        const next = def.execute({
          stateLike,
          casterId: selected.instanceId,
          targetId: opts.inst.instanceId,
          damage: def.damage,
        });

        applyNextInstances(next as any);

        setPerUnitTurn((m) => ({
          ...m,
          [selected.instanceId]: {
            ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
            attacked: true,
            done: true,
          },
        }));

        if (def.oncePerMatch) setUsedSkills((m) => ({ ...m, [key]: true }));

        setSkillMode(null);
        return true;
      }

      case "chooseLineDirection": {
        const dr = opts.r - selected.pos.r;
        const dc = opts.c - selected.pos.c;

        const absR = Math.abs(dr);
        const absC = Math.abs(dc);

        const isLine =
          (absR === 0 && absC > 0) ||
          (absC === 0 && absR > 0) ||
          (absR === absC && absR > 0);

        const dist = Math.max(absR, absC);
        if (!isLine || dist > def.range) {
          setSkillMode(null);
          return true;
        }

        const dirR = Math.sign(dr);
        const dirC = Math.sign(dc);

        const stateLike = { rows, cols, instances };
        const next = def.execute({
          stateLike,
          casterId: selected.instanceId,
          dirR,
          dirC,
          range: def.range,
          damage: def.damage,
          knockback: def.knockback,
        });

        applyNextInstances(next as any);

        setPerUnitTurn((m) => ({
          ...m,
          [selected.instanceId]: {
            ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
            attacked: true,
            done: true,
          },
        }));

        if (def.oncePerMatch) setUsedSkills((m) => ({ ...m, [key]: true }));

        setSkillMode(null);
        return true;
      }

      default:
        setSkillMode(null);
        return true;
    }
  }

  const attack = (targetId: string) => {
    if (!selected) return;
    if (gameOver) return;
    if (selected.side !== turn) return;
    if (!attackSet.has(targetId)) return;

    const stateLike = { rows, cols, unitsById, instances, selectedInstanceId: selectedId };
    const next = applyNormalAttack(stateLike as any, selected as any, targetId);

    applyNextInstances(next as any);

    setPerUnitTurn((m) => ({
      ...m,
      [selected.instanceId]: {
        ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
        attacked: true,
        done: true,
      },
    }));

    setSelectedId(null);
  };

function drawAtStartOfTurn(side: Side, turnKey: string) {
  // ★ turnStartと同じ文脈の鍵で統一
  const k = `${turnKey}:draw`;
  if (lastDrawKeyRef.current === k) return;
  lastDrawKeyRef.current = k;

  const deck = side === "south" ? deckSouthRef.current : deckNorthRef.current;
  if (!deck || deck.length === 0) return;

  const [top, ...rest] = deck;

  console.log("[DRAW]", k, "side", side, "turn", turnRef.current, "phase", phaseRef.current);
  console.log("[DRAW CARD]", side, top);

  if (side === "south") {
    setDeckSouth(rest);
    setHandSouth((hand) => [...hand, top]);
  } else {
    setDeckNorth(rest);
    setHandNorth((hand) => [...hand, top]);
  }
}


  const endTurn = () => {
    if (endTurnLockRef.current) return;
    endTurnLockRef.current = true;

    // CPU残りが追撃endTurnしないよう停止
    stopCpuLoopNorth();

    setShowEndTurnConfirm(false);
    if (gameOver) return;

    const nextSide: Side = otherSide(turn);

    setInstancesAndRef((prev) => {
      const afterEnd = (prev as any[])
        .map((u: any) => {
          if (u.side !== turn) return u;

          const s = u.stun ?? 0;
          const nextStun = s > 0 ? Math.max(0, s - 1) : 0;

          const b = u.burn ?? 0;
          const burnDamage = b > 0 ? 1 : 0;
          const nextBurn = b > 0 ? Math.max(0, b - 1) : 0;

          let v: any = { ...u, hp: u.hp - burnDamage };

          if (nextStun > 0) v.stun = nextStun;
          else {
            const { stun, ...rest } = v;
            v = rest;
          }

          if (nextBurn > 0) v.burn = nextBurn;
          else {
            const { burn, ...rest } = v;
            v = rest;
          }

          return v;
        })
        .filter((u: any) => u.hp > 0);

      const afterStart = tickStartOfSide({ instances: afterEnd }, nextSide);

      const v = checkVictory(rows, cols, afterStart as any);
      if (v) setVictory(v);

      return afterStart as any;
    });

    setSelectedId(null);

    // ★ turn と seq を 1回で更新（これが二重ドロー根絶の本命）
    setTurnState((s) => ({ side: otherSide(s.side), seq: s.seq + 1 }));
  };

  // CPUループ開始（northのbattleターンのみ）
  useEffect(() => {
    if (phase !== "battle") return;
    if (!cpuEnabled) return;
    if (gameOver) return;
    if (turn !== "north") return;

    startCpuLoopNorth();

    return () => {
      stopCpuLoopNorth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turn, gameOver, cpuEnabled]);

  useEffect(() => {
    const el = bottomBarRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setBottomBarH(el.getBoundingClientRect().height);
    });

    ro.observe(el);
    setBottomBarH(el.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, []);

  function replaceSelectedUnit(newUnitId: string) {
    if (!selected) return;

    const def = unitsById[newUnitId];
    if (!def) return;

    setInstancesAndRef((prev) =>
      (prev as any[]).map((u) => {
        if (u.instanceId !== selected.instanceId) return u;

        const nextForm = "base";
        const baseMaxHp = getEffectiveMaxHp(def.base.hp, nextForm);
        const nextHp = baseMaxHp;

        const { stun, ...rest } = u as any;

        return {
          ...rest,
          unitId: newUnitId,
          form: nextForm,
          hp: nextHp,
        };
      })
    );

    setPerUnitTurn((m) => {
      const cur = m[selected.instanceId] ?? { moved: false, attacked: false, done: false };
      return {
        ...m,
        [selected.instanceId]: { ...cur, moved: false, attacked: false, done: false },
      };
    });

    setSkillMode(null);
  }

  const reset = () => {
    stopCpuLoopNorth();
    bumpGameId();
    resetGuards();
    startSetup();
  };

  const doKnock = (dr: number, dc: number) => {
    if (!debugTargetId) return;
    if (gameOver) return;
    const stateLike = { rows, cols, unitsById, instances, selectedInstanceId: selectedId };
    const res = tryKnockback(stateLike as any, debugTargetId, dr, dc, 1);
    if (res.ok) setInstancesAndRef(res.instances as any);
  };

  const dmgByInstanceId = useMemo(() => {
    const m = new Map<string, { id: string; amount: number }>();
    for (const fx of dmgFx) m.set(fx.instanceId, { id: fx.id, amount: fx.amount });
    return m;
  }, [dmgFx]);

  const canSelect = (inst: any) =>
    !gameOver && inst.side === turn && !(perUnitTurn[inst.instanceId]?.done ?? false);

  const canUndoMove = useMemo(() => {
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
  }, [gameOver, lastMove, turn, perUnitTurn, selectedId]);

  return (
    <>
      <UnitPopup
        open={popupOpen}
        unit={popupUnit}
        unitsById={unitsById}
        usedSkills={usedSkills}
        onClose={() => setPopupId(null)}
        getCardCandidates={(unitId: string, side: "south" | "north", form?: "base" | "g") =>
          cardCandidates(unitId, side, form ?? "base", skin)
        }
      />

      <TurnEndConfirm
        open={showEndTurnConfirm && !gameOver}
        disabled={!!skillMode}
        onCancel={() => setShowEndTurnConfirm(false)}
        onConfirm={() => {
          setShowEndTurnConfirm(false);
          endTurn();
        }}
        disabledTitle={skillMode ? "スキル選択中はターン終了できません（ESCで解除）" : ""}
      />

      <VictoryModal victory={victory} onRestart={resetGame} />

      {/* --- Skill Mode Banner --- */}
      {!gameOver && skillMode && selected ? (
        (() => {
          const def = SKILLS[skillMode];
          const label = def?.label ?? skillMode;

          return (
            <div
              style={{
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #6a5a00",
                background: "rgba(90,74,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.25 }}>
                <div style={{ fontWeight: 900 }}>スキル選択中：{label}</div>
                <div style={{ opacity: 0.9, marginTop: 2 }}>
                  盤面の<span style={{ fontWeight: 800 }}>黄色</span>マスをクリックして発動／
                  <span style={{ fontWeight: 800 }}>ESC</span>で解除
                </div>
              </div>

              <button
                onClick={() => setSkillMode(null)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #6a5a00",
                  background: "rgba(0,0,0,0.35)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                解除
              </button>
            </div>
          );
        })()
      ) : null}

      <h2>Gの部屋 TCG（体験版）</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>スキン:</div>

        <select
          value={skin}
          onChange={(e) => setSkin(e.target.value as Skin)}
          style={{
            padding: "6px 8px",
            background: "#111",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 8,
            fontWeight: 800,
          }}
        >
          <option value="default">default</option>
          <option value="dark">dark</option>
          <option value="travel">travel</option>
        </select>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          ※未作成の画像は default にフォールバック推奨
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "nowrap",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: 14 }}>
          手番: <b>{turn.toUpperCase()}</b>
          {selected && (
            <>
              {" "}
              / 行動: <b>{perUnitTurn[selected.instanceId]?.done ? "完了" : "未完了"}</b>{" "}
              （M:{perUnitTurn[selected.instanceId]?.moved ? "済" : "未"} / A:
              {perUnitTurn[selected.instanceId]?.attacked ? "済" : "未"}）
            </>
          )}
        </div>

        <button onClick={() => setCpuEnabled((v) => !v)} style={{ padding: "6px 10px" }}>
          CPU: {cpuEnabled ? "ON" : "OFF"}
        </button>

        <button onClick={reset} style={{ padding: "6px 10px", cursor: "pointer" }}>
          ゲームリセット
        </button>

        <div style={{ fontSize: 12, opacity: 0.85 }}>
          South: deck {deckSouth.length} / hand {handSouth.length}　
          North: deck {deckNorth.length} / hand {handNorth.length}
        </div>

        <button onClick={() => setShowDebug((v) => !v)} style={{ padding: "6px 10px" }}>
          {showDebug ? "デバッグ閉じる" : "デバッグ開く"}
        </button>

        <button
          disabled={!selected || !!gameOver}
          onClick={() => {
            if (!selected) return;
            setInstancesAndRef((prev) =>
              (prev as any[]).map((u) =>
                u.instanceId === selected.instanceId
                  ? { ...u, form: u.form === "g" ? "base" : "g" }
                  : u
              )
            );
          }}
          style={{ padding: "6px 10px" }}
        >
          （テスト）選択ユニット form切替 base⇄g
        </button>
      </div>

      {showDebug && (
        <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            テスト対象（Shift+敵クリック）: {debugTargetId ?? "なし"}
          </div>

          <button disabled={!debugTargetId || gameOver} onClick={() => doKnock(-1, 0)}>
            （テスト）↑ノックバック1
          </button>
          <button disabled={!debugTargetId || gameOver} onClick={() => doKnock(1, 0)}>
            （テスト）↓ノックバック1
          </button>
          <button disabled={!debugTargetId || gameOver} onClick={() => doKnock(0, -1)}>
            （テスト）←ノックバック1
          </button>
          <button disabled={!debugTargetId || gameOver} onClick={() => doKnock(0, 1)}>
            （テスト）→ノックバック1
          </button>
        </div>
      )}

      <div style={{ marginBottom: 8, fontSize: 14 }}>
        選択中:{" "}
        {selected ? `${selected.instanceId} / ${unitsById[selected.unitId].name}` : "なし"}
      </div>

      {selected && (
        <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.9 }}>
          DEBUG: side={selected.side} turn={turn} form={selected.form ?? "base"} / moved=
          {String(perUnitTurn[selected.instanceId]?.moved)} attacked=
          {String(perUnitTurn[selected.instanceId]?.attacked)} done=
          {String(perUnitTurn[selected.instanceId]?.done)}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>（テスト）選択ユニット入れ替え:</div>

        <select
          value={swapUnitId}
          onChange={(e) => setSwapUnitId(e.target.value)}
          disabled={!selected || !!gameOver}
          style={{
            padding: "6px 8px",
            background: "#111",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 8,
          }}
        >
          <option value="">-- unitId を選択 --</option>
          {unitOptions.map((id) => (
            <option key={id} value={id}>
              {id}（{unitsById[id]?.name ?? "?"}）
            </option>
          ))}
        </select>

        <button
          disabled={!selected || !!gameOver || !swapUnitId}
          onClick={() => {
            if (!swapUnitId) return;
            replaceSelectedUnit(swapUnitId);
          }}
          style={{ padding: "6px 10px", fontWeight: 800 }}
        >
          入れ替え実行
        </button>
      </div>

      <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.9 }}>
        緑＝移動 / 赤＝攻撃対象 / 黄＝射程 / ×＝遮蔽
      </div>

      {/* 盤面エリア */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          justifyContent: "center",
          maxWidth: "100%",
          paddingBottom: bottomBarH + 12,
        }}
      >
        {/* 左：山札（South） */}
        <div style={{ width: 180, flex: "0 0 auto" }}>
          {phase !== "setup_draw" && (
<div style={{ padding: 10, border: "1px solid #444", borderRadius: 12 }}>
  <div style={{ fontWeight: 900, marginBottom: 6 }}>山札（South）</div>

  <button
    disabled
    style={{
      width: "100%",
      // ★カード比率（ポケカ/遊戯王系の “だいたい” 63:88）
      aspectRatio: "63 / 88",
      borderRadius: 12,
      border: "1px solid #6a5a00",
      background: "rgba(0,0,0,0.35)",
      padding: 6,
      cursor: "default",
    }}
    title="初回は自動で5枚ドロー済み"
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ★全部見せる：contain */}
   <img
  src={getDeckBackPath(skin)}
  alt="deck back"
  style={{
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  }}
/>


      {/* 枚数バッジ（邪魔なら消してOK） */}
      <div
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          padding: "4px 8px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,215,0,0.6)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        {deckSouth.length}
      </div>
    </div>
  </button>
</div>
          )}
        </div>

        {/* 中央：盤面 */}
        <div style={{ flex: "0 0 auto" }}>
          <Board
            rows={rows}
            cols={cols}
            cellSize={cell}
            letters={letters}
            occ={occ}
            selectedId={selectedId}
            turn={turn}
            gameOver={gameOver}
            legalMoveSet={legalMoveSet}
            attackRangeSet={attackRangeSet}
            attackBlockerSet={attackBlockerSet}
            attackSet={attackSet}
            skillMode={skillMode}
            skillTargetSet={skillTargetSet}
            debugTargetId={debugTargetId}
            unitsById={unitsById}
            getPortrait={(unitId, side, form) => getPortraitPath(unitId, side, form ?? "base", skin)}
            getPortraitCandidates={(unitId, side, form) => portraitCandidates(unitId, side, form ?? "base", skin)}
            posKey={posKey}
            canSelect={canSelect}
            onShiftEnemyPick={(enemyId) => setDebugTargetId(enemyId)}
            onLongPressUnit={(inst) => {
              if (gameOver) return;
              setSelectedId(inst.instanceId);
              setSwapUnitId("");
              setPopupId(inst.instanceId);
              setSkillMode(null);
            }}
            onCellClick={(r, c, inst) => {
              if (gameOver) return;

              if (phase === "setup_deploy") {
                deploySouthAt(r, c);
                return;
              }

              if (cpuEnabled && turn === "north") return;

              if (phase === "battle" && turn === "south") {
                if (selectedHandKey && !battleDeployUsed && !inst) {
                  deploySouthReinforceAt(r, c);
                  return;
                }
              }

              setPopupId(null);

              const handled = tryExecuteSkillOnCell({ r, c, inst: inst ?? null });
              if (handled) return;

              if (inst) {
                if (inst.side !== turn) {
                  if (attackSet.has(inst.instanceId)) attack(inst.instanceId);
                  return;
                }
                if (canSelect(inst)) {
                  setSelectedId(inst.instanceId);
                  setSwapUnitId("");
                }
                return;
              }

              moveTo(r, c);
            }}
            dmgByInstanceId={dmgByInstanceId}
          />
        </div>

        {/* 右：手札（South） */}
        <div style={{ width: 260, flex: "0 0 auto" }}>
          {phase !== "setup_draw" && (
            <div style={{ padding: 10, border: "1px solid #444", borderRadius: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                手札（South） {handSouth.length}枚
              </div>

              {phase === "setup_deploy" ? (
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                  出撃：{deployPlaced}/3（最下段クリックで配置）
                </div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                  増援：{battleDeployUsed ? "済（このターンは終了）" : "未"}
                  （手札を選んで下段をクリック / 1ターン1回）
                </div>
              )}

<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    maxHeight: "calc(100vh - 220px)",
    overflowY: "auto",
    paddingRight: 6,
  }}
>
  {handSouth.map((uid, i) => {
    const k = `${uid}-${i}`;
    const isSel = selectedHandKey === k;
    const name = unitsById[uid]?.name ?? uid;

    const src = getHandCardSrc(uid, "south", skin);

    return (
      <button
        key={k}
        onClick={() => setSelectedHandKey(k)}
        style={{
          textAlign: "left",
          padding: 8,
          borderRadius: 12,
          border: isSel ? "2px solid gold" : "1px solid #444",
          background: "rgba(0,0,0,0.20)",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {/* カードサムネ */}
      <div
  style={{
    width: "100%",
    maxWidth: 180,          // ★追加：これでデカすぎが止まる
    margin: "0 auto",       // ★中央寄せ
    aspectRatio: "63 / 88",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    border: "1px solid rgba(255,215,0,0.35)",
    background: "rgba(0,0,0,0.25)",
  }}
>

          <img
            src={src}
            alt={name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain", // ★全部見せる（切らない）
              display: "block",
            }}
            onError={(e) => {
              // 最終保険：default skin の base portrait
              (e.currentTarget as HTMLImageElement).src = getPortraitPath(uid, "south", "base", "default");
            }}
          />

          {/* 名前ラベル（邪魔なら消してOK） */}
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              bottom: 8,
              padding: "5px 8px",
              borderRadius: 10,
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,215,0,0.35)",
              fontSize: 12,
              lineHeight: 1.2,
              textShadow: "0 1px 0 rgba(0,0,0,0.6)",
            }}
          >
            {name}
          </div>
        </div>

       
      </button>
    );
  })}
</div>


              {!selectedHandUnitId && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  まず手札から1枚選んでね
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Bottom Action Bar (mobile) --- */}
      <div
        ref={bottomBarRef as any}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9000,
          padding: "10px 12px",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          background: "rgba(17,17,17,0.96)",
          borderTop: "1px solid #444",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "min(720px, 100%)", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* --- skill row --- */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {selected
              ? selectedSkills.map((s: (typeof selectedSkills)[number]) => {
                  const k = skillUseKey(turn, selected.instanceId, s.id);
                  const used = !!usedSkills[k];

                  const formOk = !s.requiresForm || selected.form === s.requiresForm;
                  const me = perUnitTurn[selected.instanceId];

                  const btnTitle = !formOk ? "進化(G)が必要" : used ? "この試合で使用済み" : "";

                  const canUse =
                    !gameOver &&
                    selected.side === turn &&
                    !(me?.done ?? false) &&
                    formOk &&
                    (!s.oncePerMatch || !used);

                  return (
                    <button
                      key={s.id}
                      disabled={!canUse}
                      title={btnTitle}
                      onClick={() => {
                        if (gameOver) return;
                        if (!selected) return;

                        if (s.targetMode === "instant") {
                          const stateLike = { rows, cols, instances };
                          const next = s.execute({
                            stateLike,
                            casterId: selected.instanceId,
                            aoeRadius: s.aoeRadius,
                            damage: s.damage,
                            knockback: s.knockback,
                            stunTurns: s.stunTurns,
                          } as any);

                          applyNextInstances(next as any);

                          setPerUnitTurn((m) => ({
                            ...m,
                            [selected.instanceId]: {
                              ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
                              attacked: true,
                              done: true,
                            },
                          }));

                          if (s.oncePerMatch) {
                            const k2 = skillUseKey(turn, selected.instanceId, s.id);
                            setUsedSkills((m) => ({ ...m, [k2]: true }));
                          }

                          setSkillMode(null);
                          return;
                        }

                        setSkillMode(s.id);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #444",
                        background: canUse ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)",
                        color: "#fff",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                      {s.oncePerMatch ? "（1回）" : ""}
                    </button>
                  );
                })
              : null}
          </div>

          {/* --- action row --- */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={!selected || !!gameOver || selected.side !== turn || (perUnitTurn[selected.instanceId]?.done ?? false)}
              onClick={() => {
                if (gameOver) return;
                if (!selected) return;

                setPerUnitTurn((m) => {
                  const cur = m[selected.instanceId] ?? { moved: false, attacked: false, done: false };
                  return {
                    ...m,
                    [selected.instanceId]: { ...cur, moved: false, attacked: false, done: false },
                  };
                });

                setSelectedId(null);
              }}
              style={{
                flex: 1,
                padding: "10px 10px",
                fontWeight: 900,
                opacity:
                  !selected || gameOver || selected.side !== turn || (perUnitTurn[selected.instanceId]?.done ?? false)
                    ? 0.6
                    : 1,
              }}
            >
              待機
            </button>

            <button
              onClick={undoMove}
              disabled={!canUndoMove}
              style={{
                flex: 1,
                padding: "10px 10px",
                fontWeight: 900,
                cursor: canUndoMove ? "pointer" : "not-allowed",
                opacity: canUndoMove ? 1 : 0.6,
              }}
              title={!canUndoMove ? "移動後/攻撃前のみ取り消し可能" : ""}
            >
              移動取消
            </button>

            <button
              onClick={endTurn}
              disabled={gameOver || !!skillMode}
              style={{
                flex: 1,
                padding: "10px 10px",
                fontWeight: 900,
                cursor: gameOver || !!skillMode ? "not-allowed" : "pointer",
                opacity: gameOver || !!skillMode ? 0.6 : 1,
              }}
              title={skillMode ? "スキル選択中はターン終了できません（ESCで解除）" : ""}
            >
              ターン終了
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
            操作: 自分の駒をクリック → 緑で移動 / 赤い敵をクリックで攻撃（1ターン攻撃1回）→ ターン終了
          </div>
        </div>
      </div>
    </>
  );
}
