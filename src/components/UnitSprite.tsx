import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useImgFallback } from "./imgFallback";

type UnitSpriteProps = {
  candidates: string[];
  unitId: string;
  instanceId: string;
  isSelected?: boolean;
  damageEventId?: string | null;
  skillEventId?: string | null;
  attackMotion?: { id: string; dr: number; dc: number } | null;
  moveEventId?: string | null;
  isBurning?: boolean;
  isStunned?: boolean;
};

function buildIdleDelay(instanceId: string) {
  let hash = 0;
  for (let i = 0; i < instanceId.length; i += 1) {
    hash = (hash * 31 + instanceId.charCodeAt(i)) % 3000;
  }
  return -(hash % 900);
}

export function UnitSprite({
  candidates,
  unitId,
  instanceId,
  isSelected = false,
  damageEventId = null,
  skillEventId = null,
  attackMotion = null,
  moveEventId = null,
  isBurning = false,
  isStunned = false,
}: UnitSpriteProps) {
  const fb = useImgFallback(candidates, { placeholder: "" });
  const idleDelay = useMemo(() => buildIdleDelay(instanceId), [instanceId]);
  const [isShaking, setIsShaking] = useState(false);
  const [isSkillPulsing, setIsSkillPulsing] = useState(false);
  const [isAttackLunging, setIsAttackLunging] = useState(false);
  const [isMoveHopping, setIsMoveHopping] = useState(false);
  const shakeStartTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const skillPulseStartTimerRef = useRef<number | null>(null);
  const skillPulseTimerRef = useRef<number | null>(null);
  const attackLungeStartTimerRef = useRef<number | null>(null);
  const attackLungeTimerRef = useRef<number | null>(null);
  const moveHopStartTimerRef = useRef<number | null>(null);
  const moveHopTimerRef = useRef<number | null>(null);
  const attackLungeStyle = {
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    "--attack-dr": attackMotion?.dr ?? 0,
    "--attack-dc": attackMotion?.dc ?? 0,
  } as CSSProperties;
  const portraitFilter = [
    isStunned ? "saturate(0.7) brightness(0.86)" : "",
    isSelected
      ? "drop-shadow(0 3px 9px rgba(255,215,0,0.42)) drop-shadow(0 2px 6px rgba(0,0,0,0.55))"
      : "drop-shadow(0 2px 6px rgba(0,0,0,0.55))",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!damageEventId) return undefined;

    if (shakeStartTimerRef.current) window.clearTimeout(shakeStartTimerRef.current);
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);

    shakeStartTimerRef.current = window.setTimeout(() => {
      setIsShaking(true);
      shakeStartTimerRef.current = null;

      shakeTimerRef.current = window.setTimeout(() => {
        setIsShaking(false);
        shakeTimerRef.current = null;
      }, 220);
    }, 0);

    return () => {
      if (shakeStartTimerRef.current) {
        window.clearTimeout(shakeStartTimerRef.current);
        shakeStartTimerRef.current = null;
      }
      if (shakeTimerRef.current) {
        window.clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = null;
      }
    };
  }, [damageEventId]);

  useEffect(() => {
    if (!skillEventId) return undefined;

    if (skillPulseStartTimerRef.current) window.clearTimeout(skillPulseStartTimerRef.current);
    if (skillPulseTimerRef.current) window.clearTimeout(skillPulseTimerRef.current);

    skillPulseStartTimerRef.current = window.setTimeout(() => {
      setIsSkillPulsing(true);
      skillPulseStartTimerRef.current = null;

      skillPulseTimerRef.current = window.setTimeout(() => {
        setIsSkillPulsing(false);
        skillPulseTimerRef.current = null;
      }, 320);
    }, 0);

    return () => {
      if (skillPulseStartTimerRef.current) {
        window.clearTimeout(skillPulseStartTimerRef.current);
        skillPulseStartTimerRef.current = null;
      }
      if (skillPulseTimerRef.current) {
        window.clearTimeout(skillPulseTimerRef.current);
        skillPulseTimerRef.current = null;
      }
    };
  }, [skillEventId]);

  useEffect(() => {
    if (!attackMotion?.id) return undefined;

    if (attackLungeStartTimerRef.current) window.clearTimeout(attackLungeStartTimerRef.current);
    if (attackLungeTimerRef.current) window.clearTimeout(attackLungeTimerRef.current);

    attackLungeStartTimerRef.current = window.setTimeout(() => {
      setIsAttackLunging(true);
      attackLungeStartTimerRef.current = null;

      attackLungeTimerRef.current = window.setTimeout(() => {
        setIsAttackLunging(false);
        attackLungeTimerRef.current = null;
      }, 260);
    }, 0);

    return () => {
      if (attackLungeStartTimerRef.current) {
        window.clearTimeout(attackLungeStartTimerRef.current);
        attackLungeStartTimerRef.current = null;
      }
      if (attackLungeTimerRef.current) {
        window.clearTimeout(attackLungeTimerRef.current);
        attackLungeTimerRef.current = null;
      }
    };
  }, [attackMotion?.id]);

  useEffect(() => {
    if (!moveEventId) return undefined;

    if (moveHopStartTimerRef.current) window.clearTimeout(moveHopStartTimerRef.current);
    if (moveHopTimerRef.current) window.clearTimeout(moveHopTimerRef.current);

    moveHopStartTimerRef.current = window.setTimeout(() => {
      setIsMoveHopping(true);
      moveHopStartTimerRef.current = null;

      moveHopTimerRef.current = window.setTimeout(() => {
        setIsMoveHopping(false);
        moveHopTimerRef.current = null;
      }, 340);
    }, 0);

    return () => {
      if (moveHopStartTimerRef.current) {
        window.clearTimeout(moveHopStartTimerRef.current);
        moveHopStartTimerRef.current = null;
      }
      if (moveHopTimerRef.current) {
        window.clearTimeout(moveHopTimerRef.current);
        moveHopTimerRef.current = null;
      }
    };
  }, [moveEventId]);

  return (
    <div
      className={`unitSpriteMotion${isSelected ? " isSelected" : ""}${isStunned ? " isStunned" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "calc(100% - 4px)",
        height: "calc(100% - 4px)",
        pointerEvents: "none",
        zIndex: 3,
        animationDelay: `${idleDelay}ms`,
        transformOrigin: "50% 72%",
      }}
    >
      <div
        className={`unitSpriteMoveHop${isMoveHopping ? " isHopping" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <div
          className={`unitSpriteAttackLunge${isAttackLunging ? " isLunging" : ""}`}
          style={attackLungeStyle}
        >
        <div
          className={`unitSpriteSkillPulse${isSkillPulsing ? " isPulsing" : ""}`}
          style={{
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <div
            className={`unitSpriteShake${isShaking ? " isShaking" : ""}`}
            style={{
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <div className={`unitSpriteStatusAura${isBurning ? " isBurning" : ""}`} />
            <img
              src={fb.src}
              onError={fb.onError}
              alt={unitId}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 10,
                objectFit: "contain",
                pointerEvents: "none",
                opacity: 0.98,
                filter: portraitFilter,
              }}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
