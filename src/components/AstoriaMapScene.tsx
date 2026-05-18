import { useEffect, useRef, useState, type CSSProperties } from "react";
import rokuSpriteSheet from "../assets/pets/roku/spritesheet.webp";

type AstoriaMapSceneProps = {
  onEnterLobby: () => void;
};

type HotspotId = "gRoom" | "blacksmith" | "generalStore" | "plaza" | "gate";
type DialogId = Exclude<HotspotId, "gRoom">;

type Hotspot = {
  id: HotspotId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelX: number;
  labelY: number;
  targetX: number;
  targetY: number;
};

type DialogContent = {
  title: string;
  speaker?: string;
  portraitUrl?: string;
  portraitAlt?: string;
  text: string;
  actionLabel?: string;
  actionUrl?: string;
  disabledReason?: string;
};

type MapPos = { x: number; y: number };
type Facing = "left" | "right";
type SpriteState = "idle" | "running-left" | "running-right";

const YOUTUBE_URL = "https://www.youtube.com/@Gnoheya-6910";
const LINE_STAMP_URL = "https://store.line.me/stickershop/product/32711346/ja?from=sticker";
const ASTORIA_MAP_IMAGE_URL = "/backgrounds/astoria-map.png";
const SAGG_IMAGE_URL = "/characters/sagg.png";
const SHOPKEEPER_IMAGE_URL = "/characters/shopkeeper.png";
const MONTEN_IMAGE_URL = "/characters/monten.png";
const ROKU_PLAYER_SIZE = 44;
const ROKU_MOVE_MS = 760;
const SPRITE_CELL_WIDTH = 192;
const SPRITE_CELL_HEIGHT = 208;
const ROKU_SPRITE_SCALE = ROKU_PLAYER_SIZE / SPRITE_CELL_WIDTH;
const SPRITE_ANIMS: Record<SpriteState, { row: number; frames: number; intervalMs: number }> = {
  idle: { row: 0, frames: 6, intervalMs: 190 },
  "running-right": { row: 1, frames: 8, intervalMs: 105 },
  "running-left": { row: 2, frames: 8, intervalMs: 105 },
};

const HOTSPOTS: Hotspot[] = [
  {
    id: "gRoom",
    label: "Gの部屋",
    subLabel: "ロビーへ",
    x: 64,
    y: 14,
    w: 29,
    h: 21,
    labelX: 80,
    labelY: 11.5,
    targetX: 78.5,
    targetY: 33.5,
  },
  {
    id: "blacksmith",
    label: "鍛冶屋",
    subLabel: "サッグ",
    x: 4,
    y: 25,
    w: 31,
    h: 18,
    labelX: 17,
    labelY: 21.5,
    targetX: 19.5,
    targetY: 41,
  },
  {
    id: "generalStore",
    label: "雑貨屋",
    subLabel: "スタンプ",
    x: 3,
    y: 44,
    w: 31,
    h: 17,
    labelX: 17,
    labelY: 44,
    targetX: 18.5,
    targetY: 59.5,
  },
  {
    id: "plaza",
    label: "広場",
    subLabel: "門天",
    x: 43,
    y: 50,
    w: 35,
    h: 18,
    labelX: 66,
    labelY: 49.5,
    targetX: 60.5,
    targetY: 67,
  },
  {
    id: "gate",
    label: "門",
    subLabel: "準備中",
    x: 34,
    y: 73,
    w: 32,
    h: 17,
    labelX: 50,
    labelY: 77,
    targetX: 50,
    targetY: 75,
  },
];

function getHotspotDestination(spot: Hotspot): MapPos {
  return { x: spot.targetX, y: spot.targetY };
}

const DIALOGS: Record<DialogId, DialogContent> = {
  blacksmith: {
    title: "鍛冶屋",
    speaker: "サッグ",
    portraitUrl: SAGG_IMAGE_URL,
    portraitAlt: "サッグ",
    text:
      "おう、来たか。\nGの部屋の記録映像なら、ここから見られるぜ。\n叩いて鍛えるのは鉄だけじゃねぇ。\n物語も、見られて強くなるんだ。",
    actionLabel: "YouTubeを開く",
    actionUrl: YOUTUBE_URL,
  },
  generalStore: {
    title: "雑貨屋",
    portraitUrl: SHOPKEEPER_IMAGE_URL,
    portraitAlt: "雑貨屋受付",
    text: "いらっしゃいませ。\n旅のお供に、スタンプなんてどうですか？",
    actionLabel: "LINEスタンプを見る",
    actionUrl: LINE_STAMP_URL ?? undefined,
    disabledReason: LINE_STAMP_URL ? undefined : "LINEスタンプのURLは準備中です。",
  },
  plaza: {
    title: "広場",
    speaker: "門天",
    portraitUrl: MONTEN_IMAGE_URL,
    portraitAlt: "門天",
    text: "ここはアストリアの広場だ。\nいずれ知らせや依頼が集まる場所になる。",
  },
  gate: {
    title: "門",
    text: "この先はまだ準備中です。\n森や鉱山へ続く道は、いずれ開かれます。",
  },
};

