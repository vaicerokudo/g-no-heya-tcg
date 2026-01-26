
import "./App.css";
import unitsData from "./data/units.v1.2.json";
import { createDemoState } from "./game/state";
import { getLegalMoves } from "./game/move";
import { otherSide } from "./game/turn";
import type { Side } from "./game/types";
import { getAttackableTargets, applyNormalAttack, getAttackMarks } from "./game/attack";
import { tryKnockback } from "./game/knockback";

import { SKILLS, getAvailableSkillsForUnit, type SkillId } from "./game/skills/registry";

import checkVictory from "./game/victory";

import { useEffect, useMemo, useRef, useState } from "react";
import { tickStartOfSide } from "./game/skills";
import { getEffectiveMaxHp } from "./game/stats";



import { Board } from "./components/Board/Board";
import { UnitPopup } from "./components/Popup/UnitPopup";
import { TurnEndConfirm } from "./components/UI/TurnEndConfirm";
import { VictoryModal } from "./components/UI/VictoryModal";



function getPortrait(unitId: string, side: "south" | "north") {
  const dir = side === "south" ? "portraits/south" : "portraits/north";

  return `/${dir}/${unitId}.png`;
}

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function skillUseKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}


type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;


export default function App() {
console.count("App render");

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


const [popupId, setPopupId] = useState<string | null>(null);
const popupOpen = popupId !== null;

const popupUnit = instances.find(x => x.instanceId === popupId) ?? null;

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



useEffect(() => {
  if (victory) return;



  setPerUnitTurn(() => {
    const m: PerUnitTurn = {};
    for (const u of instances) {
      if (u.side !== turn) continue;
      const stunned = (u.stun ?? 0) > 0;
      m[u.instanceId] = { moved: false, attacked: false, done: stunned };
    }
    return m;
  });


  setSelectedId(null);



  setShowEndTurnConfirm(false);
}, [turn, victory]); 


   const rows = initial.rows;
  const cols = initial.cols;

function applyNextInstances(next: typeof instances) {
  setInstances(next);
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

  


const isEvolveCell = (r: number, _c: number) => r === 3;

 
    const occ = useMemo(() => {
    const m = new Map<string, any>();
    for (const inst of instances) m.set(posKey(inst.pos.r, inst.pos.c), inst);
    return m;
  }, [instances]);

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


  const occLocal = new Map<string, any>();
  for (const u of instances) occLocal.set(posKey(u.pos.r, u.pos.c), u);


  const dirs8 = [
    [-1, 0],[1, 0],[0, -1],[0, 1],
    [-1, -1],[-1, 1],[1, -1],[1, 1],
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



  let next = instances.map((u) =>
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

  applyNextInstances(next);


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
  if (!selected) { setSkillMode(null); return true; }
  
  const me = perUnitTurn[selected.instanceId];
  if (gameOver || selected.side !== turn || (me?.done ?? false) || (me?.attacked ?? false)) {
   setSkillMode(null);
   return true;
}

  const def = SKILLS[skillMode];
  if (!def) { setSkillMode(null); return true; }


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
  setSelectedId(null); 
 
  
return true;
}




case "chooseEnemyAdjacent": {

  if (!opts.inst) { setSkillMode(null); return true; }


  if (opts.inst.side === selected.side) { setSkillMode(null); return true; }

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

  const nextSide: Side = otherSide(turn);

  setInstances((prev) => {
  
    const afterEnd = prev
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

   
      const nextForm = "base";
      const baseMaxHp = getEffectiveMaxHp(def.base.hp, nextForm);


      const nextHp = baseMaxHp;


      const { stun, ...rest } = u;

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
  getPortrait={getPortrait}
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

<VictoryModal
  victory={victory}
  onRestart={resetGame}
/>

 


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




      <h2>Gの部屋 TCG（体験版）</h2>

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
    getPortrait={getPortrait}
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
  />
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
</> 
);
}
