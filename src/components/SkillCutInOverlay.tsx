import type { CSSProperties } from "react";
import type { SkillCutInDefinition } from "../assets/skillCutins";

type SkillCutInOverlayProps = {
  cutIn: SkillCutInDefinition | null;
};

export function SkillCutInOverlay({ cutIn }: SkillCutInOverlayProps) {
  if (!cutIn) return null;

  return (
    <div style={overlayStyle} aria-live="assertive" aria-label={`${cutIn.characterName} ${cutIn.skillName}`}>
      <div className="skillCutInBand" style={bandStyle}>
        <img src={cutIn.imagePath} alt="" style={imageStyle} draggable={false} />
        <div style={shadeStyle} />
        <div style={textStyle}>
          <div style={characterStyle}>{cutIn.characterName}</div>
          <div style={skillStyle}>{cutIn.skillName}</div>
        </div>
        <div className="skillCutInFlash" style={flashStyle} />
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  display: "grid",
  placeItems: "center",
  background: "rgba(0, 0, 0, 0.42)",
  pointerEvents: "auto",
};

const bandStyle: CSSProperties = {
  position: "relative",
  width: "min(920px, 92vw)",
  aspectRatio: "16 / 5",
  maxHeight: "42vh",
  overflow: "hidden",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.28)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.62), 0 0 34px rgba(255,255,255,0.14)",
  background: "#080812",
  animation: "skillCutInSlide 780ms cubic-bezier(.2,.9,.2,1) both",
};

const imageStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform: "scale(1.03)",
};

const shadeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, rgba(3,4,10,0.86) 0%, rgba(3,4,10,0.3) 48%, rgba(3,4,10,0.72) 100%)",
};

const textStyle: CSSProperties = {
  position: "absolute",
  left: "clamp(18px, 5vw, 54px)",
  bottom: "clamp(16px, 4vw, 38px)",
  color: "#fff",
  textShadow: "0 3px 14px rgba(0,0,0,0.82)",
};

const characterStyle: CSSProperties = {
  display: "inline-flex",
  padding: "4px 10px",
  marginBottom: 8,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.42)",
  background: "rgba(0,0,0,0.36)",
  fontSize: "clamp(12px, 2.2vw, 16px)",
  fontWeight: 950,
  letterSpacing: 0,
};

const skillStyle: CSSProperties = {
  fontSize: "clamp(28px, 8vw, 64px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: 0,
};

const flashStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.42) 48%, transparent 68%)",
  transform: "translateX(-120%)",
  animation: "skillCutInFlash 780ms ease-out both",
  mixBlendMode: "screen",
};
