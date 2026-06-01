import { useEffect, useState, type CSSProperties } from "react";
import { hasDeltaEventFlag } from "../game/delta/eventFlags";

type ContinentMapSceneProps = {
  onReturnAstoria: () => void;
  onEnterDelta: () => void;
  onEnterDustWasteland: () => void;
};

const CONTINENT_MAP_IMAGE_URL = "/backgrounds/continent-map.png";

type Hotspot = {
  id: "astoria" | "delta" | "dustWasteland";
  label: string;
  subLabel: string;
  badge?: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const HOTSPOTS: Hotspot[] = [
  { id: "astoria", label: "アストリア", subLabel: "戻る", x: 61, y: 57, w: 28, h: 9 },
  { id: "delta", label: "研究施設デルタ", subLabel: "入る", x: 33, y: 74, w: 34, h: 10 },
  { id: "dustWasteland", label: "砂塵の荒野", subLabel: "新たな調査地点", badge: "NEW", x: 12, y: 43, w: 34, h: 10 },
];

export function ContinentMapScene({
  onReturnAstoria,
  onEnterDelta,
  onEnterDustWasteland,
}: ContinentMapSceneProps) {
  const [deltaChapterCleared, setDeltaChapterCleared] = useState(() =>
    hasDeltaEventFlag("delta_chapter_cleared")
  );

  useEffect(() => {
    const refreshDeltaClearStatus = () =>
      setDeltaChapterCleared(hasDeltaEventFlag("delta_chapter_cleared"));

    refreshDeltaClearStatus();
    window.addEventListener("storage", refreshDeltaClearStatus);
    return () => window.removeEventListener("storage", refreshDeltaClearStatus);
  }, []);

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>CONTINENT MAP</div>
            <h1 style={titleStyle}>大陸MAP</h1>
          </div>
          <button type="button" onClick={onReturnAstoria} style={returnButtonStyle}>
            戻る
          </button>
        </header>

        <div style={mapStyle}>
          {HOTSPOTS.map((spot) => {
            const deltaCleared = spot.id === "delta" && deltaChapterCleared;
            const subLabel = deltaCleared ? "クリア済み" : spot.subLabel;
            const handleClick =
              spot.id === "astoria"
                ? onReturnAstoria
                : spot.id === "delta"
                  ? onEnterDelta
                  : onEnterDustWasteland;

            return (
              <button
                key={spot.id}
                type="button"
                onClick={handleClick}
                title={`${spot.label}: ${subLabel}`}
                style={{
                  ...hotspotStyle,
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${spot.w}%`,
                  height: `${spot.h}%`,
                }}
              >
                <span style={hotspotLabelStyle}>{spot.label}</span>
                {deltaCleared ? <span style={deltaClearedBadgeStyle}>クリア済み</span> : null}
                {spot.badge ? <span style={hotspotBadgeStyle}>{spot.badge}</span> : null}
                <span style={hotspotSubLabelStyle}>{subLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: "10px 8px 18px",
  color: "#fff6df",
  background:
    "radial-gradient(circle at 22% 12%, rgba(255,207,112,0.18), transparent 28%), radial-gradient(circle at 78% 8%, rgba(113,169,255,0.14), transparent 26%), linear-gradient(180deg, #1c2430 0%, #181513 54%, #0e1118 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = {
  width: "min(680px, 100%)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const eyebrowStyle: CSSProperties = {
  color: "#ffd66d",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#fff1ca",
  fontSize: 26,
  textShadow: "0 2px 12px rgba(0,0,0,0.45)",
};

const returnButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.34)",
  background: "rgba(255,241,204,0.12)",
  color: "#fff1cc",
  fontWeight: 900,
  cursor: "pointer",
};

const mapStyle: CSSProperties = {
  position: "relative",
  width: "clamp(320px, 96vw, 640px)",
  maxWidth: "100%",
  aspectRatio: "941 / 1672",
  minHeight: 0,
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 18,
  border: "1px solid rgba(255,229,172,0.25)",
  background:
    `linear-gradient(180deg, rgba(10,12,18,0.04), rgba(20,14,10,0.14)), url(${CONTINENT_MAP_IMAGE_URL}), linear-gradient(180deg, rgba(78,101,122,0.86), rgba(42,33,24,0.92) 100%)`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  boxShadow: "0 22px 60px rgba(0,0,0,0.48), inset 0 0 62px rgba(0,0,0,0.20)",
};

const hotspotStyle: CSSProperties = {
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#fff1cc",
  touchAction: "manipulation",
  cursor: "pointer",
};

const hotspotLabelStyle: CSSProperties = {
  minWidth: 98,
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  boxSizing: "border-box",
  borderRadius: 999,
  border: "1px solid rgba(255,225,149,0.82)",
  background: "linear-gradient(180deg, rgba(58,39,25,0.86), rgba(23,17,14,0.74))",
  color: "#fff1cc",
  boxShadow: "0 8px 18px rgba(0,0,0,0.28), 0 0 12px rgba(255,214,109,0.18)",
  fontSize: 13,
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  textShadow: "0 1px 3px rgba(0,0,0,0.65)",
};

const hotspotSubLabelStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

const deltaClearedBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "calc(50% + 23px)",
  transform: "translateX(-50%)",
  padding: "3px 9px",
  borderRadius: 999,
  border: "1px solid rgba(112, 244, 198, 0.72)",
  background: "linear-gradient(180deg, rgba(10, 64, 56, 0.9), rgba(3, 24, 29, 0.82))",
  color: "#baffea",
  boxShadow: "0 0 14px rgba(99, 255, 203, 0.2)",
  fontSize: 11,
  lineHeight: 1,
  fontWeight: 950,
  whiteSpace: "nowrap",
  textShadow: "0 1px 4px rgba(0,0,0,0.55)",
};

const hotspotBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "calc(50% + 46px)",
  top: "calc(50% - 25px)",
  padding: "3px 7px",
  borderRadius: 999,
  border: "1px solid rgba(255, 235, 145, 0.82)",
  background: "linear-gradient(180deg, rgba(255, 183, 72, 0.96), rgba(176, 77, 20, 0.92))",
  color: "#fff9d8",
  boxShadow: "0 0 14px rgba(255, 192, 72, 0.34)",
  fontSize: 10,
  lineHeight: 1,
  fontWeight: 950,
  whiteSpace: "nowrap",
  textShadow: "0 1px 4px rgba(0,0,0,0.45)",
};
