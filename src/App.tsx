import "./App.css";
import unitsData from "./data/units.v1.2.json";
import { createDemoState } from "./game/state";
import { buildMoveInstances, getLegalMoves } from "./game/move";
import { otherSide } from "./game/turn";
import type { Side } from "./game/types";
import { getAttackableTargets, getAttackMarks } from "./game/attack";

import { type SkillId } from "./game/skills/registry";
import { getSkillImpactVariant, type SkillImpactVariant } from "./game/skills/impactVariant";

import checkVictory from "./game/victory";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSkillTargeting } from "./game/hooks/useSkillTargeting";
import { useSkillExecution } from "./game/hooks/useSkillExecution";
import { usePlayerActions } from "./game/hooks/usePlayerActions";
import { useCpuTurn } from "./game/hooks/useCpuTurn";
import { useHandDeck } from "./game/hooks/useHandDeck";
import { useDeployActions } from "./game/hooks/useDeployActions";
import { useGameFlow } from "./game/hooks/useGameFlow";
import { buildDamageFxEvents, type DamageFxEvent } from "./game/damageFx";
import { applyYabukoTransform } from "./game/transform";
import {
  buildEndTurnInstances,
  buildTurnStartPerUnitTurn,
} from "./game/turnFlow";
import { canSelectUnit } from "./game/playerActionGuards";
import {
  getBoardSizeConfig,
  getInitialDeployCandidateCols,
  getLetters,
  type BoardSizeMode,
} from "./game/boardConfig";
import { buildInitialHandsAndDecks } from "./game/handDeck";

import { BottomBar } from "./components/BottomBar";
import { GameBoardArea } from "./components/GameBoardArea";
import { UnitPopup } from "./components/Popup/UnitPopup";
import { SelectedUnitStatus } from "./components/SelectedUnitStatus";
import { SkillModeBanner } from "./components/SkillModeBanner";
import { TopStatusBar } from "./components/TopStatusBar";
import { AstoriaMapScene } from "./components/AstoriaMapScene";
import { TownScene } from "./components/TownScene";
import { TurnEndConfirm } from "./components/UI/TurnEndConfirm";
import { VictoryModal } from "./components/UI/VictoryModal";

import {
  buildInitialNorthDeployCols,
  buildInitialNorthInstances,
  buildSouthInitialDeploySet,
  buildSouthReinforceSet,
} from "./game/deploy";

import {
  getPortrait as getPortraitPath,
  cardCandidates,
  portraitThumbCandidates,
  type Skin,
} from "./assets/imagePaths";
import { isSkinUnlocked, readUnlockedSkins } from "./assets/skinUnlocks";

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function getHandThumbSrc(unitId: string, side: Side, skin: Skin) {
  return `/cards/hand/${skin}/${side}/${unitId}.webp`;
}

function getHandFallbackSrc(unitId: string, side: Side, skin: Skin) {
  const cands = cardCandidates(unitId, side, "base", skin);
  if (cands && cands.length > 0) return cands[0];
  return getPortraitPath(unitId, side, "base", skin);
}

// Prefer the lightweight hand thumbnail; image onError falls back to the full card.
function getHandCardSrc(unitId: string, side: Side, skin: Skin) {
  return getHandThumbSrc(unitId, side, skin);
}

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;
type Phase = "setup_draw" | "setup_deploy" | "battle";
type SkillMotionEvent = { id: string; instanceId: string };
type AttackMotionEvent = { id: string; instanceId: string; dr: number; dc: number };
type MoveMotionEvent = { id: string; instanceId: string };
type ImpactFxEvent = { id: string; targetId: string; r: number; c: number };
type Scene = "astoria" | "town" | "tcg";
type BoardPreviewMode = "move" | "attack";
type SkillImpactFxEvent = {
  id: string;
  skillId: SkillId;
  variant: SkillImpactVariant;
  casterId: string;
  targetId: string;
  r: number;
  c: number;
};

