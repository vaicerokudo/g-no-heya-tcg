import { useEffect, useMemo, useState, type CSSProperties } from "react";
import rokuChibi from "../assets/portraits/south/chibi_rokudo.png";

type TownSceneProps = {
  onEnterTcg: () => void;
};

type Pos = { x: number; y: number };

const PLAYER_SIZE = 56;
const STEP = 18;
const TABLE = { x: 68, y: 34, w: 18, h: 18 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isNearTable(pos: Pos) {
  const playerCenter = { x: pos.x + PLAYER_SIZE / 2, y: pos.y + PLAYER_SIZE / 2 };
  const tableCenter = { x: TABLE.x + TABLE.w / 2, y: TABLE.y + TABLE.h / 2 };
  const dx = playerCenter.x - tableCenter.x;
  const dy = playerCenter.y - tableCenter.y;
  return Math.hypot(dx, dy) <= 24;
}

export function TownScene({ onEnterTcg }: TownSceneProps) {
  const [pos, setPos] = useState<Pos>({ x: 44, y: 68 });
  const nearTable = useMemo(() => isNearTable(pos), [pos]);

  const moveBy = (dx: number, dy: number) => {
    setPos((current) => ({
      x: clamp(current.x + dx, 2, 98 - PLAYER_SIZE / 4),
      y: clamp(current.y + dy, 12, 96 - PLAYER_SIZE / 4),
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

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 14,
        boxSizing: "border-box",
        color: "#fff",
        background:
          "linear-gradient(180deg, #172033 0%, #223047 48%, #16251e 48%, #1e3527 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ width: "min(720px, 100%)" }}>
        <div style={{ marginBottom: 10 }}>
          <h2 style={{ margin: "0 0 4px" }}>Gの部屋の前</h2>
          <div style={{ fontSize: 13, opacity: 0.82 }}>
            ロクを動かして、対戦台に近づいてください。
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 10",
            minHeight: 320,
            maxHeight: "68vh",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 14,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(180deg, #39485c 0 32%, #5b4a32 32% 44%, #2b5a35 44% 100%)",
            backgroundSize: "36px 36px, 36px 36px, 100% 100%",
            boxShadow: "0 18px 50px rgba(0,0,0,0.36)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              top: "34%",
              height: "12%",
              borderRadius: 12,
              background: "rgba(86,63,42,0.82)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: `${TABLE.x}%`,
              top: `${TABLE.y}%`,
              width: `${TABLE.w}%`,
              height: `${TABLE.h}%`,
              borderRadius: 12,
              background: "linear-gradient(180deg, #6b5840, #2d2520)",
              border: nearTable ? "2px solid #ffd866" : "1px solid rgba(255,255,255,0.22)",
              boxShadow: nearTable
                ? "0 0 0 4px rgba(255,216,102,0.16), 0 8px 24px rgba(0,0,0,0.38)"
                : "0 8px 24px rgba(0,0,0,0.28)",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              fontWeight: 950,
              fontSize: 13,
            }}
          >
            対戦台
          </div>

          {nearTable && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "18%",
                transform: "translateX(-50%)",
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.64)",
                border: "1px solid rgba(255,216,102,0.58)",
                fontWeight: 900,
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              Enter またはボタンで対戦する
            </div>
          )}

          <img
            src={rokuChibi}
            alt="ロク"
            draggable={false}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              objectFit: "contain",
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.45))",
              userSelect: "none",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "64px 64px 64px",
            gap: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div />
          <button onClick={() => moveBy(0, -STEP)} style={padButtonStyle}>
            ↑
          </button>
          <div />
          <button onClick={() => moveBy(-STEP, 0)} style={padButtonStyle}>
            ←
          </button>
          <button
            onClick={onEnterTcg}
            disabled={!nearTable}
            style={{
              ...padButtonStyle,
              opacity: nearTable ? 1 : 0.45,
              borderColor: nearTable ? "rgba(255,216,102,0.75)" : "rgba(255,255,255,0.18)",
            }}
          >
            対戦
          </button>
          <button onClick={() => moveBy(STEP, 0)} style={padButtonStyle}>
            →
          </button>
          <div />
          <button onClick={() => moveBy(0, STEP)} style={padButtonStyle}>
            ↓
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}

const padButtonStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.36)",
  color: "#fff",
  fontWeight: 950,
  fontSize: 15,
  touchAction: "manipulation",
};
