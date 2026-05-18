
import { useEffect, useRef, useState } from "react";

import { useLongPress } from "../../hooks/useLongPress";
import { buildStatusIcons } from "../../game/ui/statusIcons";
import { UnitSprite } from "../UnitSprite";



type CellProps = {
  cellSize: number;
dmgFx?: { id: string; amount: number } | null;
skillEventId?: string | null;
attackMotion?: { id: string; dr: number; dc: number } | null;
moveEventId?: string | null;
impactFx?: { id: string; targetId: string } | null;
skillImpactFx?: { id: string; skillId: string; variant: string; casterId: string; targetId: string } | null;

 getPortrait: (unitId: string, side: "south" | "north", form?: "base" | "g") => string;
maxHp?: number;

getPortraitCandidates?: (
  unitId: string,
  side: "south" | "north",
  form?: "base" | "g"
) => string[];


  label: string;
  r: number;
  c: number;
  inst: any | null;

  bg: string;
  cursor: string;

  showInitialDeploy: boolean;
  showRng: boolean;
  isAttackBlocker: boolean;
  isAttackableEnemy: boolean;
  isSelected: boolean;

  isDebugTarget: boolean;

  onClickCell: () => void;

  enableLongPress: boolean;
  onLongPressUnit: (e: PointerEvent) => void;

  onShiftEnemyPick?: () => void;
  disableInput?: boolean;
};

export function Cell(props: CellProps) {
const {
  cellSize,
  dmgFx,
  skillEventId,
  attackMotion,
  moveEventId,
  impactFx,
  skillImpactFx,
  maxHp,
  label,
  inst,
  bg,
  cursor,
  showInitialDeploy,
  showRng,
  isAttackBlocker,
  isAttackableEnemy,
  isSelected,
  isDebugTarget,
  getPortrait,
  getPortraitCandidates,
  onClickCell,
  enableLongPress,
  onLongPressUnit,
  onShiftEnemyPick,
  disableInput = false,
} = props;

const form = (inst?.form ?? "base") as "base" | "g";

const cands = inst
  ? (getPortraitCandidates
      ? getPortraitCandidates(inst.unitId, inst.side, form)
      : [getPortrait(inst.unitId, inst.side, form)])
  : [];

const [hpFlash, setHpFlash] = useState(false);
const prevHpRef = useRef<number | null>(null);
const flashTimerRef = useRef<number | null>(null);

useEffect(() => {
  if (!inst) {
    prevHpRef.current = null;
    return;
  }

  const prev = prevHpRef.current;
  const cur = Number(inst.hp ?? 0);
  if (prev === null) {
    prevHpRef.current = cur;
    return;
  }

  if (cur < prev) {
    setHpFlash(true);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      setHpFlash(false);
      flashTimerRef.current = null;
    }, 140);
  }

  prevHpRef.current = cur;

  return () => {
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  };
}, [inst?.hp, inst?.instanceId]);


 const lp = useLongPress({
  longPressMs: 420,
  moveCancelPx: 10,
  disabled: disableInput || !enableLongPress,
  onLongPress: (e) => onLongPressUnit(e),
  onClick: () => onClickCell(),
});

const pressPct = enableLongPress ? lp.pressPct : 0;
const bind = enableLongPress ? lp.bind : null;
const denom = (maxHp ?? inst?.hp ?? 1);
const pct = inst ? Math.max(0, Math.min(1, (inst.hp ?? 0) / denom)) * 100 : 0;
const ringSize = Math.round(cellSize * 1.40);
const burstSize = Math.round(cellSize * 1.65);
const statusIcons = buildStatusIcons(inst);


type Form = "base" | "g";

const prevInstIdRef = useRef<string | null>(null);
const prevFormRef = useRef<Form | null>(null);

const [evolveTick, setEvolveTick] = useState(0); // 既存流用OK
const [evolveBoost, setEvolveBoost] = useState(false);
const evolveBoostTimerRef = useRef<number | null>(null);

