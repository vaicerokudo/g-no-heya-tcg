import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import playerSpriteSheet from "../assets/pets/roku/spritesheet.webp";
import guildLobby from "../assets/town/guild-lobby.png";
import reception7171 from "../assets/town/reception-7171.png";
import { COMIC_SKIN_ID, TRAVEL_SKIN_ID, unlockSkin } from "../assets/skinUnlocks";
import type { UnitDef } from "../game/types";
import { CollectionDialog } from "./Town/CollectionDialog";

type TownSceneProps = {
  onEnterTcg: () => void;
  onExitToMap?: () => void;
  onSkinUnlocked?: () => void;
  unitsById: Record<string, UnitDef>;
};

type Pos = { x: number; y: number };
type InteractionArea = { x: number; y: number; w: number; h: number };
type InteractionTarget = "table" | "reception" | "collection" | "myououRoom" | null;
type TownDialog = "reception" | "collection" | "myououRoom" | null;
type ReceptionTopic = "home" | "first" | "table" | "skin" | "password";
type Facing = "left" | "right";
type SpriteState = "idle" | "running-left" | "running-right";
type TownHotspotId = Exclude<InteractionTarget, null>;
type TownHotspot = {
  id: TownHotspotId;
  label: string;
  subLabel: string;
  area: InteractionArea;
  labelX: number;
  labelY: number;
  targetX: number;
  targetY: number;
};

type PassphraseUnlock = {
  skinId: typeof COMIC_SKIN_ID | typeof TRAVEL_SKIN_ID;
  unlockedMessage: string;
  alreadyUnlockedMessage: string;
};

