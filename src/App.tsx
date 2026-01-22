
import "./App.css";
import unitsData from "./data/units.v1.2.json";
import { createDemoState } from "./game/state";
import { getLegalMoves } from "./game/move";
import { otherSide } from "./game/turn";
import type { Side } from "./game/types";
import { getAttackableTargets, applyNormalAttack, getAttackMarks } from "./game/attack";
import { tryKnockback } from "./game/knockback";
import { getEffectiveAtk, getEffectiveMaxHp } from "./game/stats";
import { SKILLS, getAvailableSkillsForUnit, type SkillId } from "./game/skills/registry";

import checkVictory from "./game/victory";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { tickStartOfSide } from "./game/skills";




// --- portraits (auto) ---
// Vite: import.meta.glob はビルド時にファイルを列挙できる
const SOUTH_PORTRAITS = import.meta.glob<{ default: string }>(
  "./assets/portraits/south/*.{png,jpg,jpeg,webp}",
  { eager: true }
);

const NORTH_PORTRAITS = import.meta.glob<{ default: string }>(
  "./assets/portraits/north/*.{png,jpg,jpeg,webp}",
  { eager: true }
);

// path から "ファイル名(拡張子なし)" を抜く
function baseName(path: string) {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.[^.]+$/, ""); // 拡張子除去
}

// ファイル名 -> unitId に寄せる（必要に応じて調整）
function normalizeToUnitId(name: string) {
  // 例: "chibi_tsutsu" -> "TSUTSU"
  // 例: "TSUTSU" -> "TSUTSU"
  return name
    .replace(/^chibi[_-]?/i, "")
    .toUpperCase();
}

function getPortrait(unitId: string, side: "south" | "north") {
  const table = side === "south" ? SOUTH_PORTRAITS : NORTH_PORTRAITS;

  // 1) unitIdそのまま（方式①）
  for (const [path, mod] of Object.entries(table)) {
    if (normalizeToUnitId(baseName(path)) === unitId) return mod.default;
  }

  // 2) 見つからない場合は undefined
  return undefined;
}



function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function skillUseKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}


type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;


export default function App() {
  const initial = useMemo(() => createDemoState(unitsData as any), []);

 const [instances, setInstances] = useState(initial.instances);
const [selectedId, setSelectedId] = useState<string | null>(null);

const [debugTargetId, setDebugTargetId] = useState<string | null>(null);
const [skillMode, setSkillMode] = useState<SkillId | null>(null);
const [usedSkills, setUsedSkills] = useState<Record<string, boolean>>({});
const [lastMove, setLastMove] = useState<null | {
  turn: Side;
  instanceId: string;
  prevInstances: any[];
  prevPerUnitTurn: PerUnitTurn;
}>(null);
const [showDebug, setShowDebug] = useState(false);
const [bottomBarH, setBottomBarH] = useState(0);
const bottomBarRef = useRef<HTMLDivElement | null>(null);


const [turn, setTurn] = useState<Side>("south");
const [victory, setVictory] = useState<null | { winner: Side; detail: string }>(null);

const gameOver = !!victory;

  const [perUnitTurn, setPerUnitTurn] = useState<PerUnitTurn>({});
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false);
  const [swapUnitId, setSwapUnitId] = useState<string>("");


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



function resetGame() {
  const fresh = createDemoState(unitsData as any);

  setVictory(null);
  setInstances(fresh.instances);
  setTurn("south");

  setSelectedId(null);
  setSwapUnitId("");
  setDebugTargetId(null);

  setSkillMode(null);
  setUsedSkills({});
  setPerUnitTurn({});
  setShowEndTurnConfirm(false);
}

// ESCでスキル解除（1回だけ登録）
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setSkillMode(null);
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);

useEffect(() => {
  setLastMove(null);
}, [turn]);


