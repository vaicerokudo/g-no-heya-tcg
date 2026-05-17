import { useEffect, useMemo, useState, type CSSProperties } from "react";
import playerSprite from "../assets/pets/roku/idle-00.png";

type TownSceneProps = {
  onEnterTcg: () => void;
};

type Pos = { x: number; y: number };
type Direction = "left" | "right";

const PLAYER_WIDTH = 68;
const PLAYER_HEIGHT = 74;
const STEP = 18;
const TABLE = { x: 66, y: 32, w: 21, h: 20 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isNearTable(pos: Pos) {
  const playerCenter = { x: pos.x + PLAYER_WIDTH / 2, y: pos.y + PLAYER_HEIGHT / 2 };
  const tableCenter = { x: TABLE.x + TABLE.w / 2, y: TABLE.y + TABLE.h / 2 };
  const dx = playerCenter.x - tableCenter.x;
  const dy = playerCenter.y - tableCenter.y;
  return Math.hypot(dx, dy) <= 25;
}

export function TownScene({ onEnterTcg }: TownSceneProps) {
  const [pos, setPos] = useState<Pos>({ x: 44, y: 68 });
  const [direction, setDirection] = useState<Direction>("right");
  const [walkTick, setWalkTick] = useState(0);
  const nearTable = useMemo(() => isNearTable(pos), [pos]);

  const moveBy = (dx: number, dy: number) => {
    if (dx < 0) setDirection("left");
    if (dx > 0) setDirection("right");
    setWalkTick((value) => value + 1);
    setPos((current) => ({
      x: clamp(current.x + dx, 2, 98 - PLAYER_WIDTH / 4),
      y: clamp(current.y + dy, 12, 96 - PLAYER_HEIGHT / 4),
    }));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "enter" && nearTable) {
        event.preventDefault();
        onEnterTcg();
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
  }, [nearTable, onEnterTcg]);

  const playerBob = walkTick % 2 === 0 ? 0 : -2;

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
          <div style={{ ...lanternGlowStyle, left: "7%", top: "8%" }} />
          <div style={{ ...lanternGlowStyle, right: "7%", top: "8%" }} />

          <div style={guildSignStyle}>Gの部屋</div>
          <div style={backCounterStyle} />
          <div style={rugStyle} />

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

          {nearTable && (
            <div style={promptStyle}>
              <strong>対戦台：試練の盤</strong>
              <span>Enter または「対戦」ボタンでTCG開始</span>
            </div>
          )}

          <img
            src={playerSprite}
            alt="ロク"
            draggable={false}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT,
              objectFit: "contain",
              transform: `translate(-50%, -50%) translateY(${playerBob}px) scaleX(${
                direction === "left" ? -1 : 1
              })`,
              transition: "left 140ms ease, top 140ms ease, transform 120ms ease",
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
            onClick={onEnterTcg}
            disabled={!nearTable}
            style={battleButtonStyle(nearTable)}
          >
            対戦
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
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(180deg, #4a4540 0 28%, #393631 28% 41%, #6a4429 41% 42%, #5a3424 42% 100%)",
  backgroundSize: "38px 38px, 38px 38px, 100% 100%",
  boxShadow: "0 22px 56px rgba(0,0,0,0.46), inset 0 0 48px rgba(0,0,0,0.28)",
};

const lanternGlowStyle: CSSProperties = {
  position: "absolute",
  width: 74,
  height: 74,
  borderRadius: "999px",
  background:
    "radial-gradient(circle, rgba(255,202,105,0.8) 0 10%, rgba(255,148,54,0.28) 28%, transparent 72%)",
  filter: "blur(1px)",
  pointerEvents: "none",
};

const guildSignStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "7%",
  transform: "translateX(-50%)",
  padding: "7px 18px",
  borderRadius: 10,
  color: "#f9ddb1",
  background: "linear-gradient(180deg, #5c3d25, #2d1d14)",
  border: "1px solid rgba(255,225,165,0.28)",
  boxShadow: "0 8px 18px rgba(0,0,0,0.3)",
  fontWeight: 950,
};

const backCounterStyle: CSSProperties = {
  position: "absolute",
  left: "8%",
  right: "8%",
  top: "31%",
  height: "10%",
  borderRadius: 12,
  background: "linear-gradient(180deg, #7c5131, #3e271b)",
  border: "1px solid rgba(255,239,205,0.18)",
  boxShadow: "0 12px 24px rgba(0,0,0,0.28)",
};

const rugStyle: CSSProperties = {
  position: "absolute",
  left: "58%",
  top: "47%",
  width: "34%",
  height: "28%",
  borderRadius: "48%",
  background:
    "radial-gradient(ellipse, rgba(139,42,43,0.72) 0 55%, rgba(82,28,35,0.72) 57% 100%)",
  border: "1px solid rgba(255,221,153,0.12)",
  boxShadow: "inset 0 0 26px rgba(0,0,0,0.22)",
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