const PASSPHRASE_UNLOCKS: Record<string, PassphraseUnlock> = {
  "\u30b5\u30a6\u30f3\u30c9\u30b3\u30df\u30c3\u30af": {
    skinId: COMIC_SKIN_ID,
    unlockedMessage:
      "\u2026\u2026\u5408\u3063\u3066\u308b\u306b\u3083\u3002\n\u30b5\u30a6\u30f3\u30c9\u30b3\u30df\u30c3\u30af\u3001\u89e3\u653e\u3057\u3066\u304a\u304f\u306b\u3083\u3002\n\u4e0a\u306e\u30b9\u30ad\u30f3\u9078\u629e\u304b\u3089\u4f7f\u3048\u308b\u3088\u3046\u306b\u306a\u3063\u305f\u306b\u3083\u3002",
    alreadyUnlockedMessage:
      "\u305d\u308c\u306f\u3082\u3046\u89e3\u653e\u6e08\u307f\u306b\u3083\u3002\n\u4e0a\u306e\u30b9\u30ad\u30f3\u9078\u629e\u304b\u3089\u3001\u3044\u3064\u3067\u3082\u9078\u3079\u308b\u306b\u3083\u3002",
  },
  "\u30a2\u30b9\u30c8\u30ea\u30a2": {
    skinId: TRAVEL_SKIN_ID,
    unlockedMessage:
      "\u2026\u2026\u30a2\u30b9\u30c8\u30ea\u30a2\u3002\n\u305d\u306e\u540d\u3092\u77e5\u3063\u3066\u308b\u306a\u3089\u3001\u901a\u3057\u3066\u3082\u3044\u3044\u306b\u3083\u3002\n\u65c5\u88c5\u3001\u89e3\u653e\u3057\u3066\u304a\u304f\u306b\u3083\u3002\n\u4e0a\u306e\u30b9\u30ad\u30f3\u9078\u629e\u304b\u3089\u4f7f\u3048\u308b\u306b\u3083\u3002",
    alreadyUnlockedMessage:
      "\u30a2\u30b9\u30c8\u30ea\u30a2\u306e\u8a31\u53ef\u306f\u3001\u3082\u3046\u51fa\u3066\u308b\u306b\u3083\u3002\n\u65c5\u88c5\u306f\u3044\u3064\u3067\u3082\u9078\u3079\u308b\u306b\u3083\u3002",
  },
};
const PASSWORD_DIALOG = {
  label: "合言葉を伝える",
  text: "合言葉を言うにゃ。\n……間違えても怒らないにゃ。",
};
const PLAYER_WIDTH = 68;
const PLAYER_HEIGHT = 74;
const STEP = 18;
const TABLE = { x: 74, y: 60, w: 20, h: 20 };
const RECEPTION = { x: 47, y: 50, w: 16, h: 10 };
const COLLECTION = { x: 11, y: 35, w: 21, h: 27 };
const MYOUOU_ROOM = { x: 78, y: 19, w: 16, h: 22 };
const TOWN_HOTSPOTS: TownHotspot[] = [
  {
    id: "reception",
    label: "受付",
    subLabel: "7171",
    area: RECEPTION,
    labelX: 55,
    labelY: 47,
    targetX: 55,
    targetY: 60,
  },
  {
    id: "table",
    label: "対戦台",
    subLabel: "試練の盤",
    area: TABLE,
    labelX: 84,
    labelY: 58,
    targetX: 81,
    targetY: 72,
  },
  {
    id: "collection",
    label: "カード図鑑",
    subLabel: "見る",
    area: COLLECTION,
    labelX: 21,
    labelY: 32,
    targetX: 30,
    targetY: 54,
  },
  {
    id: "myououRoom",
    label: "明王の部屋",
    subLabel: "ヒント",
    area: MYOUOU_ROOM,
    labelX: 86,
    labelY: 17,
    targetX: 78,
    targetY: 36,
  },
];
const MYOUOU_ROOM_IMAGE = "/characters/myouou-room.png";
const INTERACTION_THRESHOLD = 4;
const RECEPTION_INTERACTION_THRESHOLD = 2.5;
const SPRITE_CELL_WIDTH = 192;
const SPRITE_CELL_HEIGHT = 208;
const PLAYER_SCALE = PLAYER_WIDTH / SPRITE_CELL_WIDTH;
const MOVE_ANIMATION_MS = 180;
const HOTSPOT_MOVE_MS = 680;
const SPRITE_ANIMS: Record<SpriteState, { row: number; frames: number; intervalMs: number }> = {
  idle: { row: 0, frames: 6, intervalMs: 190 },
  "running-right": { row: 1, frames: 8, intervalMs: 105 },
  "running-left": { row: 2, frames: 8, intervalMs: 105 },
};
const RECEPTION_DIALOG: Record<Exclude<ReceptionTopic, "password">, { label: string; text: string }> = {
  home: {
    label: "案内",
    text: "ようこそ、Gの部屋へにゃ。聞きたいことを選ぶにゃ。",
  },
  first: {
    label: "はじめての説明",
    text: "ここはGの部屋ロビーにゃ。まずは対戦台に近づいて、試練の盤を始めるにゃ。",
  },
  table: {
    label: "対戦台について",
    text: "光っている対戦台からTCGを始められるにゃ。Enterか対戦ボタンで入れるにゃ。",
  },
  skin: {
    label: "スキンについて",
    text: "スキンは見た目だけ変わるにゃ。強さは変わらないから安心するにゃ。",
  },
};
const RECEPTION_CHOICES: ReceptionTopic[] = ["first", "table", "skin", "password"];
const MYOUOU_ROOM_HINTS = [
  "ふははは、よく来たのう。\nここは、少し先の道を覗く部屋じゃ。\n\n合言葉を探しておるなら、\n街の外と、物語の記録をよく見ることじゃな。",
  "アストリアの名を知る者には、旅装が似合う。\n記録を追う者には、サウンドコミックの扉が開くじゃろう。",
];

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