export default function App() {
  // ===== stable base =====
  const [boardSizeMode, setBoardSizeMode] = useState<BoardSizeMode>("starter7");
  const boardSizeConfig = useMemo(() => getBoardSizeConfig(boardSizeMode), [boardSizeMode]);
  const initial = useMemo(
    () => createDemoState(unitsData as any, { rows: boardSizeConfig.rows, cols: boardSizeConfig.cols }),
    [boardSizeConfig.rows, boardSizeConfig.cols]
  );
  const rows = initial.rows;
  const cols = initial.cols;
  const unitsById = initial.unitsById;
  const initialDeployCount = boardSizeConfig.initialDeployCount;
  const initialHandSize = boardSizeConfig.initialHandSize;
  const initialDeployCandidateCols = useMemo(() => getInitialDeployCandidateCols(cols), [cols]);

  // ===== turn state =====
  const [turnState, setTurnState] = useState<{ side: Side; seq: number }>({
    side: "south",
    seq: 0,
  });
  const turn = turnState.side;
  const turnSeq = turnState.seq;

  // ===== state =====
  const [phase, setPhase] = useState<Phase>("setup_draw");
  const [cpuEnabled, setCpuEnabled] = useState(true);

  const [deployPlaced, setDeployPlaced] = useState(0);
  const [battleDeployUsed, setBattleDeployUsed] = useState(false);

  const [instances, setInstances] = useState(initial.instances);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boardPreviewMode, setBoardPreviewMode] = useState<BoardPreviewMode>("move");

  

  const [skillMode, setSkillMode] = useState<SkillId | null>(null);
  const [usedSkills, setUsedSkills] = useState<Record<string, boolean>>({});
  const [perUnitTurn, setPerUnitTurn] = useState<PerUnitTurn>({});
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false);

  const [victory, setVictory] = useState<null | { winner: Side; detail: string }>(null);
  const gameOver = victory !== null;

  const [southSkin, setSouthSkin] = useState<Skin>("default");
  const [northSkin, setNorthSkin] = useState<Skin>("default");
  const [unlockedSkins, setUnlockedSkins] = useState<Skin[]>(() => readUnlockedSkins());
  const [scene, setScene] = useState<Scene>("astoria");

  const [popupId, setPopupId] = useState<string | null>(null);
  const popupOpen = popupId !== null;
  const popupUnit = instances.find((x: any) => x.instanceId === popupId) ?? null;

  const [dmgFx, setDmgFx] = useState<DamageFxEvent[]>([]);
  const [skillMotionEvents, setSkillMotionEvents] = useState<SkillMotionEvent[]>([]);
  const [attackMotionEvents, setAttackMotionEvents] = useState<AttackMotionEvent[]>([]);
  const [moveMotionEvents, setMoveMotionEvents] = useState<MoveMotionEvent[]>([]);
  const [impactFxEvents, setImpactFxEvents] = useState<ImpactFxEvent[]>([]);
  const [skillImpactFxEvents, setSkillImpactFxEvents] = useState<SkillImpactFxEvent[]>([]);

  const [lastMove, setLastMove] = useState<null | {
    turn: Side;
    instanceId: string;
    prevInstances: any[];
    prevPerUnitTurn: PerUnitTurn;
  }>(null);

  const [bottomBarH, setBottomBarH] = useState(0);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);

  // ===== refs =====

  const didInitRef = useRef(false);
  const prevBoardSizeModeRef = useRef(boardSizeMode);

  const gameIdRef = useRef(`${Date.now()}-${Math.random().toString(16).slice(2)}`);

  // Draw guard.
  const lastDrawKeyRef = useRef<string>("");

  // Turn start guard.
  const lastTurnStartKeyRef = useRef<string>("");

  // Prevent duplicate endTurn runs for the same turn key.
  const lastEndTurnKeyRef = useRef<string>("");

  // Blocks repeated endTurn calls inside the same tick.
  const endTurnTickLockRef = useRef(false);

  // Tracks phase transitions into battle.
  const prevPhaseRef = useRef<Phase>("setup_draw");


  const turnRef = useRef<Side>(turn);
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const {
    deckSouth,
    setDeckSouth,
    handSouth,
    setHandSouth,
    deckNorth,
    setDeckNorth,
    handNorth,
    setHandNorth,
    selectedHandKey,
    setSelectedHandKey,
    handNorthRef,
    selectedHandPick,
    selectedHandUnitId,
    drawAtStartOfTurn,
  } = useHandDeck({ lastDrawKeyRef, turnRef, phaseRef });

  const instancesRef = useRef(instances);
  useEffect(() => {
    instancesRef.current = instances;
  }, [instances]);

  const victoryRef = useRef(victory);
  useEffect(() => {
    victoryRef.current = victory;
  }, [victory]);

  const { tryNorthReinforce, trySouthDeploy, trySouthReinforce } = useDeployActions({
    setInstancesAndRef: (nextOrFn) => setInstancesAndRef(nextOrFn as any),
    setHandSouth,
    setHandNorth,
    setSelectedHandKey,
    setDeployPlaced,
    setPhase,
    setTurnState,
    setBattleDeployUsed,
    setPerUnitTurn,
    initialDeployCount,
  });

  // ===== helpers =====
  function logSkill(ev: "TRY" | "FIRE", payload: any) {
    console.log(`[SKILL ${ev}]`, payload);
  }

  function spawnUnit(opts: {
    unitId: string;
    side: "south" | "north";
    r: number;
    c: number;
    instanceId: string;
    form?: "base" | "g";
    hp?: number;
  }) {
    const def = unitsById[opts.unitId];
    if (!def) return null;

    const passive: any = {};
    if (opts.unitId === "HIBIKI") passive.dmgReduction = 1;

    const form = opts.form ?? "base";
    const hp = opts.hp ?? def.base.hp;

    return {
      instanceId: opts.instanceId,
      unitId: opts.unitId,
      side: opts.side,
      pos: { r: opts.r, c: opts.c },
      form,
      hp,
      ...passive,
    };
  }

  function resetGuards() {
    lastDrawKeyRef.current = "";
    lastTurnStartKeyRef.current = "";
    lastEndTurnKeyRef.current = "";
    prevPhaseRef.current = "setup_draw";

    endTurnTickLockRef.current = false;
  }

  function bumpGameId() {
    gameIdRef.current = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function prepareSetupRun() {
    stopCpuLoopNorth();
    bumpGameId();
    resetGuards();
  }

  function setInstancesAndRef(
    nextOrFn: typeof instances | ((prev: typeof instances) => typeof instances)
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

  function finishInitialNorthDeploy(northUnits: typeof instances, nextHandNorth: string[]) {
    instancesRef.current = northUnits;
    setInstances(northUnits);

    setHandNorth(nextHandNorth);
  }

  function resetSetupState() {
    setVictory(null);
    setSkillMode(null);
    setUsedSkills({});
    setPerUnitTurn({});
    setSkillMotionEvents([]);
    setAttackMotionEvents([]);
    setMoveMotionEvents([]);
    setImpactFxEvents([]);
    setSkillImpactFxEvents([]);
    setShowEndTurnConfirm(false);
    setBattleDeployUsed(false);
    setDeployPlaced(0);

    setPhase("setup_deploy");
    setTurnState({ side: "south", seq: 0 });

    setSelectedId(null);
    setSelectedHandKey(null);
    setBoardPreviewMode("move");
  }

  function applyInitialHandsAndDecks({
    deckSouth,
    handSouth,
    deckNorth,
    handNorth,
  }: {
    deckSouth: string[];
    handSouth: string[];
    deckNorth: string[];
    handNorth: string[];
  }) {
    setDeckSouth(deckSouth);
    setHandSouth(handSouth);

    setDeckNorth(deckNorth);
    setHandNorth(handNorth);
  }

  function clearTurnStartUiState() {
    setSelectedId(null);
    setSkillMode(null);
    setShowEndTurnConfirm(false);
    setSelectedHandKey(null);
    setBoardPreviewMode("move");
  }

  function resetTurnStartRuleState() {
    compilerSafeResetPerUnitTurn();

    if (turn === "south") setBattleDeployUsed(false);
  }

  function executeSuccessfulEndTurn() {
    const nextSide: Side = otherSide(turn);

    setInstancesAndRef((prev) => {
      const afterStart = buildEndTurnInstances({
        instances: prev as any,
        currentSide: turn,
        nextSide,
        applyInstancesTransform: (list) => applyYabukoTransform(list as any, unitsById) as any,
      });

      const v = checkVictory(rows, cols, afterStart as any);
      if (v) setVictory(v);

      return afterStart as any;
    });

    finishEndTurn();
  }

  function emitDamageFx(events: DamageFxEvent[]) {
    if (!events.length) return;

    setDmgFx((prev) => [...prev, ...events]);
    window.setTimeout(() => {
      setDmgFx((prev) => prev.filter((x) => !events.some((event) => event.id === x.id)));
    }, 700);
  }

  function emitSkillMotion(casterId: string) {
    const id = `skill-${casterId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setSkillMotionEvents((prev) => [...prev, { id, instanceId: casterId }]);
    window.setTimeout(() => {
      setSkillMotionEvents((prev) => prev.filter((event) => event.id !== id));
    }, 350);
  }

  function emitSkillImpact({
    skillId,
    casterId,
    impacts,
  }: {
    skillId: SkillId;
    casterId: string;
    impacts: Array<{ targetId: string; r: number; c: number }>;
  }) {
    if (!impacts.length) return;
    const variant = getSkillImpactVariant(skillId);

    const born = impacts.map((impact) => ({
      id: `skill-impact-${skillId}-${impact.targetId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      skillId,
      variant,
      casterId,
      targetId: impact.targetId,
      r: impact.r,
      c: impact.c,
    }));

    setSkillImpactFxEvents((prev) => [...prev, ...born]);
    window.setTimeout(() => {
      setSkillImpactFxEvents((prev) => prev.filter((event) => !born.some((impact) => impact.id === event.id)));
    }, 300);
  }

  function emitAttackMotion({ attackerId, dr, dc }: { attackerId: string; dr: number; dc: number }) {
    const id = `attack-${attackerId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setAttackMotionEvents((prev) => [...prev, { id, instanceId: attackerId, dr, dc }]);
    window.setTimeout(() => {
      setAttackMotionEvents((prev) => prev.filter((event) => event.id !== id));
    }, 300);
  }

  function emitImpactFx({ targetId, r, c }: { targetId: string; r: number; c: number }) {
    const id = `impact-${targetId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setImpactFxEvents((prev) => [...prev, { id, targetId, r, c }]);
    window.setTimeout(() => {
      setImpactFxEvents((prev) => prev.filter((event) => event.id !== id));
    }, 300);
  }

  function emitMoveMotion({ instanceId }: { instanceId: string }) {
    const id = `move-${instanceId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setMoveMotionEvents((prev) => [...prev, { id, instanceId }]);
    window.setTimeout(() => {
      setMoveMotionEvents((prev) => prev.filter((event) => event.id !== id));
    }, 320);
  }

  function commitInstancesAndVictory(nextInstances: typeof instances) {
    instancesRef.current = nextInstances;
    setInstances(nextInstances);

    const v = checkVictory(rows, cols, nextInstances as any);
    if (v) setVictory(v);
  }

  function getDeckBackPath(skin: Skin) {
    if (skin === "dark") return "/cards/back_dark.png";
    if (skin === "travel") return "/cards/back_travel.png";
    if (skin === "comic") return "/cards/back_comic.png";
    return "/cards/back_default.png";
  }

  // ===== setup =====
  const setupCountRef = useRef(0);

  const startSetup = () => {
    setupCountRef.current += 1;

    console.log(
      "[SETUP CALL]",
      "count=",
      setupCountRef.current,
      "gameId(before)=",
      gameIdRef.current,
      "phase=",
      phaseRef.current,
      "turn=",
      turnRef.current,
      "seq=",
      turnSeq
    );
    console.trace("[SETUP TRACE]");

    prepareSetupRun();

    resetSetupState();

    const { allUnitIds, deckSouth, handSouth: initialHandSouth, deckNorth, handNorth: initialHandNorth } =
      buildInitialHandsAndDecks(unitsById, initialHandSize);

    console.log("[SETUP] ALL", allUnitIds);
    console.log("[SETUP] ALL uniq", new Set(allUnitIds).size, "/", allUnitIds.length);

    console.log("[SETUP] south hand", initialHandSouth);
    console.log("[SETUP] south hand uniq", new Set(initialHandSouth).size, "/", initialHandSouth.length);

    applyInitialHandsAndDecks({
      deckSouth,
      handSouth: initialHandSouth,
      deckNorth,
      handNorth: initialHandNorth,
    });

    // north initial deploy top row
    const pickedCols = buildInitialNorthDeployCols(cols, initialDeployCount);
    const northUnits = buildInitialNorthInstances({
      handNorth: initialHandNorth,
      pickedCols,
      count: initialDeployCount,
      spawnUnit,
    });

    finishInitialNorthDeploy(northUnits as any, initialHandNorth.slice(initialDeployCount));
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

  useEffect(() => {
    if (prevBoardSizeModeRef.current === boardSizeMode) return;
    prevBoardSizeModeRef.current = boardSizeMode;
    if (!didInitRef.current) return;
    startSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardSizeMode]);

  // ===== reinforcement (north: one unit at turn start) =====
  useEffect(() => {
    tryNorthReinforce({
      phase: phaseRef.current,
      turn: turnRef.current,
      turnSeq,
      handNorth: handNorthRef.current,
      unitsById,
      instances: instancesRef.current,
      cols,
      spawnUnit,
    });
  }, [turnSeq, cols]);

  const deploySouthAt = (r: number, c: number) => {
    trySouthDeploy({
      phase,
      selectedHandPick,
      handSouth,
      unitsById,
      instances: instances as any,
      r,
      c,
      rows,
      initialDeployCandidateCols,
      spawnUnit,
    });
  };

const deploySouthReinforceAt = (r: number, c: number) => {
  trySouthReinforce({
    phase,
    turn,
    battleDeployUsed,
    selectedHandPick,
    handSouth,
    unitsById,
    instances: instances as any,
    r,
    c,
    rows,
    spawnUnit,
  });
};



  function resetGame() {
    startSetup();
  }

  useEffect(() => {
    setLastMove(null);
  }, [turn]);

  const { beginEndTurnOnce, prepareEndTurnRun, finishEndTurn } = useGameFlow({
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
    stopCpuLoopNorth: () => stopCpuLoopNorth(),
    setShowEndTurnConfirm,
    setSelectedId,
    setTurnState,
  });

  function compilerSafeResetPerUnitTurn() {
    setPerUnitTurn(() => {
      return buildTurnStartPerUnitTurn({
        instances: instancesRef.current as any,
        turn: turnRef.current,
      });
    });
  }

  function applyNextInstances(next: typeof instances) {
    const born = buildDamageFxEvents({
      prevInstances: instancesRef.current as any,
      nextInstances: next as any,
      createId: (instanceId) => `${Date.now()}-${instanceId}-${Math.random().toString(16).slice(2)}`,
    });

    emitDamageFx(born);

    // Apply transform checks after damage fx is derived from the pre-transform board.
    const next2 = applyYabukoTransform(next as any, unitsById);

    commitInstancesAndVictory(next2 as any);
  }

  function useWindowWidth() {
    const [w, setW] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
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
    const isMobile = winW <= 720;
    const min = isMobile ? 52 : 44;
    const baseSize = Math.floor((winW - pad) / cols);
    const size = isMobile ? Math.floor(baseSize * 1.1) : baseSize;
    return Math.max(min, Math.min(max, size));
  }, [winW, cols]);

  const letters = useMemo(() => getLetters(cols), [cols]);

  const selected = instances.find((x: any) => x.instanceId === selectedId) ?? null;

  const { selectedSkills, skillTargetSet } = useSkillTargeting({
    skillMode,
    selected,
    gameOver,
    rows,
    cols,
    instances,
    unitsById,
  });

  const occ = useMemo(() => {
    const m = new Map<string, any>();
    for (const inst of instances as any[]) m.set(posKey(inst.pos.r, inst.pos.c), inst);
    return m;
  }, [instances]);

  const legalMoves = useMemo(() => {
    if (!selected) return [];
    if (gameOver) return [];
    if (selected.side !== turn) return [];
    if (boardPreviewMode !== "move") return [];

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
  }, [selected, gameOver, turn, boardPreviewMode, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

  const legalMoveSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of legalMoves as any[]) s.add(posKey(p.r, p.c));
    return s;
  }, [legalMoves]);

const reinforceSet = useMemo(() => {
  const s = buildSouthReinforceSet({
    gameOver,
    phase,
    turn,
    selectedHandKey,
    battleDeployUsed,
    rows,
    cols,
    isOccupied: (r, c) => occ.has(posKey(r, c)),
  });
  return s;
}, [gameOver, phase, turn, selectedHandKey, battleDeployUsed, rows, cols, occ]);

  const initialDeploySet = useMemo(() => {
    return buildSouthInitialDeploySet({
      gameOver,
      phase,
      selectedHandPick,
      rows,
      cols,
      candidateCols: initialDeployCandidateCols,
      isOccupied: (r, c) => occ.has(posKey(r, c)),
    });
  }, [gameOver, phase, selectedHandPick, rows, cols, initialDeployCandidateCols, occ]);



  const attackMarks = useMemo(() => {
    if (!selected) return [];
    if (gameOver) return [];
    if (selected.side !== turn) return [];

    const me = perUnitTurn[selected.instanceId];
    if (me?.done) return [];
    if (!me?.moved && boardPreviewMode !== "attack") return [];
    if (me?.attacked) return [];

    const stateLike = {
      rows,
      cols,
      unitsById,
      instances,
      selectedInstanceId: selectedId,
    };
    return getAttackMarks(stateLike as any, selected as any);
  }, [selected, gameOver, turn, boardPreviewMode, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

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

  const visibleAttackSet = useMemo(() => {
    if (attackMarks.length === 0) return new Set<string>();
    return attackSet;
  }, [attackMarks, attackSet]);

  const { tryMove, tryNormalAttack, undoMove, canUndoMove } = usePlayerActions({
    applyNextInstances: (next) => applyNextInstances(next as any),
    buildMoveInstances,
    onMoveFinished: emitMoveMotion,
    onNormalAttackFired: emitAttackMotion,
    onNormalAttackImpact: emitImpactFx,
    lastMove,
    gameOver,
    turn,
    perUnitTurn,
    selectedId,
    setPerUnitTurn,
    setSelectedId,
    setLastMove,
    setSkillMode,
  });

  function doAttack(targetId: string) {
    const attacked = tryNormalAttack({
      selected,
      gameOver,
      turn,
      attackSet,
      targetId,
      rows,
      cols,
      unitsById,
      instances: instances as any,
      selectedId,
    });
    if (attacked) setBoardPreviewMode("move");
  }

  const moveTo = (r: number, c: number) => {
    const moved = tryMove({
      selected,
      gameOver,
      turn,
      perUnitTurn,
      legalMoveSet,
      r,
      c,
      rows,
      instances: instances as any,
      unitsById,
    });
    if (moved) setBoardPreviewMode("attack");
  };

  const {
    tryExecuteSkillOnCell: tryExecuteCellSkill,
    tryExecuteImmediateSkill,
  } = useSkillExecution({
    turn,
    unitsById,
    applyNextInstances: (next) => applyNextInstances(next as any),
    logSkill,
    onSkillFired: ({ casterId }) => emitSkillMotion(casterId),
    onSkillImpact: emitSkillImpact,
    setPerUnitTurn,
    setUsedSkills,
    setSkillMode,
    setSelectedId,
  });

  function tryExecuteSkillOnCell(opts: { r: number; c: number; inst: any | null }) {
    if (!skillMode) return false;

    const executed = tryExecuteCellSkill({
      skillMode,
      selected,
      gameOver,
      perUnitTurn,
      usedSkills,
      skillTargetSet,
      rows,
      cols,
      instances,
      target: opts,
    });

    if (!executed) {
      setSkillMode(null);
      return true;
    }

    return true;
  }

  function handleSkillButtonClick(skill: (typeof selectedSkills)[number]) {
    if (gameOver) return;
    if (!selected) return;

    if (skill.targetMode === "instant" || skill.targetMode === "enemiesInRange") {
      const executed = tryExecuteImmediateSkill({ def: skill, selected, usedSkills, rows, cols, instances });
      if (!executed) {
        setSkillMode(null);
      }
      return;
    }

    setSkillMode(skill.id);
  }

  function waitSelectedUnit() {
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
    setBoardPreviewMode("move");
  }

  function handleBoardLongPressUnit(inst: any) {
    if (gameOver) return;

    setSelectedId(inst.instanceId);
    setBoardPreviewMode("move");
    setPopupId(inst.instanceId);
    setSkillMode(null);
  }

  function handleBoardCellClick(r: number, c: number, inst: any | null) {
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
        if (attackSet.has(inst.instanceId)) doAttack(inst.instanceId);
        return;
      }
      if (canSelect(inst)) {
        if (selectedId === inst.instanceId) {
          const me = perUnitTurn[inst.instanceId];
          setBoardPreviewMode((mode) => (me?.moved ? "attack" : mode === "move" ? "attack" : "move"));
        } else {
          setSelectedId(inst.instanceId);
          setBoardPreviewMode("move");
        }
      }
      return;
    }

    moveTo(r, c);
  }

  const endTurn = () => {
    if (!beginEndTurnOnce()) return;

    prepareEndTurnRun();
    if (gameOver) return;

    executeSuccessfulEndTurn();
  };

  const { stopCpuLoopNorth } = useCpuTurn({
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
    applyNextInstances: (next) => applyNextInstances(next as any),
    endTurn,
  });

  useEffect(() => {
    if (scene !== "tcg") return;

    const el = bottomBarRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setBottomBarH(el.getBoundingClientRect().height);
    });

    ro.observe(el);
    setBottomBarH(el.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, [scene]);

  const dmgByInstanceId = useMemo(() => {
    const m = new Map<string, { id: string; amount: number }>();
    for (const fx of dmgFx) m.set(fx.instanceId, { id: fx.id, amount: fx.amount });
    return m;
  }, [dmgFx]);

  const skillEventIdByInstanceId = useMemo(() => {
    const m = new Map<string, string>();
    for (const event of skillMotionEvents) m.set(event.instanceId, event.id);
    return m;
  }, [skillMotionEvents]);

  const attackMotionByInstanceId = useMemo(() => {
    const m = new Map<string, { id: string; dr: number; dc: number }>();
    for (const event of attackMotionEvents) {
      m.set(event.instanceId, { id: event.id, dr: event.dr, dc: event.dc });
    }
    return m;
  }, [attackMotionEvents]);

  const moveEventIdByInstanceId = useMemo(() => {
    const m = new Map<string, string>();
    for (const event of moveMotionEvents) m.set(event.instanceId, event.id);
    return m;
  }, [moveMotionEvents]);

  const impactFxByCellKey = useMemo(() => {
    const m = new Map<string, { id: string; targetId: string }>();
    for (const event of impactFxEvents) {
      m.set(posKey(event.r, event.c), { id: event.id, targetId: event.targetId });
    }
    return m;
  }, [impactFxEvents]);

  const skillImpactFxByCellKey = useMemo(() => {
    const m = new Map<
      string,
      { id: string; skillId: SkillId; variant: SkillImpactVariant; casterId: string; targetId: string }
    >();
    for (const event of skillImpactFxEvents) {
      m.set(posKey(event.r, event.c), {
        id: event.id,
        skillId: event.skillId,
        variant: event.variant,
        casterId: event.casterId,
        targetId: event.targetId,
      });
    }
    return m;
  }, [skillImpactFxEvents]);

  function getSkinForSide(side: Side) {
    return side === "south" ? southSkin : northSkin;
  }

  function handleSouthSkinChange(nextSkin: Skin) {
    if (!isSkinUnlocked(nextSkin, unlockedSkins)) {
      setSouthSkin("default");
      return;
    }
    setSouthSkin(nextSkin);
  }

  function handleNorthSkinChange(nextSkin: Skin) {
    if (!isSkinUnlocked(nextSkin, unlockedSkins)) {
      setNorthSkin("default");
      return;
    }
    setNorthSkin(nextSkin);
  }

  function refreshUnlockedSkins() {
    setUnlockedSkins(readUnlockedSkins());
  }

  useEffect(() => {
    if (!isSkinUnlocked(southSkin, unlockedSkins)) setSouthSkin("default");
    if (!isSkinUnlocked(northSkin, unlockedSkins)) setNorthSkin("default");
  }, [northSkin, southSkin, unlockedSkins]);

  function toggleCpuEnabled() {
    setCpuEnabled((v) => !v);
  }

  const canSelect = (inst: any) => canSelectUnit({ inst, gameOver, turn, perUnitTurn });

  if (scene === "astoria") {
    return <AstoriaMapScene onEnterLobby={() => setScene("town")} />;
  }

  if (scene === "town") {
    return (
      <TownScene
        onExitToMap={() => setScene("astoria")}
        onEnterTcg={() => setScene("tcg")}
        onSkinUnlocked={refreshUnlockedSkins}
        unitsById={unitsById}
      />
    );
  }

  return (
    <div className="tcgScene">
      <UnitPopup
        open={popupOpen}
        unit={popupUnit}
        unitsById={unitsById}
        usedSkills={usedSkills}
        onClose={() => setPopupId(null)}
        getCardCandidates={(unitId: string, side: "south" | "north", form?: "base" | "g") =>
          cardCandidates(unitId, side, form ?? "base", getSkinForSide(side))
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
        disabledTitle={skillMode ? "スキル選択中はターン終了できません。ESCで解除" : ""}
      />

      <VictoryModal victory={victory} onRestart={resetGame} />

      <SkillModeBanner
        skillMode={skillMode}
        selected={selected}
        gameOver={gameOver}
        onCancel={() => setSkillMode(null)}
      />

      <TopStatusBar
        southSkin={southSkin}
        northSkin={northSkin}
        isSkinUnlocked={(skin) => isSkinUnlocked(skin, unlockedSkins)}
        onSouthSkinChange={handleSouthSkinChange}
        onNorthSkinChange={handleNorthSkinChange}
        boardSizeMode={boardSizeMode}
        onBoardSizeModeChange={setBoardSizeMode}
        turn={turn}
        cpuEnabled={cpuEnabled}
        onToggleCpu={toggleCpuEnabled}
        onResetGame={resetGame}
        deckSouthCount={deckSouth.length}
        handSouthCount={handSouth.length}
        deckNorthCount={deckNorth.length}
        handNorthCount={handNorth.length}
      />

      <SelectedUnitStatus selected={selected} unitsById={unitsById} perUnitTurn={perUnitTurn} />

      <button
        onClick={() => setScene("town")}
        style={{
          position: "fixed",
          right: 12,
          top: 12,
          zIndex: 9100,
          padding: "7px 10px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(0,0,0,0.56)",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        街へ戻る
      </button>

      <GameBoardArea
        phase={phase}
        bottomBarH={bottomBarH}
        deckSouth={deckSouth}
        handSouth={handSouth}
        selectedHandKey={selectedHandKey}
        setSelectedHandKey={setSelectedHandKey}
        selectedHandUnitId={selectedHandUnitId}
        deployPlaced={deployPlaced}
        initialDeployCount={initialDeployCount}
        battleDeployUsed={battleDeployUsed}
        unitsById={unitsById}
        southSkin={southSkin}
        getDeckBackPath={getDeckBackPath}
        getHandCardSrc={getHandCardSrc}
        getHandFallbackSrc={getHandFallbackSrc}
        rows={rows}
        cols={cols}
        cellSize={cell}
        letters={letters}
        occ={occ}
        selectedId={selectedId}
        turn={turn}
        gameOver={gameOver}
        legalMoveSet={legalMoveSet}
        initialDeploySet={initialDeploySet}
        reinforceSet={reinforceSet}
        attackRangeSet={attackRangeSet}
        attackBlockerSet={attackBlockerSet}
        attackSet={visibleAttackSet}
        skillMode={skillMode}
        skillTargetSet={skillTargetSet}
        debugTargetId={null}
        onShiftEnemyPick={() => {}}
        getPortrait={(unitId, side, form) => getPortraitPath(unitId, side, form ?? "base", getSkinForSide(side))}
        getPortraitCandidates={(unitId, side, form) =>
          portraitThumbCandidates(unitId, side, form ?? "base", getSkinForSide(side))
        }
        posKey={posKey}
        canSelect={canSelect}
        onLongPressUnit={handleBoardLongPressUnit}
        onCellClick={handleBoardCellClick}
        dmgByInstanceId={dmgByInstanceId}
        skillEventIdByInstanceId={skillEventIdByInstanceId}
        attackMotionByInstanceId={attackMotionByInstanceId}
        moveEventIdByInstanceId={moveEventIdByInstanceId}
        impactFxByCellKey={impactFxByCellKey}
        skillImpactFxByCellKey={skillImpactFxByCellKey}
      />

      <BottomBar
        bottomBarRef={bottomBarRef}
        selected={selected}
        selectedSkills={selectedSkills}
        turn={turn}
        gameOver={gameOver}
        perUnitTurn={perUnitTurn}
        usedSkills={usedSkills}
        skillMode={skillMode}
        canUndoMove={canUndoMove}
        onSkillButtonClick={handleSkillButtonClick}
        onWaitSelectedUnit={waitSelectedUnit}
        onUndoMove={undoMove}
        onEndTurn={endTurn}
      />
    </div>
  );
}

