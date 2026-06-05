import "./App.css";
import unitsData from "./data/units.v1.2.json";
import { createDemoState } from "./game/state";
import { buildMoveInstances, getLegalMoves } from "./game/move";
import { otherSide } from "./game/turn";
import type { Side } from "./game/types";
import { getAttackableTargets, getAttackMarks } from "./game/attack";

import { type SkillDef, type SkillId } from "./game/skills/registry";
import { getSkillImpactVariant, type SkillImpactVariant } from "./game/skills/impactVariant";
import {
  getSkillCutInDefinition,
  loadSkillCutInImage,
  type SkillCutInDefinition,
} from "./assets/skillCutins";

import checkVictory, { checkScenarioVictory } from "./game/victory";
import {
  getScenarioConfig,
  type ScenarioDialogKind,
  type ScenarioId,
  type ScenarioReturnScene,
} from "./game/scenario/scenarios";
import { scenarioEnemyUnits } from "./game/scenario/enemyUnits";

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { consumeStunAction } from "./game/statusEffects";

import { BottomBar } from "./components/BottomBar";
import { GameBoardArea } from "./components/GameBoardArea";
import { UnitPopup } from "./components/Popup/UnitPopup";
import { SelectedUnitStatus } from "./components/SelectedUnitStatus";
import { SkillModeBanner } from "./components/SkillModeBanner";
import { SkillCutInOverlay } from "./components/SkillCutInOverlay";
import { TopStatusBar } from "./components/TopStatusBar";
import { TurnEndConfirm } from "./components/UI/TurnEndConfirm";
import { VictoryModal } from "./components/UI/VictoryModal";
import { ScenarioDialog } from "./components/Scenario/ScenarioDialog";
import { ScenarioSelectDialog } from "./components/Scenario/ScenarioSelectDialog";

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
  type Form,
  type Skin,
} from "./assets/imagePaths";
import { isSkinUnlocked, readUnlockedSkins, TRAVEL_SKIN_ID, unlockSkin } from "./assets/skinUnlocks";
import { readClearedScenarios, writeClearedScenarios } from "./game/scenario/progress";
import { addDeltaEventFlag, hasDeltaEventFlag } from "./game/delta/eventFlags";
import { addDeltaMachinePart } from "./game/delta/progress";
import { markWastelandScenarioCleared } from "./game/wasteland/progress";
import { addBlackNoiseBayEventFlag, addShipPart } from "./game/blackNoiseBay/progress";
import { markFinalIsolationBattleCleared, markIsolationDuelCleared, type IsolationDuelMemberId } from "./game/isolation/progress";
import {
  hasStoredGameProgress,
  resetGameProgressStorage,
} from "./game/progressReset";
import {
  markHiddenHintFlag,
  readHiddenHintFlags,
  type HiddenHintFlag,
} from "./game/scenario/hiddenHints";