export function TownScene({ onEnterTcg, onExitToMap, onSkinUnlocked, unitsById }: TownSceneProps) {
  const [pos, setPos] = useState<Pos>({ x: 44, y: 68 });
  const [activeDialog, setActiveDialog] = useState<TownDialog>(null);
  const [receptionTopic, setReceptionTopic] = useState<ReceptionTopic>("home");
  const [passphraseInput, setPassphraseInput] = useState("");
  const [passphraseMessage, setPassphraseMessage] = useState("");
  const [facing, setFacing] = useState<Facing>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [isHotspotMoving, setIsHotspotMoving] = useState(false);
  const [moveTransitionMs, setMoveTransitionMs] = useState(140);
  const [frameIndex, setFrameIndex] = useState(0);
  const moveStopTimerRef = useRef<number | null>(null);
  const hotspotMoveTimerRef = useRef<number | null>(null);
  const nearTable = useMemo(() => isNearArea(pos, TABLE), [pos]);
  const nearReception = useMemo(() => isNearArea(pos, RECEPTION, RECEPTION_INTERACTION_THRESHOLD), [pos]);
  const nearCollection = useMemo(() => isNearArea(pos, COLLECTION), [pos]);
  const nearMyououRoom = useMemo(() => isNearArea(pos, MYOUOU_ROOM), [pos]);
  const interactionTarget: InteractionTarget = nearReception
    ? "reception"
    : nearCollection
      ? "collection"
      : nearMyououRoom
        ? "myououRoom"
        : nearTable
          ? "table"
          : null;

  const performTownAction = (target: TownHotspotId) => {
    if (target === "reception") {
      setReceptionTopic("home");
      setPassphraseInput("");
      setPassphraseMessage("");
      setActiveDialog("reception");
    } else if (target === "collection") {
      setActiveDialog("collection");
    } else if (target === "myououRoom") {
      setActiveDialog("myououRoom");
    } else if (target === "table") {
      onEnterTcg();
    }
  };

  const handleInteract = () => {
    if (!interactionTarget || isHotspotMoving) return;
    performTownAction(interactionTarget);
  };

  const handleHotspotClick = (spot: TownHotspot) => {
    if (isHotspotMoving) return;

    setActiveDialog(null);
    setFacing(spot.targetX < pos.x ? "left" : "right");
    setMoveTransitionMs(HOTSPOT_MOVE_MS);
    setIsMoving(true);
    setIsHotspotMoving(true);
    setPos({ x: spot.targetX, y: spot.targetY });

    if (moveStopTimerRef.current !== null) {
      window.clearTimeout(moveStopTimerRef.current);
      moveStopTimerRef.current = null;
    }
    if (hotspotMoveTimerRef.current !== null) {
      window.clearTimeout(hotspotMoveTimerRef.current);
    }
    hotspotMoveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      setIsHotspotMoving(false);
      setMoveTransitionMs(140);
      hotspotMoveTimerRef.current = null;
      performTownAction(spot.id);
    }, HOTSPOT_MOVE_MS);
  };

  const handlePassphraseSubmit = () => {
    const passphrase = passphraseInput.trim();
    const unlockConfig = PASSPHRASE_UNLOCKS[passphrase];
    if (!unlockConfig) {
      setPassphraseMessage("\u9055\u3046\u306b\u3083\u3002\n\u2026\u2026\u3067\u3082\u3001\u8fd1\u3044\u6c17\u914d\u306f\u3057\u305f\u306b\u3083\u3002");
      return;
    }

    const unlockResult = unlockSkin(unlockConfig.skinId);
    if (unlockResult === "already-unlocked") {
      onSkinUnlocked?.();
      setPassphraseMessage(unlockConfig.alreadyUnlockedMessage);
      return;
    }

    onSkinUnlocked?.();
    setPassphraseMessage(unlockConfig.unlockedMessage);
  };

  const moveBy = (dx: number, dy: number) => {
    if (isHotspotMoving) return;
    if (dx < 0) setFacing("left");
    if (dx > 0) setFacing("right");
    setMoveTransitionMs(140);
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
  }, [interactionTarget, isHotspotMoving, onEnterTcg]);

  useEffect(() => {
    return () => {
      if (moveStopTimerRef.current !== null) {
        window.clearTimeout(moveStopTimerRef.current);
      }
      if (hotspotMoveTimerRef.current !== null) {
        window.clearTimeout(hotspotMoveTimerRef.current);
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
    interactionTarget === "reception"
      ? "話す"
      : interactionTarget === "collection"
        ? "見る"
        : interactionTarget === "table"
          ? "対戦"
          : "移動";
  const receptionDialog = receptionTopic === "password" ? PASSWORD_DIALOG : RECEPTION_DIALOG[receptionTopic];

  return (
    <div style={sceneStyle}>
      <div style={{ width: "min(760px, 100%)" }}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>GUILD LOBBY</div>
            <h2 style={titleStyle}>Gの部屋ロビー</h2>
          </div>
          <div style={hintStyle}>看板をタップすると、ロクがそこまで歩きます。</div>
          {onExitToMap ? (
            <button onClick={onExitToMap} style={mapBackButtonStyle}>
              アストリアMAPへ
            </button>
          ) : null}
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

          <div
            style={{
              ...collectionBoardStyle,
              left: `${COLLECTION.x}%`,
              top: `${COLLECTION.y}%`,
              width: `${COLLECTION.w}%`,
              height: `${COLLECTION.h}%`,
              border: nearCollection
                ? "2px solid rgba(255, 221, 128, 0.96)"
                : "1px solid rgba(255, 232, 180, 0.32)",
              boxShadow: nearCollection
                ? "0 0 0 5px rgba(255, 204, 90, 0.18), 0 0 28px rgba(255, 190, 72, 0.28), 0 14px 28px rgba(0,0,0,0.34)"
                : "0 12px 24px rgba(0,0,0,0.32)",
            }}
          >
            <div style={collectionTitleStyle}>カード図鑑</div>
            <div style={collectionGridStyle}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} style={collectionCardSlotStyle} />
              ))}
            </div>
          </div>

          {TOWN_HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleHotspotClick(spot)}
              disabled={isHotspotMoving}
              title={`${spot.label}: ${spot.subLabel}`}
              style={{
                ...townHotspotStyle,
                ...(isHotspotMoving ? townHotspotDisabledStyle : null),
                left: `${spot.area.x}%`,
                top: `${spot.area.y}%`,
                width: `${spot.area.w}%`,
                height: `${spot.area.h}%`,
              }}
            >
              <span
                style={{
                  ...townHotspotLabelStyle,
                  left: `${((spot.labelX - spot.area.x) / spot.area.w) * 100}%`,
                  top: `${((spot.labelY - spot.area.y) / spot.area.h) * 100}%`,
                }}
              >
                {spot.label}
              </span>
              <span style={townHotspotSubLabelStyle}>{spot.subLabel}</span>
            </button>
          ))}

          {interactionTarget && (
            <div style={promptStyle}>
              {interactionTarget === "reception" ? (
                <>
                  <strong>受付：7171に話しかける</strong>
                  <span>Enter または「話す」ボタン</span>
                </>
              ) : interactionTarget === "collection" ? (
                <>
                  <strong>カード図鑑</strong>
                  <span>Enter または「見る」ボタンで確認</span>
                </>
              ) : interactionTarget === "myououRoom" ? (
                <>
                  <strong>明王の部屋</strong>
                  <span>Enter または「入る」ボタンで話を聞く</span>
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
            <div style={dialogOverlayStyle}>
              <div style={dialogPanelStyle}>
              <img src={reception7171} alt="7171受付" style={dialogPortraitStyle} />
              <div style={dialogBodyStyle}>
                <div style={dialogNameStyle}>7171</div>
                <div style={dialogTopicStyle}>{receptionDialog.label}</div>
                <div style={dialogTextStyle}>{receptionDialog.text}</div>
                {receptionTopic === "password" && (
                  <form
                    style={passphraseFormStyle}
                    onSubmit={(event) => {
                      event.preventDefault();
                      handlePassphraseSubmit();
                    }}
                  >
                    <input
                      value={passphraseInput}
                      onChange={(event) => setPassphraseInput(event.target.value)}
                      placeholder="合言葉"
                      aria-label="合言葉"
                      style={passphraseInputStyle}
                    />
                    <button type="submit" style={passphraseSubmitButtonStyle}>
                      伝える
                    </button>
                    {passphraseMessage ? <div style={passphraseMessageStyle}>{passphraseMessage}</div> : null}
                  </form>
                )}
              </div>
              <button onClick={() => setActiveDialog(null)} style={dialogCloseButtonStyle}>
                閉じる
              </button>
              <div style={dialogChoicesStyle}>
                {RECEPTION_CHOICES.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setReceptionTopic(topic);
                      if (topic !== "password") {
                        setPassphraseMessage("");
                      }
                    }}
                    style={dialogChoiceButtonStyle(topic === receptionTopic)}
                  >
                    {topic === "password" ? PASSWORD_DIALOG.label : RECEPTION_DIALOG[topic].label}
                  </button>
                ))}
                <button onClick={() => setActiveDialog(null)} style={dialogChoiceButtonStyle(false)}>
                  閉じる
                </button>
              </div>
              </div>
            </div>
          )}

          {activeDialog === "collection" && (
            <CollectionDialog unitsById={unitsById} onClose={() => setActiveDialog(null)} />
          )}

          {activeDialog === "myououRoom" && (
            <div style={dialogOverlayStyle}>
              <div style={dialogPanelStyle}>
                <img
                  src={MYOUOU_ROOM_IMAGE}
                  alt="明王"
                  style={dialogPortraitStyle}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <div style={dialogBodyStyle}>
                  <div style={dialogNameStyle}>明王</div>
                  <div style={dialogTopicStyle}>明王の部屋</div>
                  <div style={dialogTextStyle}>{MYOUOU_ROOM_HINTS.join("\n\n")}</div>
                </div>
                <button onClick={() => setActiveDialog(null)} style={dialogCloseButtonStyle}>
                  閉じる
                </button>
              </div>
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
              transition: `left ${moveTransitionMs}ms ease, top ${moveTransitionMs}ms ease`,
              filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.48))",
              userSelect: "none",
              zIndex: 8,
            }}
          />
        </div>

        <div style={controlsWrapStyle}>
          <div />
          <button aria-label="上へ移動" disabled={isHotspotMoving} onClick={() => moveBy(0, -STEP)} style={padButtonStyle}>
            ↑
          </button>
          <div />
          <button aria-label="左へ移動" disabled={isHotspotMoving} onClick={() => moveBy(-STEP, 0)} style={padButtonStyle}>
            ←
          </button>
          <button
            onClick={handleInteract}
            disabled={!interactionTarget || isHotspotMoving}
            style={battleButtonStyle(!!interactionTarget && !isHotspotMoving)}
          >
            {interactionTarget === "myououRoom" ? "入る" : interactionButtonLabel}
          </button>
          <button aria-label="右へ移動" disabled={isHotspotMoving} onClick={() => moveBy(STEP, 0)} style={padButtonStyle}>
            →
          </button>
          <div />
          <button aria-label="下へ移動" disabled={isHotspotMoving} onClick={() => moveBy(0, STEP)} style={padButtonStyle}>
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

const mapBackButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 11,
  border: "1px solid rgba(255,232,180,0.32)",
  background: "rgba(255,241,204,0.12)",
  color: "#fff1cc",
  fontWeight: 900,
  touchAction: "manipulation",
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

const collectionBoardStyle: CSSProperties = {
  position: "absolute",
  borderRadius: 14,
  padding: "8px 9px",
  boxSizing: "border-box",
  background: "linear-gradient(180deg, rgba(97,61,34,0.92), rgba(38,25,17,0.92))",
  display: "grid",
  gridTemplateRows: "auto 1fr",
  gap: 6,
  zIndex: 4,
};

const collectionTitleStyle: CSSProperties = {
  color: "#fff1cc",
  fontSize: 12,
  fontWeight: 950,
  textAlign: "center",
  textShadow: "0 2px 8px rgba(0,0,0,0.55)",
};

const collectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 4,
  minHeight: 0,
};

const collectionCardSlotStyle: CSSProperties = {
  minHeight: 18,
  borderRadius: 4,
  border: "1px solid rgba(255, 232, 180, 0.38)",
  background:
    "linear-gradient(180deg, rgba(255,241,204,0.18), rgba(0,0,0,0.18)), radial-gradient(circle at 50% 22%, rgba(255,216,102,0.22), transparent 56%)",
  boxShadow: "inset 0 0 10px rgba(0,0,0,0.22)",
};

