
import { useEffect, useRef, useState } from "react";
import { useLongPress } from "../../hooks/useLongPress";



type CellProps = {
  cellSize: number;
  portraitSize: number;
  getPortrait: (unitId: string, side: "south" | "north") => string;
maxHp?: number;

  label: string;
  r: number;
  c: number;
  inst: any | null;

  bg: string;
  cursor: string;

  showRng: boolean;
  isAttackBlocker: boolean;
  isAttackableEnemy: boolean;
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
    portraitSize,
maxHp,
    label,
    inst,
    bg,
    cursor,
    showRng,
    isAttackBlocker,
    isAttackableEnemy,
    isDebugTarget,
    getPortrait,
    onClickCell,
    enableLongPress,
    onLongPressUnit,
    onShiftEnemyPick,
    disableInput = false,
  } = props;

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

  // 初回は記録だけ
  if (prev === null) {
    prevHpRef.current = cur;
    return;
  }

  // 減った時だけ赤フラッシュ
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


return (
  <div
    onClick={() => {
      if (disableInput) return;
      if (!enableLongPress) onClickCell(); // ←空マスはこれで移動が復活
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

      {/* ★ユニット画像 */}
    {inst && (
  <img
    src={getPortrait(inst.unitId, inst.side)}
    alt={inst.unitId}
    draggable={false}
    style={{
      position: "absolute",
      inset: 0,              
      width: "calc(100% - 4px)",
      height: "calc(100% - 4px)",
      borderRadius: 10,
      objectFit: "contain", 
      pointerEvents: "none",
      zIndex: 3,
      opacity: 0.98,
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))",
    }}
    onError={() => console.log("IMG NG", inst.unitId, getPortrait(inst.unitId, inst.side))}
  />
)}

{inst && (
  <div
    style={{
      position: "absolute",
      left: 6,
      right: 6,
      bottom: 6,                 // ★足元
      height: 9,                 // ★少し太くして“台座感”
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
      backdropFilter: "blur(2px)", // ★ガラスっぽい台座（不要なら消してOK）
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


{!inst && (
  <div style={{ opacity: 0.25, fontSize: 11 }}>
    {label}

  </div>
)}


    </div>
  );
}