export function AstoriaMapScene({ onEnterLobby }: AstoriaMapSceneProps) {
  const [activeDialog, setActiveDialog] = useState<DialogId | null>(null);
  const [failedPortraits, setFailedPortraits] = useState<Set<string>>(() => new Set());
  const [rokuPos, setRokuPos] = useState<MapPos>({ x: 50, y: 82 });
  const [facing, setFacing] = useState<Facing>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const moveTimerRef = useRef<number | null>(null);
  const dialog = activeDialog ? DIALOGS[activeDialog] : null;

  const handleHotspot = (id: HotspotId) => {
    if (isMoving) return;

    const spot = HOTSPOTS.find((candidate) => candidate.id === id);
    if (!spot) return;

    const nextPos = getHotspotDestination(spot);
    setActiveDialog(null);
    setFacing(nextPos.x < rokuPos.x ? "left" : "right");
    setIsMoving(true);
    setRokuPos(nextPos);

    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
    }
    moveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveTimerRef.current = null;

      if (id === "gRoom") {
        onEnterLobby();
        return;
      }

      setActiveDialog(id);
    }, ROKU_MOVE_MS);
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

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

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>ASTORIA MAP</div>
            <h1 style={titleStyle}>アストリアの街</h1>
          </div>
          <p style={hintStyle}>施設をタップして、会話や導線を確認できます。</p>
        </header>

        <div style={mapStyle}>
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              onClick={() => handleHotspot(spot.id)}
              disabled={isMoving}
              title={`${spot.label}: ${spot.subLabel}`}
              style={{
                ...hotspotStyle,
                ...(isMoving ? hotspotDisabledStyle : null),
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${spot.w}%`,
                height: `${spot.h}%`,
              }}
            >
              <span
                style={{
                  ...hotspotLabelStyle,
                  left: `${((spot.labelX - spot.x) / spot.w) * 100}%`,
                  top: `${((spot.labelY - spot.y) / spot.h) * 100}%`,
                }}
              >
                {spot.label}
              </span>
              <span style={hotspotSubLabelStyle}>{spot.subLabel}</span>
            </button>
          ))}

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
        </div>
      </div>

      {dialog && (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <button onClick={() => setActiveDialog(null)} style={closeButtonStyle}>
              閉じる
            </button>

            <div style={dialogEyebrowStyle}>{dialog.title}</div>
            <div style={dialogContentStyle}>
              {dialog.portraitUrl && !failedPortraits.has(dialog.portraitUrl) ? (
                <img
                  src={dialog.portraitUrl}
                  alt={dialog.portraitAlt ?? dialog.speaker ?? dialog.title}
                  style={dialogPortraitStyle}
                  onError={() => {
                    setFailedPortraits((current) => new Set(current).add(dialog.portraitUrl!));
                  }}
                />
              ) : null}

              <div style={dialogTextColumnStyle}>
                {dialog.speaker ? <div style={speakerStyle}>{dialog.speaker}</div> : null}
                <div style={dialogTextStyle}>{dialog.text}</div>
              </div>
            </div>

            {dialog.actionLabel ? (
              <button
                disabled={!dialog.actionUrl}
                onClick={() => {
                  if (dialog.actionUrl) openExternal(dialog.actionUrl);
                }}
                style={actionButtonStyle(!!dialog.actionUrl)}
                title={dialog.disabledReason ?? dialog.actionLabel}
              >
                {dialog.actionLabel}
              </button>
            ) : null}

            {dialog.disabledReason ? <div style={disabledNoteStyle}>{dialog.disabledReason}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: 14,
  color: "#fff6df",
  background:
    "radial-gradient(circle at 22% 12%, rgba(255,207,112,0.18), transparent 28%), radial-gradient(circle at 78% 8%, rgba(113,169,255,0.14), transparent 26%), linear-gradient(180deg, #1c2430 0%, #181513 54%, #0e1118 100%)",
  display: "grid",
  placeItems: "center",
};

const shellStyle: CSSProperties = {
  width: "min(900px, 100%)",
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

const hintStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,246,223,0.84)",
  fontSize: 13,
  lineHeight: 1.5,
};

const mapStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, calc(78dvh * 941 / 1672))",
  minWidth: "min(100%, 320px)",
  aspectRatio: "941 / 1672",
  minHeight: 0,
  maxHeight: "78dvh",
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 18,
  border: "1px solid rgba(255,229,172,0.25)",
  background:
    `linear-gradient(180deg, rgba(10,12,18,0.08), rgba(20,14,10,0.16)), url(${ASTORIA_MAP_IMAGE_URL}), linear-gradient(180deg, rgba(78,101,122,0.86), rgba(49,56,54,0.78) 38%, rgba(42,33,24,0.92) 100%)`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  boxShadow: "0 22px 60px rgba(0,0,0,0.48), inset 0 0 62px rgba(0,0,0,0.28)",
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

const hotspotDisabledStyle: CSSProperties = {
  opacity: 0.68,
  cursor: "default",
};

const hotspotLabelStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  minWidth: 72,
  maxWidth: 112,
  minHeight: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  boxSizing: "border-box",
  borderRadius: 999,
  border: "1px solid rgba(255,225,149,0.78)",
  background: "linear-gradient(180deg, rgba(58,39,25,0.82), rgba(23,17,14,0.72))",
  color: "#fff1cc",
  boxShadow: "0 8px 18px rgba(0,0,0,0.26), 0 0 12px rgba(255,214,109,0.18)",
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

const rokuSpriteStyle: CSSProperties = {
  position: "absolute",
  width: ROKU_PLAYER_SIZE,
  height: SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE,
  marginLeft: -ROKU_PLAYER_SIZE / 2,
  marginTop: -(SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE),
  zIndex: 12,
  backgroundRepeat: "no-repeat",
  backgroundSize: `${1536 * ROKU_SPRITE_SCALE}px ${1872 * ROKU_SPRITE_SCALE}px`,
  filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.45))",
  pointerEvents: "none",
  transition: `left ${ROKU_MOVE_MS}ms ease-in-out, top ${ROKU_MOVE_MS}ms ease-in-out`,
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 14000,
  display: "grid",
  placeItems: "center",
  padding: 14,
  boxSizing: "border-box",
  background: "rgba(5,5,8,0.62)",
  backdropFilter: "blur(2px)",
};

const dialogStyle: CSSProperties = {
  position: "relative",
  width: "min(560px, calc(100% - 10px))",
  padding: "24px 22px 20px",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,216,102,0.54)",
  background: "linear-gradient(180deg, rgba(39,27,20,0.97), rgba(17,14,15,0.97))",
  boxShadow: "0 24px 58px rgba(0,0,0,0.58), inset 0 0 34px rgba(255,198,86,0.08)",
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,232,180,0.28)",
  background: "rgba(255,241,204,0.12)",
  color: "#fff1cc",
  fontWeight: 900,
};

const dialogEyebrowStyle: CSSProperties = {
  color: "rgba(255,232,180,0.78)",
  fontSize: 12,
  fontWeight: 950,
};

const dialogContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  marginTop: 10,
  flexWrap: "wrap",
};

const dialogPortraitStyle: CSSProperties = {
  width: "clamp(104px, 28vw, 154px)",
  maxHeight: 190,
  objectFit: "contain",
  borderRadius: 16,
  border: "1px solid rgba(255,232,180,0.3)",
  background: "rgba(255,241,204,0.08)",
  boxShadow: "0 12px 26px rgba(0,0,0,0.34)",
};

const dialogTextColumnStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 260px",
};

const speakerStyle: CSSProperties = {
  color: "#ffd66d",
  fontSize: 24,
  lineHeight: 1.1,
  fontWeight: 950,
};

const dialogTextStyle: CSSProperties = {
  marginTop: 16,
  color: "#fff6df",
  fontSize: 16,
  lineHeight: 1.75,
  whiteSpace: "pre-line",
};

function actionButtonStyle(enabled: boolean): CSSProperties {
  return {
    marginTop: 18,
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: enabled ? "1px solid rgba(255,216,102,0.82)" : "1px solid rgba(255,232,180,0.22)",
    background: enabled
      ? "linear-gradient(180deg, #ffd66d, #c5872d)"
      : "linear-gradient(180deg, rgba(68,45,31,0.66), rgba(26,20,18,0.86))",
    color: enabled ? "#2a1a0d" : "rgba(255,241,204,0.64)",
    fontWeight: 950,
    opacity: enabled ? 1 : 0.62,
    touchAction: "manipulation",
  };
}

const disabledNoteStyle: CSSProperties = {
  marginTop: 10,
  color: "rgba(255,232,180,0.74)",
  fontSize: 12,
  lineHeight: 1.5,
};