const townHotspotStyle: CSSProperties = {
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#fff1cc",
  zIndex: 5,
  cursor: "pointer",
  touchAction: "manipulation",
};

const townHotspotDisabledStyle: CSSProperties = {
  opacity: 0.64,
  cursor: "default",
};

const townHotspotLabelStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  minWidth: 72,
  minHeight: 34,
  maxWidth: 118,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  boxSizing: "border-box",
  borderRadius: 999,
  border: "1px solid rgba(255,225,149,0.78)",
  background: "linear-gradient(180deg, rgba(58,39,25,0.82), rgba(23,17,14,0.72))",
  boxShadow: "0 8px 18px rgba(0,0,0,0.26), 0 0 12px rgba(255,214,109,0.18)",
  fontSize: 13,
  fontWeight: 950,
  lineHeight: 1.1,
  textAlign: "center",
  textShadow: "0 2px 8px rgba(0,0,0,0.62)",
};

const townHotspotSubLabelStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
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

const dialogOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 12000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: "clamp(12px, 3dvh, 24px) 10px",
  background: "rgba(6, 5, 5, 0.62)",
  backdropFilter: "blur(2px)",
};

const dialogPanelStyle: CSSProperties = {
  position: "relative",
  width: "min(860px, calc(100% - 20px))",
  maxHeight: "calc(100dvh - 24px)",
  overflowY: "auto",
  boxSizing: "border-box",
  padding: "22px 24px",
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(38,25,17,0.96), rgba(17,13,12,0.96))",
  border: "1px solid rgba(255,216,102,0.58)",
  boxShadow: "0 24px 58px rgba(0,0,0,0.58), inset 0 0 34px rgba(255,198,86,0.08)",
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
  alignItems: "stretch",
  justifyContent: "center",
};