// 手番が変わった時の初期化（turn切替のタイミングで初期化）
useEffect(() => {
  if (victory) return;



  // ★手番側ユニットの「行動表」を作る（スタン中は最初からdone）
  setPerUnitTurn(() => {
    const m: PerUnitTurn = {};
    for (const u of instances) {
      if (u.side !== turn) continue;
      const stunned = (u.stun ?? 0) > 0;
      m[u.instanceId] = { moved: false, attacked: false, done: stunned };
    }
    return m;
  });

  // 手番が変わったら選択解除
  setSelectedId(null);

  // 確認ポップアップも閉じる保険
  setShowEndTurnConfirm(false);
}, [turn, victory]); // ★instances は入れない（無限初期化の原因になりやすい）


   const rows = initial.rows;
  const cols = initial.cols;

function applyNextInstances(next: typeof instances) {
  setInstances(next);
  const v = checkVictory(rows, cols, next as any);
  if (v) setVictory(v);
}

// --- responsive cell size (mobile friendly) ---
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
  // 画面幅から余白ぶん引いて 7列で割る
  const pad = 24;         // 外側余白
  const max = 64;         // PC時の最大
  const min = 44;         // スマホで押せる最低ライン（目安）
  const size = Math.floor((winW - pad) / cols);
  return Math.max(min, Math.min(max, size));
}, [winW, cols]);

const portraitSize = useMemo(
  () => Math.max(18, Math.floor(cell * 0.34)),
  [cell]
);


  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  const unitsById = initial.unitsById;

  const unitOptions = useMemo(
    () => Object.keys(unitsById).sort(),
    [unitsById]
  );

  const selected = instances.find((x) => x.instanceId === selectedId) ?? null;

  const selectedSkills =
  selected && !(selected.stun && selected.stun > 0)
    ? getAvailableSkillsForUnit(selected.unitId)
    : [];

  



// 進化エリア判定：中央ライン（0-based r===3）＝ A4〜G4
const isEvolveCell = (r: number, _c: number) => r === 3;

 
    const occ = useMemo(() => {
    const m = new Map<string, any>();
    for (const inst of instances) m.set(posKey(inst.pos.r, inst.pos.c), inst);
    return m;
  }, [instances]);

  
  // --- 移動可能マス ---