useEffect(() => {
  // inst が消えたら全部リセット
  if (!inst) {
    prevInstIdRef.current = null;
    prevFormRef.current = null;
    setEvolveBoost(false);
    if (evolveBoostTimerRef.current) {
      window.clearTimeout(evolveBoostTimerRef.current);
      evolveBoostTimerRef.current = null;
    }
    return;
  }

  const instId = String(inst.instanceId ?? "");
  const cur = (inst.form ?? "base") as Form;

  // ユニット入れ替え時は比較せず初期化（誤検知防止）
  if (prevInstIdRef.current !== instId) {
    prevInstIdRef.current = instId;
    prevFormRef.current = cur;
    return;
  }

  const prev = prevFormRef.current;

  if (prev === "base" && cur === "g") {
    // 進化を確実にトリガ
    setEvolveTick((x) => x + 1);

    // ブーストON（一定時間でOFFにする）
    setEvolveBoost(true);
    if (evolveBoostTimerRef.current) window.clearTimeout(evolveBoostTimerRef.current);
    evolveBoostTimerRef.current = window.setTimeout(() => {
      setEvolveBoost(false);
      evolveBoostTimerRef.current = null;
    }, 650);

    console.log("[EVOLVE DETECTED]", instId, inst.unitId);
  }

  prevFormRef.current = cur;

  return () => {
    // 念のため（アンマウント時）
    if (evolveBoostTimerRef.current) {
      window.clearTimeout(evolveBoostTimerRef.current);
      evolveBoostTimerRef.current = null;
    }
  };
}, [inst?.instanceId, inst?.form]);


return (
  <div
    onClick={() => {
      if (disableInput) return;
      if (!enableLongPress) onClickCell(); 
    }}
    onPointerDown={(e) => {
      if (disableInput) return;

      if (inst && (e as any).shiftKey && onShiftEnemyPick) {
        e.preventDefault();
        e.stopPropagation();
        onShiftEnemyPick();
        return;
      }

      if (bind) bind.onPointerDown(e as any);
    }}
    onPointerMove={bind ? (bind.onPointerMove as any) : undefined}
    onPointerUp={bind ? (bind.onPointerUp as any) : undefined}
    onPointerCancel={bind ? (bind.onPointerCancel as any) : undefined}
    onPointerLeave={bind ? (bind.onPointerLeave as any) : undefined}
      style={{
        position: "relative",
        width: cellSize,
        height: cellSize,
        boxSizing: "border-box",
        border: "1px solid rgba(255,255,255,0.14)",
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
        outline: isDebugTarget ? "2px solid #00e5ff" : "none",
        outlineOffset: -2,
      }}
      title={label}
    >
      {showInitialDeploy && <div className="initialDeployPreview" />}

      {showRng && (
        <div
          className={isAttackableEnemy ? "normalAttackPreviewTarget" : "normalAttackPreviewRange"}
        />
      )}

      {isAttackBlocker && (
        <div
          className="normalAttackPreviewBlocker"
        >
          ×
        </div>
      )}

     

      {pressPct > 0 && enableLongPress && (
        <div
          style={{
            position: "absolute",
            left: 4,
            right: 4,
            top: 6,
            height: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            overflow: "hidden",
            pointerEvents: "none",
zIndex: 5,
          }}
        >
          <div
            style={{
              width: `${pressPct}%`,
              height: "100%",
              background: "rgba(255,215,0,0.85)",
            }}
          />
        </div>
      )}

      {inst && statusIcons.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 4,
            right: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "flex-start",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {statusIcons.map((icon) => (
            <span
              key={icon.key}
              title={icon.title}
              style={{
                maxWidth: "100%",
                padding: "1px 4px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.24)",
                background: "rgba(0,0,0,0.58)",
                color: "rgba(255,255,255,0.92)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                fontSize: 8,
                fontWeight: 950,
                lineHeight: 1.15,
                letterSpacing: 0,
                textShadow: "0 1px 2px rgba(0,0,0,0.65)",
                whiteSpace: "nowrap",
              }}
            >
              {icon.label}
            </span>
          ))}
        </div>
      )}


{inst && (inst.form ?? "base") === "g" && (
 <div
  key={evolveTick}
  style={{
    position: "absolute",
    inset: -6,
    borderRadius: 14,
    pointerEvents: "none",
    zIndex: 6,
    mixBlendMode: "screen",
    opacity: evolveBoost ? 1 : 0.14,

    display: "grid",
    placeItems: "center",
  }}
>

    {/* ① 白フラッシュ */}
    <div
      style={{
        position: "absolute",
        inset: -10,
        borderRadius: 16,
        background: "rgba(255,255,255,0.92)",
        filter: "blur(2px)",
        animation: "evolveFlash 260ms ease-out forwards",
      }}
    />

{/* ② リング（px固定＋中心固定） */}
<div
  style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: ringSize,
    height: ringSize,
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  }}
>
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 999,
      border: "3px solid rgba(255,215,0,0.85)",
      boxShadow: "0 0 30px rgba(255,215,0,0.55)",

      filter: "blur(0.4px)",
      transformOrigin: "50% 50%",
      animation: "evolveRingCore 520ms cubic-bezier(.2,.9,.2,1) forwards",
    }}
  />
</div>