const dialogPortraitStyle: CSSProperties = {
  flex: "0 1 300px",
  width: "clamp(220px, 56vw, 300px)",
  height: "clamp(280px, 56dvh, 420px)",
  maxWidth: "100%",
  objectFit: "contain",
  objectPosition: "center",
  borderRadius: 18,
  border: "1px solid rgba(255,232,180,0.42)",
  boxShadow: "0 14px 32px rgba(0,0,0,0.44)",
};

const dialogBodyStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 300px",
  padding: "4px 0 0",
};

const dialogNameStyle: CSSProperties = {
  color: "#ffd66d",
  fontWeight: 950,
  fontSize: 24,
  lineHeight: 1.1,
};

const dialogTopicStyle: CSSProperties = {
  marginTop: 8,
  color: "rgba(255,232,180,0.78)",
  fontSize: 13,
  fontWeight: 900,
};

const dialogTextStyle: CSSProperties = {
  marginTop: 14,
  color: "#fff6df",
  fontSize: 17,
  lineHeight: 1.75,
  whiteSpace: "pre-line",
};

const passphraseFormStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center",
};

const passphraseInputStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 42,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.36)",
  background: "rgba(255,246,223,0.12)",
  color: "#fff6df",
  fontSize: 16,
  fontWeight: 800,
  outline: "none",
};

const passphraseSubmitButtonStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,216,102,0.82)",
  background: "linear-gradient(180deg, #ffd66d, #c5872d)",
  color: "#2a1a0d",
  fontSize: 13,
  fontWeight: 950,
  touchAction: "manipulation",
};

const passphraseMessageStyle: CSSProperties = {
  gridColumn: "1 / -1",
  color: "#ffe2a3",
  fontSize: 14,
  lineHeight: 1.55,
  whiteSpace: "pre-line",
};

const dialogCloseButtonStyle: CSSProperties = {
  position: "absolute",
  right: 14,
  top: 14,
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.28)",
  background: "rgba(255,241,204,0.14)",
  color: "#fff1cc",
  fontWeight: 900,
  touchAction: "manipulation",
};

const dialogChoicesStyle: CSSProperties = {
  flex: "1 0 100%",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 4,
};

function dialogChoiceButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: active
      ? "1px solid rgba(255,216,102,0.9)"
      : "1px solid rgba(255,232,180,0.24)",
    background: active ? "rgba(255,216,102,0.24)" : "rgba(255,241,204,0.1)",
    color: "#fff1cc",
    boxShadow: active ? "0 0 14px rgba(255,204,90,0.18)" : "none",
    fontSize: 13,
    fontWeight: 900,
    touchAction: "manipulation",
  };
}

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