const legalMoves = useMemo(() => {
  if (!selected) return [];
  if (gameOver) return [];
  if (selected.side !== turn) return [];

  const me = perUnitTurn[selected.instanceId];
  if (me?.done) return [];
  if (me?.moved) return [];

  const stateLike = { rows, cols, unitsById, instances, selectedInstanceId: selectedId };
  return getLegalMoves(stateLike as any, selected as any);
}, [selected, gameOver, turn, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

const legalMoveSet = useMemo(() => {
  const s = new Set<string>();
  for (const p of legalMoves) s.add(posKey(p.r, p.c));
  return s;
}, [legalMoves]);

 
 // --- 攻撃射程（空マス含む表示用） ---
const attackMarks = useMemo(() => {
  if (!selected) return [];
  if (gameOver) return [];
  if (selected.side !== turn) return [];

  const me = perUnitTurn[selected.instanceId];
  if (me?.done) return [];
  if (me?.attacked) return [];

  const stateLike = { rows, cols, unitsById, instances, selectedInstanceId: selectedId };
  return getAttackMarks(stateLike as any, selected as any);
}, [selected, gameOver, turn, rows, cols, unitsById, instances, selectedId, perUnitTurn]);

const attackRangeSet = useMemo(() => {
  const s = new Set<string>();
  for (const mark of attackMarks) {
    if (mark.kind === "range") s.add(posKey(mark.r, mark.c));
  }
  return s;
}, [attackMarks]);

const attackBlockerSet = useMemo(() => {
  const s = new Set<string>();
  for (const mark of attackMarks) {
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

  // 盤面占有（ここは instances から作る）
  const occLocal = new Map<string, any>();
  for (const u of instances) occLocal.set(posKey(u.pos.r, u.pos.c), u);

  // 8方向
  const dirs8 = [
    [-1, 0],[1, 0],[0, -1],[0, 1],
    [-1, -1],[-1, 1],[1, -1],[1, 1],
  ] as const;

  if (def.targetMode === "chooseEnemyAdjacent") {
    // ★敵がいる隣接マスだけターゲットにする
    for (const [dr, dc] of dirs8) {
      const rr = selected.pos.r + dr;
      const cc = selected.pos.c + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      const hit = occLocal.get(posKey(rr, cc));
      if (hit && hit.side !== selected.side) s.add(posKey(rr, cc));
    }
  }

  if (def.targetMode === "chooseLineDirection") {
    // ★各方向、range まで。途中でユニットに当たったらそこで止める（遮蔽一致）
    for (const [dr, dc] of dirs8) {
      for (let i = 1; i <= def.range; i++) {
        const rr = selected.pos.r + dr * i;
        const cc = selected.pos.c + dc * i;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;

        const k = posKey(rr, cc);
        s.add(k);

        // 何か居たらその先は押せない（必要なら “敵だけ止める” に変更可）
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
 

  // --- 攻撃可能ターゲット ---
const attackables = useMemo(() => {
  if (!selected) return [];
  if (gameOver) return [];
  if (selected.side !== turn) return [];

  const me = perUnitTurn[selected.instanceId];
  if (me?.done) return [];
  if (me?.attacked) return [];

  const stateLike = { rows, cols, unitsById, instances, selectedInstanceId: selectedId };
  return getAttackableTargets(stateLike as any, selected as any);
}, [selected, gameOver, turn, rows, cols, unitsById, instances, selectedId, perUnitTurn]);


  const attackSet = useMemo(() => {
    const s = new Set<string>();
    for (const t of attackables) s.add(t.instanceId);
    return s;
  }, [attackables]);

const allDone = useMemo(() => {
  const myUnits = instances.filter((u) => u.side === turn);
  if (myUnits.length === 0) return true;
  return myUnits.every((u) => perUnitTurn[u.instanceId]?.done);
}, [instances, turn, perUnitTurn]);

function undoMove() {
  if (!lastMove) return;
  if (gameOver) return;
  if (lastMove.turn !== turn) return;

  applyNextInstances(lastMove.prevInstances);
  setPerUnitTurn(lastMove.prevPerUnitTurn);
  setSelectedId(lastMove.instanceId);
  setSkillMode(null);
  setLastMove(null);
}


const moveTo = (r: number, c: number) => {
  if (!selected) return;
  if (gameOver) return;
  if (selected.side !== turn) return;

// ★ここで移動前スナップショットを保存
setLastMove({
  turn,
  instanceId: selected.instanceId,
  prevInstances: instances,
  prevPerUnitTurn: perUnitTurn,
});



  const me = perUnitTurn[selected.instanceId];
  if (me?.done) return;
  if (me?.moved) return;

  const k = posKey(r, c);
  if (!legalMoveSet.has(k)) return;

  // まず移動

  let next = instances.map((u) =>
    u.instanceId === selected.instanceId ? { ...u, pos: { r, c } } : u
  );

  // 進化（base→g）適用：HP+1、上限は新MaxHP
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

  // ここで移動確定
  applyNextInstances(next);

  // moved だけ立てる（done は絶対いじらない）
  setPerUnitTurn((m) => ({
    ...m,
    [selected.instanceId]: {
      ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
      moved: true,
    },
  }));
};
 


function tryExecuteSkillOnCell(opts: { r: number; c: number; inst: any | null }) {
  if (!skillMode) return false; // スキル中じゃない → 通常処理へ
  if (!selected) { setSkillMode(null); return true; }
  
  const me = perUnitTurn[selected.instanceId];
  if (gameOver || selected.side !== turn || (me?.done ?? false) || (me?.attacked ?? false)) {
   setSkillMode(null);
   return true;
}

  const def = SKILLS[skillMode];
  if (!def) { setSkillMode(null); return true; }

  // ★クリックしたマスがターゲット外ならキャンセル（または無視）
  if (!skillTargetSet.has(posKey(opts.r, opts.c))) {
    setSkillMode(null);
    return true;
  }


  // 進化条件
  if (def.requiresForm && selected.form !== def.requiresForm) {
    setSkillMode(null);
    return true;
  }

  // 1試合1回（プレイヤー×キャラ×スキル）

const key = skillUseKey(turn, selected.instanceId, def.id);

if (def.oncePerMatch && usedSkills[key]) {
  setSkillMode(null);
  return true;
}


  // targetMode別処理
  switch (def.targetMode) {

case "chooseFront3Cells": {
  // クリック地点が「前3マス」のどれかじゃないとダメ（ハイライトと一致）
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

  // 実行（skills.ts側は前3マスを内部で処理するので、ここは方向指定いらない）
  const stateLike = { rows, cols, instances };
  const next = def.execute({
    stateLike,
    casterId: selected.instanceId,
    damage: def.damage,
    burnTicks: (def as any).burnTicks,
    stunTurns: def.stunTurns,
  } as any);

  applyNextInstances(next);

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
  setSelectedId(null); // テンポ優先。残したいならこの行消してOK
  return true;
}




case "chooseEnemyAdjacent": {
  // クリックしたマスにユニットがいないとダメ
  if (!opts.inst) { setSkillMode(null); return true; }

  // 敵じゃないとダメ
  if (opts.inst.side === selected.side) { setSkillMode(null); return true; }

  const dr = Math.abs(opts.r - selected.pos.r);
const dc = Math.abs(opts.c - selected.pos.c);

// 8方向隣接（縦横斜め）
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

  applyNextInstances(next);
setPerUnitTurn((m) => ({
  ...m,
  [selected.instanceId]: {
    ...(m[selected.instanceId] ?? { moved: false, attacked: false, done: false }),
    attacked: true,
    done: true, // ★攻撃したらそのユニットは完了（テンポ優先）
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

      // 直線（縦/横/斜め）
      const isLine =
        (absR === 0 && absC > 0) ||
        (absC === 0 && absR > 0) ||
        (absR === absC && absR > 0);

      const dist = Math.max(absR, absC);
      if (!isLine || dist > def.range) {
        // 変な場所を押したらキャンセル（ここは好みで「維持」にもできる）
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



     applyNextInstances(next);
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

    applyNextInstances(next);

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

const endTurn = () => {
  setShowEndTurnConfirm(false);
  if (gameOver) return;

  // 次のinstancesを先に作る（副作用なし）
  const next = instances
    .map((u: any) => {
      if (u.side !== turn) return u;

      // ---- STUN 減衰 ----
      const s = u.stun ?? 0;
      const nextStun = s > 0 ? Math.max(0, s - 1) : 0;

      // ---- BURN（1ターンにつき1ダメ、1減衰）----
      const b = u.burn ?? 0;
      const burnDamage = b > 0 ? 1 : 0;
      const nextBurn = b > 0 ? Math.max(0, b - 1) : 0;

      // 反映
      let v: any = { ...u, hp: u.hp - burnDamage };

      // stun 0なら消す
      if (nextStun > 0) v.stun = nextStun;
      else {
        const { stun, ...rest } = v;
        v = rest;
      }

      // burn 0なら消す
      if (nextBurn > 0) v.burn = nextBurn;
      else {
        const { burn, ...rest } = v;
        v = rest;
      }

      return v;
    })
    .filter((u: any) => u.hp > 0);

  applyNextInstances(next);
  setSelectedId(null);

  // ターン終了でも勝利判定
  
// 次のsideを先に計算
const nextSide: Side = otherSide(turn);

// ★状態異常tick（次sideの開始時に1回）
setInstances((prev) => tickStartOfSide({ instances: prev }, nextSide));

// ★ターン交代
setTurn(nextSide);
};

useEffect(() => {
  if (gameOver) return;

  if (!allDone) {
    setShowEndTurnConfirm(false);
    return;
  }

  setShowEndTurnConfirm(true);
}, [allDone, gameOver]);


function replaceSelectedUnit(newUnitId: string) {
  if (!selected) return;

  const def = unitsById[newUnitId];
  if (!def) return;

  setInstances((prev) =>
    prev.map((u) => {
      if (u.instanceId !== selected.instanceId) return u;

      // 入替後は「そのユニットの初期状態」に寄せる
      const nextForm = "base";
      const baseMaxHp = getEffectiveMaxHp(def.base.hp, nextForm);

      // ★ここが肝：HPを入替先の初期HPにする
      // （とりあえず “満タン” がテスト向き）
      const nextHp = baseMaxHp;

      // スタン等の状態異常もクリア（テストしやすく）
      const { stun, ...rest } = u;

      return {
        ...rest,
        unitId: newUnitId,
        form: nextForm,
        hp: nextHp,
      };
    })
  );

  // 入替したら行動表も「未行動」に戻す（混乱防止）
  setPerUnitTurn((m) => {
    const cur = m[selected.instanceId] ?? { moved: false, attacked: false, done: false };
    return {
      ...m,
      [selected.instanceId]: { ...cur, moved: false, attacked: false, done: false },
    };
  });

  // 入替したらスキル選択も解除（事故防止）
  setSkillMode(null);
}


const reset = () => {
  setInstances(initial.instances);
  setSelectedId(null);
  setDebugTargetId(null);
  setSkillMode(null);

  setTurn("south");


  setUsedSkills({});
  setPerUnitTurn({});
  setShowEndTurnConfirm(false);
};

const doKnock = (dr: number, dc: number) => {
  if (!debugTargetId) return;
  if (gameOver) return;
  const stateLike = { rows, cols, unitsById, instances, selectedInstanceId: selectedId };
  const res = tryKnockback(stateLike as any, debugTargetId, dr, dc, 1);
  if (res.ok) setInstances(res.instances);
};



const canSelect = (inst: any) =>
  !gameOver &&
  inst.side === turn &&
  !(perUnitTurn[inst.instanceId]?.done ?? false);

const canUndoMove = useMemo(() => {
  if (gameOver) return false;
  if (!lastMove) return false;
  if (lastMove.turn !== turn) return false;

  const me = perUnitTurn[lastMove.instanceId];
  if (!me) return false;

  // 「移動後 / 攻撃前 / 未完了」だけ許可
  if (!me.moved) return false;
  if (me.attacked) return false;
  if (me.done) return false;

  // 選択中ユニットと一致してる時だけ（好み）
  if (selectedId && selectedId !== lastMove.instanceId) return false;

  return true;
}, [gameOver, lastMove, turn, perUnitTurn, selectedId]);




return (
  <div style={{ padding: 16 }}>


{showEndTurnConfirm && !gameOver && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={() => setShowEndTurnConfirm(false)}
  >
    <div
      style={{
        width: 360,
        maxWidth: "90vw",
        background: "#111",
        border: "1px solid #444",
        borderRadius: 12,
        padding: 14,
        boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
        ターン終了しますか？
      </div>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
        自軍ユニットの行動がすべて完了しました。
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowEndTurnConfirm(false)}
          style={{ padding: "6px 10px" }}
        >
          いいえ
        </button>

       <button
  disabled={!!skillMode}
  onClick={() => {
    if (skillMode) return; // 保険
    setShowEndTurnConfirm(false);
    endTurn();
  }}
  style={{ padding: "6px 10px", fontWeight: 800, opacity: skillMode ? 0.6 : 1 }}
  title={skillMode ? "スキル選択中はターン終了できません（ESCで解除）" : ""}
>
  はい（ターン終了）
</button>

      </div>
    </div>
  </div>
)}

{victory &&
  typeof document !== "undefined" &&
  createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "92vw",
          background: "#111",
          border: "1px solid #444",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
  
        </div>

        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14 }}>
          {victory.detail}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={resetGame}
            style={{ padding: "8px 12px", fontWeight: 900 }}
          >
            RESTART
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

{/* --- Skill Mode Banner --- */}
{!gameOver && skillMode && selected && (() => {
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
        <div style={{ fontWeight: 900 }}>
          スキル選択中：{label}
        </div>
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
})()}




      <h2>Gの部屋 TCG（オフライン試作）</h2>

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
        / 行動: <b>{perUnitTurn[selected.instanceId]?.done ? "完了" : "未完了"}</b>
        {" "}
        （M:{perUnitTurn[selected.instanceId]?.moved ? "済" : "未"} / A:
        {perUnitTurn[selected.instanceId]?.attacked ? "済" : "未"}）
      </>
    )}
  </div>



  <button onClick={reset} style={{ padding: "6px 10px", cursor: "pointer" }}>
    ゲームリセット
  </button>

<button
  onClick={() => setShowDebug((v) => !v)}
  style={{ padding: "6px 10px" }}
>
  {showDebug ? "デバッグ閉じる" : "デバッグ開く"}
</button>


  <button
    disabled={!selected || !!gameOver}
    onClick={() => {
      if (!selected) return;
      setInstances((prev) =>
        prev.map((u) =>
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
        選択中: {selected ? `${selected.instanceId} / ${unitsById[selected.unitId].name}` : "なし"}
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
    style={{ padding: "6px 8px", background: "#111", color: "#fff", border: "1px solid #444", borderRadius: 8 }}
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


<div
  style={{
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    touchAction: "manipulation",
    maxWidth: "100%",
    userSelect: "none",
    WebkitUserSelect: "none",
    paddingBottom: bottomBarH + 12,
  }}
>
  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
        gap: 0,
        width: cols * cell,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const label = `${letters[c]}${r + 1}`;

        const k = posKey(r, c);
        const inst = occ.get(k);

        const isSelected = inst && inst.instanceId === selectedId;
        const isLegalMove = legalMoveSet.has(k);
        const isAttackRange = attackRangeSet.has(k);
        const isAttackBlocker = attackBlockerSet.has(k);
        const isAttackableEnemy =
          inst && inst.side !== turn && attackSet.has(inst.instanceId);

        const isGateNorth = r === 0 && (c === 1 || c === 3 || c === 5);
        const isGateSouth = r === 6 && (c === 1 || c === 3 || c === 5);

        const baseBg = inst
          ? inst.side === "south"
            ? "#1f2a44"
            : "#44201f"
          : "#111";
        const gateTint = isGateNorth ? "#1a2a1a" : isGateSouth ? "#2a1a1a" : "";

        const inSkill = !!skillMode;
        const showMove = !inSkill && isLegalMove;
        const showRng = !inSkill && isAttackRange;

        const isSkillTarget = inSkill && skillTargetSet.has(k);

        const bg =
          isSelected ? "#333"
          : isSkillTarget ? "#5a4a00"
          : isAttackableEnemy ? "#552222"
          : showRng ? "#8a7a00"
          : isAttackBlocker ? "#555555"
          : showMove ? "#224422"
          : gateTint ? gateTint
          : baseBg;

        const cursor =
          inSkill
            ? isSkillTarget
              ? "pointer"
              : "not-allowed"
            : inst
              ? canSelect(inst)
                ? inst.side === turn
                  ? "pointer"
                  : isAttackableEnemy
                    ? "pointer"
                    : "default"
                : isAttackableEnemy
                  ? "pointer"
                  : "not-allowed"
              : isLegalMove && !gameOver
                ? "pointer"
                : "default";

        return (
          <div
            key={label}
            onPointerDown={(e) => {
              if (gameOver) return;
              if (!inst) return;

              if (e.shiftKey && inst.side !== turn) {
                e.preventDefault();
                e.stopPropagation();
                setDebugTargetId(inst.instanceId);
              }
            }}
            onClick={() => {
              if (gameOver) return;

              const handled = tryExecuteSkillOnCell({ r, c, inst: inst ?? null });
              if (handled) return;

              if (inst) {
                if (inst.side !== turn) {
                  if (isAttackableEnemy) attack(inst.instanceId);
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
            style={{
              position: "relative",
              width: cell,
              height: cell,
              border: "1px solid #444",
              background: bg,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              cursor,
              userSelect: "none",
              WebkitUserSelect: "none",
              outline:
                inst && inst.instanceId === debugTargetId
                  ? "2px solid #00e5ff"
                  : "none",
              outlineOffset: -2,
            }}
            title={label}
          >
            {showRng && !inst && (
              <div
                style={{
                  position: "absolute",
                  inset: 6,
                  border: "2px dashed rgba(255,255,255,0.35)",
                  borderRadius: 8,
                  pointerEvents: "none",
                }}
              />
            )}

            {isAttackBlocker && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  opacity: 0.7,
                  pointerEvents: "none",
                }}
              >
                ×
              </div>
            )}

            <div style={{ opacity: 0.8 }}>{label}</div>

            {inst && (() => {
              const src = getPortrait(inst.unitId, inst.side);
              if (!src) return null;
              return (
                <img
                  src={src}
                  alt={inst.unitId}
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    width: portraitSize,
                    height: portraitSize,
                    borderRadius: 999,
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.35)",
                    background: "rgba(0,0,0,0.35)",
                    pointerEvents: "none",
                  }}
                />
              );
            })()}

            {inst ? (
              <>
                <div style={{ fontWeight: 700 }}>{unitsById[inst.unitId].name}</div>

                <div style={{ opacity: 0.9 }}>
                  HP {inst.hp}/
                  {getEffectiveMaxHp(unitsById[inst.unitId].base.hp, inst.form)} / ATK{" "}
                  {getEffectiveAtk(unitsById[inst.unitId].base.atk, inst.form)}
                </div>

                {isAttackableEnemy && (
                  <div style={{ opacity: 0.95, fontWeight: 700 }}>HIT</div>
                )}
              </>
            ) : (
              <div style={{ opacity: showMove || showRng ? 0.9 : 0.25 }}>
                {showMove ? "MOVE" : showRng ? "RNG" : "."}
              </div>
            )}
          </div>
        );
      })}
    </div>
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
  <div
    style={{
      width: "min(720px, 100%)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}
  >
    {/* --- skill row (horizontal scroll) --- */}
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 2,
      }}
    >
      {selected &&
     selectedSkills.map((s: (typeof selectedSkills)[number]) => {

          const k = skillUseKey(turn, selected.instanceId, s.id);
          const used = !!usedSkills[k];

          const formOk = !s.requiresForm || selected.form === s.requiresForm;
          const me = perUnitTurn[selected.instanceId];

          const btnTitle = !formOk
            ? "進化(G)が必要"
            : used
              ? "この試合で使用済み"
              : "";

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

                // instantは即時実行
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

                  applyNextInstances(next);

                  setPerUnitTurn((m) => ({
                    ...m,
                    [selected.instanceId]: {
                      ...(m[selected.instanceId] ?? {
                        moved: false,
                        attacked: false,
                        done: false,
                      }),
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

                // クリック型はモードへ
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
        })}
    </div>

    {/* --- action row --- */}
    <div style={{ display: "flex", gap: 8 }}>
<button
  disabled={
    !selected ||
    !!gameOver ||
    selected.side !== turn ||
    (perUnitTurn[selected.instanceId]?.done ?? false)
  }
  onClick={() => {
    if (gameOver) return;
    if (!selected) return;

    setPerUnitTurn((m) => {
      const cur = m[selected.instanceId] || { moved: false, attacked: false, done: false };
      return {
        ...m,
        [selected.instanceId]: { ...cur, done: true },
      };
    });

    setSelectedId(null);
  }}
  style={{
    flex: 1,
    padding: "10px 10px",
    fontWeight: 900,
    opacity:
      !selected ||
      gameOver ||
      selected.side !== turn ||
      (perUnitTurn[selected.instanceId]?.done ?? false)
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
  </div>
);
}
