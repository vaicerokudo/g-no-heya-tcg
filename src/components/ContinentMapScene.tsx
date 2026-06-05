import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import rokuSpriteSheet from "../assets/pets/roku/spritesheet.webp";
import { hasDeltaEventFlag } from "../game/delta/eventFlags";
import { hasWastelandEventFlag } from "../game/wasteland/progress";
import { hasBlackNoiseBayEventFlag } from "../game/blackNoiseBay/progress";
import { getIsolationProgress, hasClearedFinalIsolationBattle } from "../game/isolation/progress";

type ContinentMapSceneProps = {
  onReturnAstoria: () => void;
  onEnterDelta: () => void;
  onEnterDustWasteland: () => void;
  onEnterFortressZero: () => void;
  onEnterBlackNoiseBay: () => void;
  onEnterNecroCity: () => void;
  onEnterIsolationZone: () => void;
};

const CONTINENT_MAP_IMAGE_URL = "/backgrounds/continent-map.webp";

type Hotspot = {
  id: "astoria" | "delta" | "dustWasteland" | "fortressZero" | "blackNoiseBay" | "necroCity" | "isolationZone";
  label: string;
  subLabel: string;
  badge?: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type DebugPoint = {
  x: number;
  y: number;
};

type MapPos = {
  x: number;
  y: number;
};

type Facing = "left" | "right";
type SpriteState = "idle" | "running-left" | "running-right";

const ROKU_PLAYER_SIZE = 30;
const ROKU_MOVE_MS = 520;
const SPRITE_CELL_WIDTH = 192;
const SPRITE_CELL_HEIGHT = 208;
const ROKU_SPRITE_SCALE = ROKU_PLAYER_SIZE / SPRITE_CELL_WIDTH;
const SPRITE_ANIMS: Record<SpriteState, { row: number; frames: number; intervalMs: number }> = {
  idle: { row: 0, frames: 6, intervalMs: 190 },
  "running-right": { row: 1, frames: 8, intervalMs: 105 },
  "running-left": { row: 2, frames: 8, intervalMs: 105 },
};

const HOTSPOTS: Hotspot[] = [
  { id: "astoria", label: "アストリア", subLabel: "戻る", x: 77, y: 65, w: 28, h: 9 },
  { id: "delta", label: "研究施設デルタ", subLabel: "入る", x: 59, y: 79, w: 34, h: 10 },
  { id: "dustWasteland", label: "砂塵の荒野", subLabel: "新たな調査地点", badge: "NEW", x: 50, y: 61, w: 34, h: 10 },
  { id: "fortressZero", label: "FORTRESS ZERO", subLabel: "記憶の街", badge: "ARG", x: 24, y: 49, w: 34, h: 10 },
  { id: "blackNoiseBay", label: "ブラックノイズ湾", subLabel: "黒い潮の調査地点", badge: "NEW", x: 52, y: 36, w: 36, h: 10 },
  { id: "necroCity", label: "廃都ネクロシティ", subLabel: "部材探索中", badge: "NEW", x: 40, y: 25, w: 36, h: 10 },
  { id: "isolationZone", label: "隔離区域", subLabel: "己の影と向き合う場所", badge: "FINAL", x: 83, y: 33, w: 30, h: 10 },
];

export function ContinentMapScene({
  onReturnAstoria,
  onEnterDelta,
  onEnterDustWasteland,
  onEnterFortressZero,
  onEnterBlackNoiseBay,
  onEnterNecroCity,
  onEnterIsolationZone,
}: ContinentMapSceneProps) {
  const [deltaChapterCleared, setDeltaChapterCleared] = useState(() =>
    hasDeltaEventFlag("delta_chapter_cleared")
  );
  const [wastelandChapterCleared, setWastelandChapterCleared] = useState(() =>
    hasWastelandEventFlag("wasteland_chapter_cleared")
  );
  const [shipRequiredDiscovered, setShipRequiredDiscovered] = useState(() =>
    hasBlackNoiseBayEventFlag("ship_required_discovered")
  );
  const [shipBuilt, setShipBuilt] = useState(() =>
    hasBlackNoiseBayEventFlag("ship_built") || hasBlackNoiseBayEventFlag("black_noise_bay_ship_ready")
  );
  const [blackNoiseBayCleared, setBlackNoiseBayCleared] = useState(() =>
    hasBlackNoiseBayEventFlag("black_noise_bay_chapter_cleared")
  );
  const [isolationFinalCleared, setIsolationFinalCleared] = useState(() =>
    hasClearedFinalIsolationBattle(getIsolationProgress())
  );
  const [rokuPos, setRokuPos] = useState<MapPos>({ x: 77, y: 71 });
  const [facing, setFacing] = useState<Facing>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isDebugMap] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debugMap") === "1";
  });
  const [debugPoint, setDebugPoint] = useState<DebugPoint | null>(null);
  const moveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const refreshChapterClearStatus = () => {
      setDeltaChapterCleared(hasDeltaEventFlag("delta_chapter_cleared"));
      setWastelandChapterCleared(hasWastelandEventFlag("wasteland_chapter_cleared"));
      setShipRequiredDiscovered(hasBlackNoiseBayEventFlag("ship_required_discovered"));
      setShipBuilt(hasBlackNoiseBayEventFlag("ship_built") || hasBlackNoiseBayEventFlag("black_noise_bay_ship_ready"));
      setBlackNoiseBayCleared(hasBlackNoiseBayEventFlag("black_noise_bay_chapter_cleared"));
      setIsolationFinalCleared(hasClearedFinalIsolationBattle(getIsolationProgress()));
    };

    refreshChapterClearStatus();
    window.addEventListener("storage", refreshChapterClearStatus);
    return () => window.removeEventListener("storage", refreshChapterClearStatus);
  }, []);

  const spriteState: SpriteState = isMoving
    ? facing === "left"
      ? "running-left"
      : "running-right"
    : "idle";
  const spriteAnim = SPRITE_ANIMS[spriteState];

  useEffect(() => {
    setFrameIndex(0);
    const timerId = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % spriteAnim.frames);
    }, spriteAnim.intervalMs);

    return () => window.clearInterval(timerId);
  }, [spriteAnim.frames, spriteAnim.intervalMs, spriteState]);

  useEffect(() => {
    return () => {
      if (moveTimerRef.current !== null) {
        window.clearTimeout(moveTimerRef.current);
      }
    };
  }, []);

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDebugMap) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const nextPoint = { x, y };

    setDebugPoint(nextPoint);
    console.log(`map position: left: ${x.toFixed(1)}%, top: ${y.toFixed(1)}%`);
  };

  const getHotspotAction = (spotId: Hotspot["id"]) => {
    if (spotId === "astoria") return onReturnAstoria;
    if (spotId === "delta") return onEnterDelta;
    if (spotId === "dustWasteland") return onEnterDustWasteland;
    if (spotId === "fortressZero") return onEnterFortressZero;
    if (spotId === "blackNoiseBay") return onEnterBlackNoiseBay;
    if (spotId === "necroCity") return onEnterNecroCity;
    return onEnterIsolationZone;
  };

  const enterHotspotAfterRokuMove = (spot: Hotspot) => {
    if (isMoving) return;

    const nextPos = { x: spot.x, y: Math.min(94, spot.y + spot.h * 0.72) };
    setFacing(nextPos.x < rokuPos.x ? "left" : "right");
    setIsMoving(true);
    setRokuPos(nextPos);

    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
    }

    moveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveTimerRef.current = null;
      getHotspotAction(spot.id)();
    }, ROKU_MOVE_MS);
  };

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

        <div style={mapFrameStyle} onClick={handleMapClick}>
          <img src={CONTINENT_MAP_IMAGE_URL} alt="" aria-hidden="true" style={mapImageStyle} />
          <div
            aria-label="ロク"
            style={{
              ...rokuSpriteStyle,
              left: `${rokuPos.x}%`,
              top: `${rokuPos.y}%`,
              backgroundImage: `url(${rokuSpriteSheet})`,
              backgroundPosition: `${-frameIndex * SPRITE_CELL_WIDTH * ROKU_SPRITE_SCALE}px ${
                -spriteAnim.row * SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE
              }px`,
            }}
          />
          <div style={hotspotLayerStyle}>
            {HOTSPOTS.map((spot) => {
              if (spot.id === "necroCity" && !shipRequiredDiscovered) return null;
              if (spot.id === "isolationZone" && !blackNoiseBayCleared) return null;

              const deltaCleared = spot.id === "delta" && deltaChapterCleared;
              const wastelandCleared = spot.id === "dustWasteland" && wastelandChapterCleared;
              const necroCityCleared = spot.id === "necroCity" && shipBuilt;
              const bayCleared = spot.id === "blackNoiseBay" && blackNoiseBayCleared;
              const isolationCleared = spot.id === "isolationZone" && isolationFinalCleared;
              const cleared = deltaCleared || wastelandCleared || necroCityCleared || bayCleared || isolationCleared;
              const subLabel = cleared ? (spot.id === "necroCity" ? "探索完了" : "クリア済み") : spot.subLabel;

              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    enterHotspotAfterRokuMove(spot);
                  }}
                  title={`${spot.label}: ${subLabel}`}
                  style={{
                    ...hotspotStyle,
                    ...(isMoving ? hotspotMovingStyle : null),
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.w}%`,
                  }}
                >
                  <span style={hotspotLabelStyle}>{spot.label}</span>
                  {cleared || spot.badge ? (
                    <span style={hotspotBadgeRowStyle}>
                      {cleared ? <span style={clearedBadgeStyle}>{spot.id === "necroCity" ? "CLEAR" : "クリア済み"}</span> : null}
                      {!cleared && spot.badge ? <span style={hotspotBadgeStyle}>{spot.badge}</span> : null}
                    </span>
                  ) : null}
                  <span style={hotspotSubLabelStyle}>{subLabel}</span>
                </button>
              );
            })}
          </div>
          {isDebugMap && debugPoint ? (
            <>
              <div
                aria-hidden="true"
                style={{
                  ...debugMarkerStyle,
                  left: `${debugPoint.x}%`,
                  top: `${debugPoint.y}%`,
                }}
              />
              <div style={debugReadoutStyle}>
                <div>x: {debugPoint.x.toFixed(1)}%</div>
                <div>y: {debugPoint.y.toFixed(1)}%</div>
              </div>
            </>
          ) : null}
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

const mapFrameStyle: CSSProperties = {
  position: "relative",
  width: "clamp(320px, 96vw, 640px)",
  maxWidth: "100%",
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 18,
  border: "1px solid rgba(255,229,172,0.25)",
  background: "linear-gradient(180deg, rgba(78,101,122,0.86), rgba(42,33,24,0.92) 100%)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.48), inset 0 0 62px rgba(0,0,0,0.20)",
};

const mapImageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
};

const hotspotLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

const hotspotStyle: CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#fff1cc",
  touchAction: "manipulation",
  cursor: "pointer",
  transform: "translate(-50%, -50%)",
  pointerEvents: "auto",
};

const hotspotMovingStyle: CSSProperties = {
  cursor: "wait",
};

const rokuSpriteStyle: CSSProperties = {
  position: "absolute",
  width: ROKU_PLAYER_SIZE,
  height: ROKU_PLAYER_SIZE * (SPRITE_CELL_HEIGHT / SPRITE_CELL_WIDTH),
  transform: "translate(-50%, -90%)",
  backgroundRepeat: "no-repeat",
  backgroundSize: `${SPRITE_CELL_WIDTH * ROKU_SPRITE_SCALE * 8}px ${SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE * 9}px`,
  imageRendering: "auto",
  filter: "drop-shadow(0 7px 9px rgba(0,0,0,0.46)) drop-shadow(0 0 10px rgba(255,214,109,0.34))",
  transition: `left ${ROKU_MOVE_MS}ms ease, top ${ROKU_MOVE_MS}ms ease`,
  zIndex: 2,
  pointerEvents: "none",
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
  fontSize: 12,
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

const clearedBadgeStyle: CSSProperties = {
  display: "inline-flex",
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

const hotspotBadgeRowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  maxWidth: "100%",
  pointerEvents: "none",
};

const hotspotBadgeStyle: CSSProperties = {
  display: "inline-flex",
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

const debugMarkerStyle: CSSProperties = {
  position: "absolute",
  width: 20,
  height: 20,
  transform: "translate(-50%, -50%)",
  pointerEvents: "none",
  zIndex: 8,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.92)",
  boxShadow: "0 0 0 2px rgba(255, 45, 45, 0.58), 0 0 14px rgba(255,45,45,0.7)",
  background:
    "linear-gradient(90deg, transparent calc(50% - 1px), rgba(255,45,45,0.95) calc(50% - 1px), rgba(255,45,45,0.95) calc(50% + 1px), transparent calc(50% + 1px)), linear-gradient(0deg, transparent calc(50% - 1px), rgba(255,45,45,0.95) calc(50% - 1px), rgba(255,45,45,0.95) calc(50% + 1px), transparent calc(50% + 1px))",
};

const debugReadoutStyle: CSSProperties = {
  position: "absolute",
  left: 10,
  bottom: 10,
  zIndex: 9,
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(0,0,0,0.7)",
  color: "#fff",
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 900,
  pointerEvents: "none",
  textShadow: "0 1px 2px rgba(0,0,0,0.7)",
};