{/* ③ バースト（px固定＋中心固定） */}
<div
  style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: burstSize,
    height: burstSize,
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  }}
>
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 999,
      background:
        "radial-gradient(circle at 50% 60%, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.0) 35%, rgba(255,255,255,0.70) 55%, rgba(255,255,255,0.0) 75%)",
      filter: "blur(1px)",
      transformOrigin: "50% 50%",
      animation: "evolveBurstCore 650ms ease-out forwards",
    }}
  />
</div>

  </div>
)}






      {/* ★ユニット画像 */}
 {inst && (
  <UnitSprite
    candidates={cands}
    unitId={inst.unitId}
    instanceId={inst.instanceId}
    isSelected={isSelected}
    damageEventId={dmgFx?.id ?? null}
    skillEventId={skillEventId ?? null}
    attackMotion={attackMotion ?? null}
    moveEventId={moveEventId ?? null}
    isBurning={!!inst?.burn && inst.burn > 0}
    isStunned={!!inst?.stun && inst.stun > 0}
  />
)}

{impactFx && (
  <div key={impactFx.id} className="impactFxBurst">
    <div className="impactFxBurstCore" />
    <div className="impactFxBurstRing" />
  </div>
)}

{skillImpactFx && (
  <div
    key={skillImpactFx.id}
    className={`skillImpactFxBurst skillImpactFxBurst--${skillImpactFx.variant}`}
  >
    <div className="skillImpactFxBurstCore" />
    <div className="skillImpactFxBurstRing" />
  </div>
)}


{inst && dmgFx && (
  <div
    key={dmgFx.id}
    style={{
      position: "absolute",
      left: "50%",
      bottom: 18, // HPバーとかぶるので少し上
      transform: "translateX(-50%)",
      fontWeight: 900,
      fontSize: 18,
      textShadow: "0 2px 6px rgba(0,0,0,0.85)",
      pointerEvents: "none",
      zIndex: 6,
      animation: "dmgPop 650ms ease-out forwards",
    }}
  >
    -{dmgFx.amount}
  </div>
)}


{inst && (
  <div
    style={{
      position: "absolute",
      left: 6,
      right: 6,
      bottom: 6,              
      height: 9,                
      borderRadius: 999,
      background: "rgba(0,0,0,0.60)",
      border: hpFlash
        ? "1px solid rgba(255,120,120,0.85)"
        : "1px solid rgba(255,255,255,0.22)",
      boxShadow: hpFlash
        ? "0 0 0 2px rgba(255,80,80,0.18), 0 6px 14px rgba(0,0,0,0.55)"
        : "0 6px 14px rgba(0,0,0,0.55)",
      overflow: "hidden",
      zIndex: 4,
      pointerEvents: "none",
      backdropFilter: "blur(2px)", 
    }}
  >
    {/* ゲージ本体 */}
    <div
      style={{
        width: `${pct}%`,
        height: "100%",
        borderRadius: 999,
        background: hpFlash
          ? "linear-gradient(180deg, rgba(255,130,130,0.98), rgba(255,70,70,0.92))"
          : "linear-gradient(180deg, rgba(120,255,170,0.98), rgba(60,210,120,0.92))",
        transition: "width 120ms linear, filter 120ms linear",
        filter: hpFlash ? "brightness(1.15)" : "none",
      }}
    />

    {/* ハイライト（上面の光） */}
    <div
      style={{
        position: "absolute",
        left: 1,
        right: 1,
        top: 1,
        height: "40%",
        borderRadius: 999,
        background: "rgba(255,255,255,0.12)",
        pointerEvents: "none",
      }}
    />
  </div>
)}

{inst?.justEvolved && (
  <div
    key={inst.justEvolvedId ?? inst.instanceId}
    style={{
      position: "absolute",
      inset: 2,
      borderRadius: 10,
      pointerEvents: "none",
      zIndex: 6,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 10,
        background:
          "radial-gradient(circle at 50% 60%, rgba(255,255,255,0.95), rgba(255,215,0,0.55) 40%, rgba(255,215,0,0) 72%)",
        mixBlendMode: "screen",
        animation: "evolveFlash 520ms ease-out forwards",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "135%",
        height: "135%",
        borderRadius: 999,
        border: "2px solid rgba(255,215,0,0.9)",
        boxShadow: "0 0 26px rgba(255,215,0,0.65)",
        transform: "translate(-50%,-50%)",
        animation: "evolveRing 520ms ease-out forwards",
      }}
    />
  </div>
)}




{!inst && (
  <div style={{ opacity: 0.25, fontSize: 11 }}>
    {label}

  </div>
)}


    </div>
  );
}
