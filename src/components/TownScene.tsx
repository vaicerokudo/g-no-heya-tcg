import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import playerSpriteSheet from "../assets/pets/roku/spritesheet.webp";
import guildLobby from "../assets/town/guild-lobby.png";
import reception7171 from "../assets/town/reception-7171.png";

type TownSceneProps = {
  onEnterTcg: () => void;
};

type Pos = { x: number; y: number };
type InteractionArea = { x: number; y: number; w: number; h: number };
type InteractionTarget = "table" | "reception" | null;
type TownDialog = "reception" | null;
type Facing = "left" | "right";
type SpriteState = "idle" | "running-left" | "running-right";

const PLAYER_WIDTH = 68;
const PLAYER_HEIGHT = 74;
const STEP = 18;
const TABLE = { x: 66, y: 32, w: 21, h: 20 };
const RECEPTION = { x: 48, y: 58, w: 30, h: 14 };
const INTERACTION_THRESHOLD = 4;
const SPRITE_CELL_WIDTH = 192;
const SPRITE_CELL_HEIGHT = 208;
const PLAYER_SCALE = PLAYER_WIDTH / SPRITE_CELL_WIDTH;
const MOVE_ANIMATION_MS = 180;
const SPRITE_ANIMS: Record<SpriteState, { row: number; frames: number; intervalMs: number }> = {
  idle: { row: 0, frames: 6, intervalMs: 190 },
  "running-right": { row: 1, frames: 8, intervalMs: 105 },
  "running-left": { row: 2, frames: 8, intervalMs: 105 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isNearArea(pos: Pos, area: InteractionArea, threshold = INTERACTION_THRESHOLD) {
  const closestX = clamp(pos.x, area.x, area.x + area.w);
  const closestY = clamp(pos.y, area.y, area.y + area.h);
  const dx = pos.x - closestX;
  const dy = pos.y - closestY;
  return Math.hypot(dx, dy) <= threshold;
}

export function TownScene({ onEnterTcg }: TownSceneProps) {
  const [pos, setPos] = useState<Pos>({ x: 44, y: 68 });
  const [activeDialog, setActiveDialog] = useState<TownDialog>(null);
  const [facing, setFacing] = useState<Facing>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const moveStopTimerRef = useRef<number | null>(null);
  const nearTable = useMemo(() => isNearArea(pos, TABLE), [pos]);
  const nearReception = useMemo(() => isNearArea(pos, RECEPTION), [pos]);
  const interactionTarget: InteractionTarget = nearReception
    ? "reception"
    : nearTable
      ? "table"
      : null;

  const handleInteract = () => {
    if (interactionTarget === "reception") {
      setActiveDialog("reception");
    } else if (interactionTarget === "table") {
      onEnterTcg();
    }
  };

  const moveBy = (dx: number, dy: number) => {
    if (dx < 0) setFacing("left");
    if (dx > 0) setFacing("right");
    setIsMoving(true);
    if (moveStopTimerRef.current !== null) {
      window.clearTimeout(moveStopTimerRef.current);
    }
    moveStopTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveStopTimerRef.current = null;
    }, MOVE_ANIMATION_MS);
    setPos((current) => ({
      x: clamp(current.x + dx, 2, 98 - PLAYER_WIDTH / 4),
      y: clamp(current.y + dy, 12, 96 - PLAYER_HEIGHT / 4),
    }));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "enter" && interactionTarget) {
        event.preventDefault();
        handleInteract();
        return;
      }

      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        moveBy(0, -STEP);
      } else if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        moveBy(0, STEP);
      } else if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        moveBy(-STEP, 0);
      } else if (key === "arrowright" || key === "d") {
        event.preventDefault();
        moveBy(STEP, 0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [interactionTarget, onEnterTcg]);

  useEffect(() => {
    return () => {
      if (moveStopTimerRef.current !== null) {
        window.clearTimeout(moveStopTimerRef.current);
      }
    };
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

  const safeFrameIndex = frameIndex % spriteAnim.frames;
  const interactionButtonLabel =
    interactionTarget === "reception" ? "話す" : interactionTarget === "table" ? "対戦" : "移動";

  return (
    <div style={sceneStyle}>
      <div style={{ width: "min(760px, 100%)" }}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>GUILD LOBBY</div>
            <h2 style={titleStyle}>Gの部屋ロビー</h2>
          </div>
          <div style={hintStyle}>ロクを動かして、光る対戦台に近づいてください。</div>
        </div>

        <div style={mapStyle}>
          <div
            style={{
              ...duelTableStyle,
              left: `${TABLE.x}%`,
              top: `${TABLE.y}%`,
              width: `${TABLE.w}%`,
              height: `${TABLE.h}%`,
              border: nearTable
                ? "2px solid rgba(255, 221, 128, 0.98)"
                : "1px solid rgba(255, 245, 214, 0.24)",
              boxShadow: nearTable
                ? "0 0 0 5px rgba(255, 204, 90, 0.2), 0 0 34px rgba(255, 190, 72, 0.34), 0 16px 30px rgba(0,0,0,0.38)"
                : "0 14px 28px rgba(0,0,0,0.34)",
            }}
          >
            <div style={tableBoardStyle}>
              <div style={tableRuneStyle}>G</div>
            </div>
            <div style={tableLabelStyle}>試練の盤</div>
            <div style={tableSubLabelStyle}>対戦台</div>
          </div>

          {interactionTarget && (
            <div style={promptStyle}>
              {interactionTarget === "reception" ? (
                <>
                  <strong>受付：7171に話しかける</strong>
                  <span>Enter または「話す」ボタン</span>
                </>
              ) : (
                <>
                  <strong>対戦台：試練の盤</strong>
                  <span>Enter または「対戦」ボタンでTCG開始</span>
                </>
              )}
            </div>
          )}

          {activeDialog === "reception" && (
            <div style={dialogPanelStyle}>
              <img src={reception7171} alt="7171受付" style={dialogPortraitStyle} />
              <div style={dialogBodyStyle}>
                <div style={dialogNameStyle}>7171</div>
                <div style={dialogTextStyle}>ようこそ、Gの部屋へにゃ。</div>
              </div>
              <button onClick={() => setActiveDialog(null)} style={dialogCloseButtonStyle}>
                閉じる
              </button>
            </div>
          )}

          <div
            aria-label="ロク"
            role="img"
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: SPRITE_CELL_WIDTH,
              height: SPRITE_CELL_HEIGHT,
              backgroundImage: `url(${playerSpriteSheet})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "1536px 1872px",
              backgroundPosition: `-${safeFrameIndex * SPRITE_CELL_WIDTH}px -${
                spriteAnim.row * SPRITE_CELL_HEIGHT
              }px`,
              transform: `translate(-50%, -50%) scale(${PLAYER_SCALE})`,
              transition: "left 140ms ease, top 140ms ease",
              filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.48))",
              userSelect: "none",
              zIndex: 8,
            }}
          />
        </div>

        <div style={controlsWrapStyle}>
          <div />
          <button aria-label="上へ移動" onClick={() => moveBy(0, -STEP)} style={padButtonStyle}>
            ↑
          </button>
          <div />
          <button aria-label="左へ移動" onClick={() => moveBy(-STEP, 0)} style={padButtonStyle}>
            ←
          </button>
          <button
            onClick={handleInteract}
            disabled={!interactionTarget}
            style={battleButtonStyle(!!interactionTarget)}
          >
            {interactionButtonLabel}
          </button>
          <button aria-label="右へ移動" onClick={() => moveBy(STEP, 0)} style={padButtonStyle}>
            →
          </button>
          <div />
          <button aria-label="下へ移動" onClick={() => moveBy(0, STEP)} style={padButtonStyle}>
            ↓
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 14,
  boxSizing: "border-box",
  color: "#fff6df",
  background:
    "radial-gradient(circle at 18% 12%, rgba(255,190,93,0.22), transparent 24%), radial-gradient(circle at 82% 14%, rgba(255,161,72,0.16), transparent 28%), linear-gradient(180deg, #211913 0%, #171211 50%, #0d1118 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const headerStyle: CSSProperties = {
  marginBottom: 10,
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  color: "#f3c878",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: "0 0 2px",
  fontSize: 24,
  color: "#fff1ca",
  textShadow: "0 2px 10px rgba(0,0,0,0.42)",
};

const hintStyle: CSSProperties = {
  fontSize: 13,
  color: "rgba(255,246,223,0.86)",
  lineHeight: 1.5,
};

const mapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 10",
  minHeight: 320,
  maxHeight: "68vh",
  overflow: "hidden",
  border: "1px solid rgba(255,229,172,0.25)",
  borderRadius: 16,
  backgroundImage: `url(${guildLobby})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundColor: "#211913",
  boxShadow: "0 22px 56px rgba(0,0,0,0.46), inset 0 0 48px rgba(0,0,0,0.28)",
};

const duelTableStyle: CSSProperties = {
  position: "absolute",
  borderRadius: 16,
  background: "linear-gradient(135deg, #7b5734, #3f2a1c 55%, #241912)",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  zIndex: 4,
};

const tableBoardStyle: CSSProperties = {
  position: "absolute",
  inset: "16% 18% 32%",
  borderRadius: 10,
  background:
    "radial-gradient(circle at 50% 50%, rgba(255,222,123,0.68), rgba(115,68,35,0.34) 48%, rgba(35,23,18,0.8) 72%)",
  border: "1px solid rgba(255,226,151,0.38)",
  boxShadow: "0 0 22px rgba(255,196,89,0.22)",
};

const tableRuneStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  fontSize: 18,
  fontWeight: 950,
  color: "#fff1ba",
  textShadow: "0 0 12px rgba(255,213,115,0.9)",
};

const tableLabelStyle: CSSProperties = {
  position: "absolute",
  left: 6,
  right: 6,
  bottom: 17,
  fontSize: 13,
  fontWeight: 950,
  color: "#fff3cf",
  textShadow: "0 2px 8px rgba(0,0,0,0.55)",
};

const tableSubLabelStyle: CSSProperties = {
  position: "absolute",
  left: 6,
  right: 6,
  bottom: 5,
  fontSize: 10,
  color: "rgba(255,244,216,0.76)",
};

const promptStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "17%",
  transform: "translateX(-50%)",
  padding: "8px 12px",
  borderRadius: 12,
  background: "rgba(27,18,13,0.78)",
  border: "1px solid rgba(255,216,102,0.64)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.32)",
  display: "grid",
  gap: 2,
  textAlign: "center",
  fontSize: 12,
  pointerEvents: "none",
  zIndex: 10,
};

const dialogPanelStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: 14,
  transform: "translateX(-50%)",
  width: "min(560px, calc(100% - 28px))",
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(27,18,13,0.86)",
  border: "1px solid rgba(255,216,102,0.58)",
  boxShadow: "0 16px 32px rgba(0,0,0,0.38)",
  display: "grid",
  gridTemplateColumns: "82px minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "center",
  zIndex: 12,
};