const AstoriaMapScene = lazy(() =>
  import("./components/AstoriaMapScene").then((module) => ({ default: module.AstoriaMapScene }))
);
const ContinentMapScene = lazy(() =>
  import("./components/ContinentMapScene").then((module) => ({ default: module.ContinentMapScene }))
);
const DeltaMapScene = lazy(() =>
  import("./components/DeltaMapScene").then((module) => ({ default: module.DeltaMapScene }))
);
const DustWastelandScene = lazy(() =>
  import("./components/DustWastelandScene").then((module) => ({ default: module.DustWastelandScene }))
);
const FortressZeroScene = lazy(() =>
  import("./components/FortressZeroScene").then((module) => ({ default: module.FortressZeroScene }))
);
const BlackNoiseBayScene = lazy(() =>
  import("./components/BlackNoiseBayScene").then((module) => ({ default: module.BlackNoiseBayScene }))
);
const NecroCityScene = lazy(() =>
  import("./components/NecroCityScene").then((module) => ({ default: module.NecroCityScene }))
);
const IsolationZoneScene = lazy(() =>
  import("./components/IsolationZoneScene").then((module) => ({ default: module.IsolationZoneScene }))
);
const TownScene = lazy(() =>
  import("./components/TownScene").then((module) => ({ default: module.TownScene }))
);

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function labelToPosKey(label: string, letters: string[]) {
  const match = /^([A-Z]+)(\d+)$/i.exec(label.trim());
  if (!match) return null;

  const c = letters.findIndex((letter) => letter.toUpperCase() === match[1].toUpperCase());
  const r = Number(match[2]) - 1;
  if (c < 0 || !Number.isInteger(r) || r < 0) return null;
  return posKey(r, c);
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

function SceneLoading() {
  return (
    <div className="sceneLoading" role="status" aria-live="polite">
      <div className="sceneLoadingPanel">
        <div className="sceneLoadingEyebrow">Gの部屋TCG</div>
        <div className="sceneLoadingTitle">読み込み中...</div>
      </div>
    </div>
  );
}

function StartMenu({
  hasProgress,
  onContinue,
  onNewGame,
}: {
  hasProgress: boolean;
  onContinue: () => void;
  onNewGame: () => void;
}) {
  return (
    <div className="startMenuScene">
      <div className="startMenuPanel">
        <div className="startMenuEyebrow">G NO HEYA TCG</div>
        <h1 className="startMenuTitle">Gの部屋TCG</h1>
        <p className="startMenuLead">進行状況を選んで開始します。</p>
        <div className="startMenuProgress">
          {hasProgress ? "現在の進行あり" : "進行なし"}
        </div>
        <div className="startMenuActions">
          <button type="button" className="startMenuButton startMenuButtonPrimary" onClick={onContinue}>
            続きから
          </button>
          <button type="button" className="startMenuButton startMenuButtonSecondary" onClick={onNewGame}>
            はじめから
          </button>
        </div>
      </div>
    </div>
  );
}

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;
type Phase = "setup_draw" | "setup_deploy" | "battle";
type GameMode = "versus" | "scenario";
type SkillMotionEvent = { id: string; instanceId: string };
type AttackMotionEvent = { id: string; instanceId: string; dr: number; dc: number };
type MoveMotionEvent = { id: string; instanceId: string };
type ImpactFxEvent = { id: string; targetId: string; r: number; c: number };
type Scene =
  | "astoria"
  | "continent"
  | "delta"
  | "dustWasteland"
  | "fortressZero"
  | "blackNoiseBay"
  | "necroCity"
  | "isolationZone"
  | "town"
  | "tcg";
type BoardPreviewMode = "move" | "attack";

const ISOLATION_SCENARIO_DUEL_IDS: Partial<Record<ScenarioId, IsolationDuelMemberId>> = {
  scenario22: "ushimaru",
  scenario23: "socho",
  scenario24: "tsutsu",
  scenario25: "rokudo",
  scenario26: "7171",
  scenario27: "myouou",
  scenario28: "hibiki",
  scenario29: "deli",
  scenario30: "yabuko",
  scenario31: "rockel",
  scenario32: "player",
};
type SkillImpactFxEvent = {
  id: string;
  skillId: SkillId;
  variant: SkillImpactVariant;
  casterId: string;
  targetId: string;
  r: number;
  c: number;
};

const BATTLE_PREFS_STORAGE_KEY = "gnoheya_tcg_battle_prefs";
const SKILL_CUT_IN_DURATION_MS = 820;

function readSkillCutInEnabled() {
  if (typeof window === "undefined") return true;

  try {
    const raw = window.localStorage.getItem(BATTLE_PREFS_STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.skillCutInEnabled !== false;
  } catch {
    return true;
  }
}

function writeSkillCutInEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(BATTLE_PREFS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(BATTLE_PREFS_STORAGE_KEY, JSON.stringify({ ...parsed, skillCutInEnabled: enabled }));
  } catch {
    window.localStorage.setItem(BATTLE_PREFS_STORAGE_KEY, JSON.stringify({ skillCutInEnabled: enabled }));
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getScenarioDialogTitle(scenarioId: ScenarioId, kind: ScenarioDialogKind) {
  const scenario = getScenarioConfig(scenarioId);
  if (!scenario) return "";
  if (kind === "intro") return scenario.title;
  if (kind === "victory") return `${scenario.title}：勝利`;
  return `${scenario.title}：敗北`;
}

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
  const unitsById = useMemo(
    () =>
      Object.fromEntries([
        ...Object.entries(initial.unitsById),
        ...scenarioEnemyUnits.map((unit) => [unit.id, unit]),
      ]),
    [initial.unitsById]
  );
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
  const [gameMode, setGameMode] = useState<GameMode>("versus");
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId | null>(null);
  const [scenarioDialog, setScenarioDialog] = useState<null | { kind: ScenarioDialogKind; index: number }>(null);
  const [scenarioResultDialogShown, setScenarioResultDialogShown] = useState(false);
  const [battleNotice, setBattleNotice] = useState<string | null>(null);
  const activeScenario = gameMode === "scenario" && activeScenarioId ? getScenarioConfig(activeScenarioId) : null;
  const [activeScenarioReturnScene, setActiveScenarioReturnScene] = useState<ScenarioReturnScene>("astoria");
  const [scenarioSelectOpen, setScenarioSelectOpen] = useState(false);
  const [clearedScenarioIds, setClearedScenarioIds] = useState<ScenarioId[]>(() => readClearedScenarios());
  const [hiddenHintFlags, setHiddenHintFlags] = useState<HiddenHintFlag[]>(() => readHiddenHintFlags());
  const [cpuEnabled, setCpuEnabled] = useState(true);
  const [startMenuOpen, setStartMenuOpen] = useState(true);
  const [storedProgressExists, setStoredProgressExists] = useState(() => hasStoredGameProgress());

  const [deployPlaced, setDeployPlaced] = useState(0);
  const [battleDeployUsed, setBattleDeployUsed] = useState(false);

  const [instances, setInstances] = useState(initial.instances);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boardPreviewMode, setBoardPreviewMode] = useState<BoardPreviewMode>("move");

  

  const [skillMode, setSkillMode] = useState<SkillId | null>(null);
  const [usedSkills, setUsedSkills] = useState<Record<string, boolean>>({});
  const [perUnitTurn, setPerUnitTurn] = useState<PerUnitTurn>({});
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false);
  const [skillCutInEnabled, setSkillCutInEnabled] = useState(() => readSkillCutInEnabled());
  const [skillCutIn, setSkillCutIn] = useState<SkillCutInDefinition | null>(null);
  const [skillCutInBusy, setSkillCutInBusy] = useState(false);

  const [victory, setVictory] = useState<null | { winner: Side; detail: string }>(null);
  const gameOver = victory !== null;
  const scenarioDialogOpen = scenarioDialog !== null;
  const skillCutInPlaying = skillCutInBusy || skillCutIn !== null;
  const inputBlocked = scenarioDialogOpen || skillCutInPlaying;

  const [southSkin, setSouthSkin] = useState<Skin>("default");
  const [northSkin, setNorthSkin] = useState<Skin>("default");
  const [unlockedSkins, setUnlockedSkins] = useState<Skin[]>(() => readUnlockedSkins());
  const [deliMetalMachineUnlocked, setDeliMetalMachineUnlocked] = useState(() =>
    hasDeltaEventFlag("deli_metal_machine_unlocked")
  );
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

  const quicksandStunPendingIdsRef = useRef<Set<string>>(new Set());
  const scenario21ReinforcementSpawnedRef = useRef(false);

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
    if (opts.unitId === "ROKUDO_AUTHOR") {
      passive.dmgReduction = 1;
      passive.stunImmune = true;
      passive.extraActionsPerTurn = 1;
      passive.authorDamageTakenThisTurn = 0;
    }
    if (opts.unitId === "BLACK_NOISE_ROKU") {
      passive.stunImmune = true;
    }

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

  function findScenarioSpawnCell(
    preferred: { r: number; c: number },
    currentInstances: typeof instances,
    candidates: Array<{ r: number; c: number }>
  ) {
    const occupied = new Set(currentInstances.map((unit) => `${unit.pos.r},${unit.pos.c}`));
    const allCandidates = [preferred, ...candidates];
    return allCandidates.find((cell) => {
      if (cell.r < 0 || cell.r >= rows || cell.c < 0 || cell.c >= cols) return false;
      return !occupied.has(`${cell.r},${cell.c}`);
    }) ?? null;
  }

  function spawnScenario21Reinforcements() {
    setInstancesAndRef((prev) => {
      const krakenCell = findScenarioSpawnCell({ r: 0, c: 1 }, prev, [
        { r: 1, c: 1 },
        { r: 0, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: 2 },
      ]);
      const withKraken = krakenCell
        ? [
            ...prev,
            spawnUnit({
              unitId: "KRAKEN",
              side: "north",
              r: krakenCell.r,
              c: krakenCell.c,
              instanceId: `SC21-REINFORCE-KRAKEN-${Date.now()}`,
              hp: 16,
            }),
          ].filter((unit): unit is NonNullable<typeof unit> => unit !== null)
        : prev;
      const octopusCell = findScenarioSpawnCell({ r: 0, c: 5 }, withKraken, [
        { r: 1, c: 5 },
        { r: 0, c: 6 },
        { r: 1, c: 6 },
        { r: 0, c: 4 },
      ]);
      return octopusCell
        ? [
            ...withKraken,
            spawnUnit({
              unitId: "OCTOPUS",
              side: "north",
              r: octopusCell.r,
              c: octopusCell.c,
              instanceId: `SC21-REINFORCE-OCTOPUS-${Date.now()}`,
              hp: 8,
            }),
          ].filter((unit): unit is NonNullable<typeof unit> => unit !== null)
        : withKraken;
    });

    setBattleNotice("黒潮がうねり、海中から新たな影が現れた！ KRAKEN と OCTOPUS が増援として出現！");
    window.setTimeout(() => setBattleNotice(null), 4200);
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
    setGameMode("versus");
    setActiveScenarioId(null);
    setActiveScenarioReturnScene("astoria");
    setScenarioDialog(null);
    setScenarioResultDialogShown(false);
    setVictory(null);
    setSkillMode(null);
    setUsedSkills({});
    setPerUnitTurn({});
    setSkillMotionEvents([]);
    setAttackMotionEvents([]);
    setMoveMotionEvents([]);
    setImpactFxEvents([]);
    setSkillImpactFxEvents([]);
    quicksandStunPendingIdsRef.current.clear();
    setShowEndTurnConfirm(false);
    setBattleDeployUsed(false);
    setDeployPlaced(0);

    setPhase("setup_deploy");
    setTurnState({ side: "south", seq: 0 });

    setSelectedId(null);
    setSelectedHandKey(null);
    setBoardPreviewMode("move");
  }

  function resetBattleStateForScenario(scenarioId: ScenarioId) {
    const returnScene = getScenarioConfig(scenarioId)?.returnScene ?? "astoria";
    setGameMode("scenario");
    setActiveScenarioId(scenarioId);
    setActiveScenarioReturnScene(returnScene);
    setScenarioDialog({ kind: "intro", index: 0 });
    setScenarioResultDialogShown(false);
    setBattleNotice(null);
    setVictory(null);
    setSkillMode(null);
    setUsedSkills({});
    setPerUnitTurn({});
    setSkillMotionEvents([]);
    setAttackMotionEvents([]);
    setMoveMotionEvents([]);
    setImpactFxEvents([]);
    setSkillImpactFxEvents([]);
    quicksandStunPendingIdsRef.current.clear();
    scenario21ReinforcementSpawnedRef.current = false;
    setShowEndTurnConfirm(false);
    setBattleDeployUsed(true);
    setDeployPlaced(0);

    setPhase("battle");
    setTurnState({ side: "south", seq: 1 });

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
      const afterQuicksand =
        quicksandSet.size > 0
          ? afterStart.map((unit: any) => {
              if (unit.side !== turn) return unit;
              if (unit.stunImmune) return unit;
              if (!quicksandSet.has(posKey(unit.pos.r, unit.pos.c))) return unit;
              quicksandStunPendingIdsRef.current.add(unit.instanceId);
              return { ...unit, stun: Math.max(unit.stun ?? 0, 1) };
            })
          : afterStart;

      const v = checkActiveVictory(afterQuicksand as any);
      if (v) setVictory(v);

      return afterQuicksand as any;
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

  async function playSkillCutIn({ def }: { def: SkillDef; selected: any }) {
    if (!skillCutInEnabled) return;

    const cutIn = getSkillCutInDefinition(def.id);
    if (!cutIn) return;

    setSkillCutInBusy(true);
    try {
      const imageAvailable = await loadSkillCutInImage(cutIn.imagePath);
      if (!imageAvailable) return;

      setSkillCutIn(cutIn);
      await wait(SKILL_CUT_IN_DURATION_MS);
      setSkillCutIn(null);
    } finally {
      setSkillCutInBusy(false);
    }
  }

  function toggleSkillCutInEnabled() {
    setSkillCutInEnabled((enabled) => {
      const next = !enabled;
      writeSkillCutInEnabled(next);
      if (!next) setSkillCutIn(null);
      return next;
    });
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

    const v = checkActiveVictory(nextInstances as any);
    if (v) setVictory(v);
  }

  function getDeckBackPath(skin: Skin) {
    if (skin === "dark") return "/cards/back_dark.png";
    if (skin === "travel") return "/cards/back_travel.png";
    if (skin === "comic") return "/cards/back_comic.png";
    return "/cards/back_default.png";
  }

  function checkActiveVictory(nextInstances: typeof instances) {
    if (gameMode === "scenario" && activeScenarioId) {
      return checkScenarioVictory(activeScenarioId, nextInstances as any);
    }
    return checkVictory(rows, cols, nextInstances as any);
  }

  const markScenarioCleared = useCallback((scenarioId: ScenarioId) => {
    setClearedScenarioIds((prev) => {
      if (prev.includes(scenarioId)) return prev;
      const next = [...prev, scenarioId];
      writeClearedScenarios(next);
      return next;
    });
  }, []);

  function advanceScenarioDialog() {
    setScenarioDialog((current) => {
      if (!current) return null;
      const scenario = activeScenarioId ? getScenarioConfig(activeScenarioId) : null;
      const lines = scenario?.dialogs[current.kind] ?? [];
      if (current.index >= lines.length - 1) return null;
      return { ...current, index: current.index + 1 };
    });
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

  const startScenario = (scenarioId: ScenarioId) => {
    const scenario = getScenarioConfig(scenarioId);
    if (!scenario) return;

    setScenarioSelectOpen(false);
    prepareSetupRun();
    if (boardSizeMode !== scenario.boardSizeMode) setBoardSizeMode(scenario.boardSizeMode);

    resetBattleStateForScenario(scenarioId);
    applyInitialHandsAndDecks({
      deckSouth: [],
      handSouth: [],
      deckNorth: [],
      handNorth: [],
    });

    const scenarioInstances = scenario.placements
      .map((placement) => spawnUnit(placement))
      .filter((unit): unit is NonNullable<typeof unit> => unit !== null);

    setInstancesAndRef(scenarioInstances as any);
    console.log(`${scenario.id}: ${scenario.title}`);
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
    if (gameMode === "scenario") return;
    startSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardSizeMode, gameMode]);

  useEffect(() => {
    const refreshDeliMetalMachineUnlock = () =>
      setDeliMetalMachineUnlocked(hasDeltaEventFlag("deli_metal_machine_unlocked"));

    refreshDeliMetalMachineUnlock();
    window.addEventListener("storage", refreshDeliMetalMachineUnlock);
    return () => window.removeEventListener("storage", refreshDeliMetalMachineUnlock);
  }, []);

  useEffect(() => {
    if (gameMode !== "scenario") return;
    if (!activeScenarioId) return;
    if (!victory) return;
    if (scenarioDialog) return;
    if (scenarioResultDialogShown) return;

    if (victory.winner === "south") {
      markScenarioCleared(activeScenarioId);
      if (activeScenarioId === "scenario8") {
        addDeltaMachinePart(1);
      }
      if (activeScenarioId === "scenario9") {
        addDeltaMachinePart(3);
      }
      if (activeScenarioId === "scenario10") {
        addDeltaMachinePart(7);
      }
      if (activeScenarioId === "scenario11") {
        addDeltaEventFlag("delta_chapter_cleared");
        addDeltaEventFlag("deli_metal_machine_unlocked");
        setDeliMetalMachineUnlocked(true);
      }
      if (["scenario12", "scenario13", "scenario14", "scenario15"].includes(activeScenarioId)) {
        markWastelandScenarioCleared(activeScenarioId);
        if (activeScenarioId === "scenario15") {
          unlockSkin(TRAVEL_SKIN_ID);
          setUnlockedSkins(readUnlockedSkins());
        }
      }
      if (activeScenarioId === "scenario18") {
        addBlackNoiseBayEventFlag("black_noise_bay_front_cleared");
        addBlackNoiseBayEventFlag("ship_required_discovered");
        addShipPart("wood");
      }
      if (activeScenarioId === "scenario19") {
        addBlackNoiseBayEventFlag("black_noise_bay_departed");
      }
      if (activeScenarioId === "scenario20") {
        addBlackNoiseBayEventFlag("black_noise_bay_leviathan_hooked");
      }
      if (activeScenarioId === "scenario21") {
        addBlackNoiseBayEventFlag("black_noise_bay_chapter_cleared");
      }
      if (activeScenarioId === "scenario33") {
        markFinalIsolationBattleCleared();
        setUnlockedSkins(readUnlockedSkins());
      }
      const isolationDuelId = ISOLATION_SCENARIO_DUEL_IDS[activeScenarioId];
      if (isolationDuelId) {
        markIsolationDuelCleared(isolationDuelId);
      }
      if (activeScenarioId === "scenario_plaza_monten") {
        setHiddenHintFlags(markHiddenHintFlag("monten_defeated"));
      }
    }

    setScenarioResultDialogShown(true);
    setScenarioDialog({ kind: victory.winner === "south" ? "victory" : "defeat", index: 0 });
  }, [activeScenarioId, gameMode, markScenarioCleared, scenarioDialog, scenarioResultDialogShown, victory]);

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
      initialDeployCandidateCols,
      spawnUnit,
    });
  }, [turnSeq, cols, initialDeployCandidateCols]);

  useEffect(() => {
    if (gameMode !== "scenario") return;
    if (activeScenarioId !== "scenario21") return;
    if (phase !== "battle") return;
    if (turn !== "south") return;
    if (turnSeq < 5) return;
    if (scenario21ReinforcementSpawnedRef.current) return;
    if (victory) return;

    scenario21ReinforcementSpawnedRef.current = true;
    spawnScenario21Reinforcements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenarioId, gameMode, phase, turn, turnSeq, victory]);

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
    initialDeployCandidateCols,
    spawnUnit,
  });
};



  function resetGame() {
    startSetup();
  }

  function refreshProgressStateFromStorage() {
    setClearedScenarioIds(readClearedScenarios());
    setHiddenHintFlags(readHiddenHintFlags());
    setUnlockedSkins(readUnlockedSkins());
    setDeliMetalMachineUnlocked(hasDeltaEventFlag("deli_metal_machine_unlocked"));
    setStoredProgressExists(hasStoredGameProgress());
  }

  function handleContinueFromStartMenu() {
    refreshProgressStateFromStorage();
    setScene("astoria");
    setStartMenuOpen(false);
  }

  function handleNewGameFromStartMenu() {
    const confirmed = window.confirm(
      "進行状況をリセットして、はじめから開始します。\nこの操作は取り消せません。\nよろしいですか？"
    );
    if (!confirmed) return;

    resetGameProgressStorage();
    setClearedScenarioIds([]);
    setHiddenHintFlags([]);
    setUnlockedSkins([]);
    setDeliMetalMachineUnlocked(false);
    setSouthSkin("default");
    setNorthSkin("default");
    setScene("astoria");
    setScenarioSelectOpen(false);
    setPopupId(null);
    setBattleNotice(null);
    setBoardSizeMode("starter7");
    resetGame();
    setStoredProgressExists(false);
    setStartMenuOpen(false);
  }

  function handleGameReset() {
    if (gameMode === "scenario" && activeScenarioId) {
      startScenario(activeScenarioId);
      return;
    }

    resetGame();
  }

  function getScenarioReturnScene(scenarioId: ScenarioId | null): ScenarioReturnScene {
    if (!scenarioId) return activeScenarioReturnScene;
    return getScenarioConfig(scenarioId)?.returnScene ?? "astoria";
  }

  function getScenarioReturnLabel() {
    const returnScene = getScenarioReturnScene(activeScenarioId);
    if (returnScene === "dustWasteland") return "荒野へ戻る";
    if (returnScene === "delta") return "デルタへ戻る";
    if (returnScene === "blackNoiseBay") return "湾へ戻る";
    if (returnScene === "isolationZone") return "隔離区域へ戻る";
    return "街へ戻る";
  }

  function returnFromScenario() {
    const returnScene = getScenarioReturnScene(activeScenarioId);

    setScenarioSelectOpen(false);
    setScenarioDialog(null);
    setScenarioResultDialogShown(false);
    setActiveScenarioId(null);
    setActiveScenarioReturnScene("astoria");
    quicksandStunPendingIdsRef.current.clear();
    setGameMode("versus");
    setVictory(null);
    setSelectedId(null);
    setSkillMode(null);
    setScene(returnScene);
  }

  function openScenarioSelect() {
    setClearedScenarioIds(readClearedScenarios());
    setScenarioSelectOpen(true);
  }

  function handleScenarioSelectFromBattle() {
    const returnScene = getScenarioReturnScene(activeScenarioId);
    if (returnScene !== "astoria") {
      returnFromScenario();
      return;
    }

    openScenarioSelect();
  }

  function retryActiveScenario() {
    if (!activeScenarioId) return;
    startScenario(activeScenarioId);
  }

  function handleScenarioSelectStart(scenarioId: ScenarioId) {
    setScene("tcg");
    startScenario(scenarioId);
  }

  function handleHiddenScenarioStart() {
    const cleared = readClearedScenarios();
    const nextScenarioId: ScenarioId = cleared.includes("scenario_hidden_myouou")
      ? "scenario_hidden_author"
      : "scenario_hidden_myouou";
    handleScenarioSelectStart(nextScenarioId);
  }

  function handleStartMontenTrial() {
    handleScenarioSelectStart("scenario_plaza_monten");
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
    const turnSide = turnRef.current;
    const currentInstances = instancesRef.current as any[];
    const pendingIds = quicksandStunPendingIdsRef.current;
    const stunnedIds =
      turnSide === "south"
        ? new Set(
            currentInstances
              .filter((unit) => unit.side === turnSide && ((unit.stun ?? 0) > 0 || pendingIds.has(unit.instanceId)))
              .map((unit) => unit.instanceId),
          )
        : new Set<string>();

    setPerUnitTurn(() => {
      const next = buildTurnStartPerUnitTurn({
        instances: currentInstances as any,
        turn: turnSide,
      });

      if (pendingIds.size === 0) return next;

      for (const unit of currentInstances) {
        if (unit.side !== turnSide) continue;
        if (!pendingIds.has(unit.instanceId)) continue;

        next[unit.instanceId] = { moved: false, attacked: false, done: true };
        pendingIds.delete(unit.instanceId);
      }

      return next;
    });

    if (stunnedIds.size > 0) {
      setInstancesAndRef((prev) =>
        (prev as any[]).map((unit) => (stunnedIds.has(unit.instanceId) ? consumeStunAction(unit) : unit)) as any,
      );
    }
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
    const isWideBoard = cols >= 9;
    const max = isWideBoard ? 60 : 64;
    const isMobile = winW <= 720;
    const min = isMobile ? (isWideBoard ? 36 : 52) : 44;
    const baseSize = Math.floor((winW - pad) / cols);
    const size = isMobile && !isWideBoard ? Math.floor(baseSize * 1.1) : baseSize;
    return Math.max(min, Math.min(max, size));
  }, [winW, cols]);

  const letters = useMemo(() => getLetters(cols), [cols]);
  const quicksandSet = useMemo(() => {
    const labels = activeScenario?.terrain?.quicksand ?? [];
    return new Set(labels.map((label) => labelToPosKey(label, letters)).filter((key): key is string => key !== null));
  }, [activeScenario, letters]);

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
    candidateCols: initialDeployCandidateCols,
    isOccupied: (r, c) => occ.has(posKey(r, c)),
  });
  return s;
}, [gameOver, phase, turn, selectedHandKey, battleDeployUsed, rows, cols, initialDeployCandidateCols, occ]);

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
    playSkillCutIn,
    onSkillImpact: emitSkillImpact,
    setPerUnitTurn,
    setUsedSkills,
    setSkillMode,
    setSelectedId,
  });

  async function tryExecuteSkillOnCell(opts: { r: number; c: number; inst: any | null }) {
    if (!skillMode) return false;

    const executed = await tryExecuteCellSkill({
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

  async function handleSkillButtonClick(skill: (typeof selectedSkills)[number]) {
    if (inputBlocked) return;
    if (gameOver) return;
    if (!selected) return;

    if (skill.targetMode === "instant" || skill.targetMode === "enemiesInRange") {
      const executed = await tryExecuteImmediateSkill({ def: skill, selected, usedSkills, rows, cols, instances });
      if (!executed) {
        setSkillMode(null);
      }
      return;
    }

    setSkillMode(skill.id);
  }

  function waitSelectedUnit() {
    if (inputBlocked) return;
    if (gameOver) return;
    if (!selected) return;

    setPerUnitTurn((m) => {
      const cur = m[selected.instanceId] ?? { moved: false, attacked: false, done: false };
      return {
        ...m,
        [selected.instanceId]: { ...cur, done: true },
      };
    });

    setSelectedId(null);
    setBoardPreviewMode("move");
  }

  function handleBoardLongPressUnit(inst: any) {
    if (inputBlocked) return;
    if (gameOver) return;

    setSelectedId(inst.instanceId);
    setBoardPreviewMode("move");
    setPopupId(inst.instanceId);
    setSkillMode(null);
  }

  async function handleBoardCellClick(r: number, c: number, inst: any | null) {
    if (inputBlocked) return;
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

    const handled = await tryExecuteSkillOnCell({ r, c, inst: inst ?? null });
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
    if (inputBlocked) return;
    if (!beginEndTurnOnce()) return;

    prepareEndTurnRun();
    if (gameOver) return;

    executeSuccessfulEndTurn();
  };

  const { stopCpuLoopNorth } = useCpuTurn({
    cpuEnabled: cpuEnabled && !inputBlocked,
    phase,
    gameOver,
    turn,
    turnSeq,
    rows,
    cols,
    unitsById,
    scenarioType: activeScenario?.scenarioType ?? "standard",
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

  const getSkinForSide = useCallback((side: Side) => {
    return side === "south" ? southSkin : northSkin;
  }, [northSkin, southSkin]);

  const getVisualUnitIdForImage = useCallback((unitId: string) => {
    if (unitId === "DARK_YABUKO") return "YABUKO_NORMAL";
    if (unitId.startsWith("DARK_")) return unitId.slice("DARK_".length);
    return unitId;
  }, []);

  const getSkinForUnitImage = useCallback((unitId: string, side: Side) => {
    if (side === "north" && unitId.startsWith("DARK_")) return "dark";
    return getSkinForSide(side);
  }, [getSkinForSide]);

  const getDisplayFormForImage = useCallback((unitId: string, side: Side, form: Form = "base"): Form => {
    if (deliMetalMachineUnlocked && side === "south" && unitId === "DELI") return "metal";
    return form;
  }, [deliMetalMachineUnlocked]);

  const getBoardPortrait = useCallback(
    (unitId: string, side: "south" | "north", form?: Form) =>
      getPortraitPath(
        getVisualUnitIdForImage(unitId),
        side,
        getDisplayFormForImage(unitId, side, form ?? "base"),
        getSkinForUnitImage(unitId, side)
      ),
    [getDisplayFormForImage, getSkinForUnitImage, getVisualUnitIdForImage]
  );

  const getBoardPortraitCandidates = useCallback(
    (unitId: string, side: "south" | "north", form?: Form) =>
      portraitThumbCandidates(
        getVisualUnitIdForImage(unitId),
        side,
        getDisplayFormForImage(unitId, side, form ?? "base"),
        getSkinForUnitImage(unitId, side)
      ),
    [getDisplayFormForImage, getSkinForUnitImage, getVisualUnitIdForImage]
  );

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

  const canSelect = (inst: any) =>
    !scenarioDialogOpen && canSelectUnit({ inst, gameOver, turn, perUnitTurn });

  const readySouthUnitIds = useMemo(() => {
    if (phase !== "battle") return new Set<string>();
    if (turn !== "south") return new Set<string>();
    if (gameOver || scenarioDialogOpen) return new Set<string>();

    return new Set(
      instances
        .filter((inst: any) => inst.side === "south" && !(perUnitTurn[inst.instanceId]?.done ?? false))
        .map((inst: any) => inst.instanceId)
    );
  }, [gameOver, instances, perUnitTurn, phase, scenarioDialogOpen, turn]);

  if (startMenuOpen) {
    return (
      <StartMenu
        hasProgress={storedProgressExists}
        onContinue={handleContinueFromStartMenu}
        onNewGame={handleNewGameFromStartMenu}
      />
    );
  }

  if (scene === "astoria") {
    const continentUnlocked = clearedScenarioIds.includes("scenario7");

    return (
      <Suspense fallback={<SceneLoading />}>
        <AstoriaMapScene
          onEnterLobby={() => setScene("town")}
          onOpenScenarioSelect={openScenarioSelect}
          onStartMontenTrial={handleStartMontenTrial}
          continentUnlocked={continentUnlocked}
          onEnterContinent={() => setScene("continent")}
          clearedScenarioIds={clearedScenarioIds}
        />
        <ScenarioSelectDialog
          open={scenarioSelectOpen}
          clearedScenarioIds={clearedScenarioIds}
          onClose={() => setScenarioSelectOpen(false)}
          onStartScenario={handleScenarioSelectStart}
        />
      </Suspense>
    );
  }

  if (scene === "continent") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <ContinentMapScene
          onReturnAstoria={() => setScene("astoria")}
          onEnterDelta={() => setScene("delta")}
          onEnterDustWasteland={() => setScene("dustWasteland")}
          onEnterFortressZero={() => setScene("fortressZero")}
          onEnterBlackNoiseBay={() => setScene("blackNoiseBay")}
          onEnterNecroCity={() => setScene("necroCity")}
          onEnterIsolationZone={() => setScene("isolationZone")}
        />
      </Suspense>
    );
  }

  if (scene === "delta") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <DeltaMapScene
          onReturnContinent={() => setScene("continent")}
          onStartScenario={handleScenarioSelectStart}
          clearedScenarioIds={clearedScenarioIds}
        />
      </Suspense>
    );
  }

  if (scene === "dustWasteland") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <DustWastelandScene
          onReturnContinent={() => setScene("continent")}
          onStartScenario={handleScenarioSelectStart}
        />
      </Suspense>
    );
  }

  if (scene === "fortressZero") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <FortressZeroScene onReturnContinent={() => setScene("continent")} />
      </Suspense>
    );
  }

  if (scene === "blackNoiseBay") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <BlackNoiseBayScene
          clearedScenarioIds={clearedScenarioIds}
          onReturnContinent={() => setScene("continent")}
          onStartScenario={handleScenarioSelectStart}
        />
      </Suspense>
    );
  }

  if (scene === "necroCity") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <NecroCityScene onReturnContinent={() => setScene("continent")} />
      </Suspense>
    );
  }

  if (scene === "isolationZone") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <IsolationZoneScene
          onReturnContinent={() => setScene("continent")}
          onStartScenario={handleScenarioSelectStart}
        />
      </Suspense>
    );
  }

  if (scene === "town") {
    return (
      <Suspense fallback={<SceneLoading />}>
        <TownScene
          onExitToMap={() => setScene("astoria")}
          onEnterTcg={() => setScene("tcg")}
          onStartHiddenScenario={handleHiddenScenarioStart}
          onSkinUnlocked={refreshUnlockedSkins}
          hiddenTrialHintUnlocked={hiddenHintFlags.includes("monten_defeated")}
          clearedScenarioIds={clearedScenarioIds}
          unitsById={unitsById}
        />
        <ScenarioSelectDialog
          open={scenarioSelectOpen}
          clearedScenarioIds={clearedScenarioIds}
          onClose={() => setScenarioSelectOpen(false)}
          onStartScenario={handleScenarioSelectStart}
        />
      </Suspense>
    );
  }

  const isCompactWideBoard = winW <= 720 && cols >= 9;

  return (
    <div className={`tcgScene${cols >= 9 ? " tcgScene--wideBoard" : ""}${isCompactWideBoard ? " tcgScene--compactWideBoard" : ""}`}>
      <UnitPopup
        open={popupOpen}
        unit={popupUnit}
        unitsById={unitsById}
        usedSkills={usedSkills}
        onClose={() => setPopupId(null)}
        getCardCandidates={(unitId: string, side: "south" | "north", form?: "base" | "g") =>
          cardCandidates(
            getVisualUnitIdForImage(unitId),
            side,
            getDisplayFormForImage(unitId, side, form ?? "base"),
            getSkinForUnitImage(unitId, side)
          )
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

      <VictoryModal
        victory={scenarioDialogOpen ? null : victory}
        onRestart={gameMode === "scenario" ? returnFromScenario : resetGame}
        restartLabel={gameMode === "scenario" ? getScenarioReturnLabel() : undefined}
        onScenarioSelect={gameMode === "scenario" && activeScenarioId ? handleScenarioSelectFromBattle : undefined}
        onRetryScenario={gameMode === "scenario" && activeScenarioId ? retryActiveScenario : undefined}
        deltaClearRewardImageSrc={
          gameMode === "scenario" &&
          activeScenarioId === "scenario11" &&
          victory?.winner === "south"
            ? southSkin === "comic"
              ? "/portraits/south/comic/metal/deli.png"
              : "/portraits/south/default/metal/deli.png"
            : undefined
        }
      />

      <ScenarioSelectDialog
        open={scenarioSelectOpen}
        clearedScenarioIds={clearedScenarioIds}
        onClose={() => setScenarioSelectOpen(false)}
        onStartScenario={handleScenarioSelectStart}
      />

      {scenarioDialog && (
        <ScenarioDialog
          title={activeScenarioId ? getScenarioDialogTitle(activeScenarioId, scenarioDialog.kind) : ""}
          lines={activeScenarioId ? (getScenarioConfig(activeScenarioId)?.dialogs[scenarioDialog.kind] ?? []) : []}
          index={scenarioDialog.index}
          onNext={advanceScenarioDialog}
        />
      )}

      {battleNotice ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            top: 86,
            transform: "translateX(-50%)",
            zIndex: 48,
            width: "min(520px, calc(100vw - 24px))",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(143,215,255,0.42)",
            background: "linear-gradient(180deg, rgba(8, 34, 54, 0.94), rgba(4, 10, 18, 0.94))",
            color: "#e8f8ff",
            boxShadow: "0 14px 36px rgba(0,0,0,0.38)",
            fontSize: 13,
            fontWeight: 900,
            lineHeight: 1.55,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {battleNotice}
        </div>
      ) : null}

      <SkillCutInOverlay cutIn={skillCutIn} />

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
        onResetGame={handleGameReset}
        deckSouthCount={deckSouth.length}
        handSouthCount={handSouth.length}
        deckNorthCount={deckNorth.length}
        handNorthCount={handNorth.length}
      />

      <SelectedUnitStatus selected={selected} unitsById={unitsById} perUnitTurn={perUnitTurn} />

      <button
        onClick={gameMode === "scenario" ? returnFromScenario : () => setScene("town")}
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
        {gameMode === "scenario" ? getScenarioReturnLabel() : "街へ戻る"}
      </button>

      <button
        type="button"
        onClick={toggleSkillCutInEnabled}
        disabled={skillCutInPlaying}
        title="スキルカットイン演出のON/OFF"
        style={{
          position: "fixed",
          right: 12,
          top: 54,
          zIndex: 9100,
          padding: "6px 9px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: skillCutInEnabled ? "rgba(46, 31, 92, 0.68)" : "rgba(0,0,0,0.48)",
          color: "#fff",
          fontSize: 11,
          fontWeight: 900,
          cursor: skillCutInPlaying ? "not-allowed" : "pointer",
          opacity: skillCutInPlaying ? 0.55 : 1,
        }}
      >
        CUT-IN {skillCutInEnabled ? "ON" : "OFF"}
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
        compactWideBoard={isCompactWideBoard}
        showHandDeck={gameMode === "versus"}
        boardBackgroundUrl={activeScenario?.backgroundUrl}
        showGateImages={gameMode === "versus"}
        rows={rows}
        cols={cols}
        cellSize={cell}
        letters={letters}
        occ={occ}
        selectedId={selectedId}
        readySouthUnitIds={readySouthUnitIds}
        turn={turn}
        gameOver={gameOver}
        legalMoveSet={legalMoveSet}
        initialDeploySet={initialDeploySet}
        quicksandSet={quicksandSet}
        reinforceSet={reinforceSet}
        attackRangeSet={attackRangeSet}
        attackBlockerSet={attackBlockerSet}
        attackSet={visibleAttackSet}
        skillMode={skillMode}
        skillTargetSet={skillTargetSet}
        debugTargetId={null}
        onShiftEnemyPick={() => {}}
        getPortrait={getBoardPortrait}
        getPortraitCandidates={getBoardPortraitCandidates}
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