const dialogPortraitStyle: CSSProperties = {
  width: 82,
  height: 110,
  maxWidth: "22vw",
  maxHeight: "28vh",
  objectFit: "cover",
  objectPosition: "center 18%",
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.32)",
  boxShadow: "0 8px 18px rgba(0,0,0,0.34)",
};

const dialogBodyStyle: CSSProperties = {
  minWidth: 0,
};

const dialogNameStyle: CSSProperties = {
  color: "#ffd66d",
  fontWeight: 950,
};

const dialogTextStyle: CSSProperties = {
  color: "#fff6df",
  fontSize: 13,
  lineHeight: 1.5,
};

const dialogCloseButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,232,180,0.28)",
  background: "rgba(255,241,204,0.12)",
  color: "#fff1cc",
  fontWeight: 900,
  touchAction: "manipulation",
};

const controlsWrapStyle: CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "64px 76px 64px",
  gap: 9,
  justifyContent: "center",
  alignItems: "center",
};

const padButtonStyle: CSSProperties = {
  minHeight: 50,
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.24)",
  background: "linear-gradient(180deg, rgba(68,45,31,0.92), rgba(26,20,18,0.9))",
  color: "#fff1cc",
  boxShadow: "0 6px 14px rgba(0,0,0,0.26)",
  fontWeight: 950,
  fontSize: 18,
  touchAction: "manipulation",
};

function battleButtonStyle(active: boolean): CSSProperties {
  return {
    ...padButtonStyle,
    color: active ? "#2a1a0d" : "rgba(255,241,204,0.72)",
    background: active
      ? "linear-gradient(180deg, #ffd66d, #c5872d)"
      : "linear-gradient(180deg, rgba(68,45,31,0.66), rgba(26,20,18,0.86))",
    borderColor: active ? "rgba(255,238,177,0.9)" : "rgba(255,232,180,0.2)",
    opacity: active ? 1 : 0.52,
  };
}
