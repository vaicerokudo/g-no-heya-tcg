import { useEffect, useRef, useState, type CSSProperties } from "react";
import rokuSpriteSheet from "../assets/pets/roku/spritesheet.webp";
import { addDeltaMachinePart, getDeltaMachineParts } from "../game/delta/progress";
import type { ScenarioId } from "../game/scenario/scenarios";

type DeltaMapSceneProps = {
  onReturnContinent: () => void;
  onStartScenario: (scenarioId: ScenarioId) => void;
  clearedScenarioIds: ScenarioId[];
};

type DeltaAreaId = "entrance" | "control" | "archive" | "quarantine";
type DeltaMoveTargetId = DeltaAreaId | "part2";
type MapPos = { x: number; y: number };
type Facing = "left" | "right";
type SpriteState = "idle" | "running-left" | "running-right";

type DeltaArea = {
  id: DeltaAreaId;
  label: string;
  subLabel: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const AREAS: DeltaArea[] = [
  { id: "control", label: "管制室", subLabel: "シナリオ選択予定", icon: "CTRL", x: 35, y: 10, w: 30, h: 10 },
  { id: "archive", label: "資料室", subLabel: "完成図パズル", icon: "DATA", x: 9, y: 44, w: 26, h: 11 },
  { id: "quarantine", label: "隔離ゲート", subLabel: "ロック中", icon: "LOCK", x: 65, y: 44, w: 26, h: 11 },
  { id: "entrance", label: "入口", subLabel: "大陸MAPへ戻る", icon: "EXIT", x: 38, y: 84, w: 24, h: 9 },
];

const ROKU_PLAYER_SIZE = 34;
const ROKU_MOVE_MS = 620;
const SPRITE_CELL_WIDTH = 192;
const SPRITE_CELL_HEIGHT = 208;
const ROKU_SPRITE_SCALE = ROKU_PLAYER_SIZE / SPRITE_CELL_WIDTH;
const SPRITE_ANIMS: Record<SpriteState, { row: number; frames: number; intervalMs: number }> = {
  idle: { row: 0, frames: 6, intervalMs: 190 },
  "running-right": { row: 1, frames: 8, intervalMs: 105 },
  "running-left": { row: 2, frames: 8, intervalMs: 105 },
};

const DELTA_TARGET_POSITIONS: Record<DeltaMoveTargetId, MapPos> = {
  entrance: { x: 50, y: 87 },
  control: { x: 50, y: 22 },
  archive: { x: 22, y: 56 },
  quarantine: { x: 78, y: 56 },
  part2: { x: 86, y: 83 },
};

export function DeltaMapScene({ onReturnContinent, onStartScenario, clearedScenarioIds }: DeltaMapSceneProps) {
  const [activeArea, setActiveArea] = useState<DeltaAreaId | null>(null);
  const [machineParts, setMachineParts] = useState<number[]>(() => getDeltaMachineParts());
  const [partNotice, setPartNotice] = useState<string | null>(null);
  const [rokuPos, setRokuPos] = useState<MapPos>(DELTA_TARGET_POSITIONS.entrance);
  const [facing, setFacing] = useState<Facing>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const moveTimerRef = useRef<number | null>(null);
  const collectedPartIds = new Set(machineParts);
  const collectedPartCount = machineParts.length;
  const machineComplete = collectedPartCount === 9;
  const hasPart2 = collectedPartIds.has(2);
  const scenario9Unlocked = clearedScenarioIds.includes("scenario8");

  const runAfterRokuMove = (targetId: DeltaMoveTargetId, action: () => void) => {
    if (isMoving) return;

    const nextPos = DELTA_TARGET_POSITIONS[targetId];
    setActiveArea(null);
    setPartNotice(null);
    setFacing(nextPos.x < rokuPos.x ? "left" : "right");
    setIsMoving(true);
    setRokuPos(nextPos);

    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
    }
    moveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveTimerRef.current = null;
      action();
    }, ROKU_MOVE_MS);
  };

  const openArea = (areaId: DeltaAreaId) => {
    if (areaId === "entrance") {
      onReturnContinent();
      return;
    }

    setActiveArea(areaId);
  };

  const inspectPart2Point = () => {
    if (machineParts.includes(2)) {
      setPartNotice("このデータ片は回収済みです。");
      return;
    }

    const nextParts = addDeltaMachinePart(2);
    setMachineParts(nextParts);
    setPartNotice("メタルマシーン完成図の欠片を見つけた。完成図パーツ 2 を入手した。");
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
            <div style={eyebrowStyle}>DELTA FACILITY</div>
            <h1 style={titleStyle}>研究施設デルタ</h1>
            <p style={leadStyle}>地下区画の管制端末から、次章の調査準備を進められます。</p>
          </div>
          <button type="button" onClick={onReturnContinent} style={returnButtonStyle}>
            大陸MAPへ
          </button>
        </header>

        <div style={mapFrameStyle}>
          <div style={scanlineStyle} />
          <div style={facilityCoreStyle}>
            <div style={coreTitleStyle}>DELTA CORE</div>
            <div style={coreStatusStyle}>STANDBY</div>
          </div>
          <div style={walkwayVerticalStyle} />
          <div style={walkwayHorizontalStyle} />
          <div style={nodeTopStyle} />
          <div style={nodeBottomStyle} />

          {AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => runAfterRokuMove(area.id, () => openArea(area.id))}
              disabled={isMoving}
              title={`${area.label}: ${area.subLabel}`}
              style={{
                ...areaButtonStyle(area.id, machineComplete),
                ...(isMoving ? deltaActionDisabledStyle : null),
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.w}%`,
                height: `${area.h}%`,
              }}
            >
              <span style={areaIconStyle(area.id, machineComplete)}>
                {area.id === "quarantine" ? (machineComplete ? "OPEN" : area.icon) : area.icon}
              </span>
              <span style={areaTextStyle}>
                <span style={areaLabelStyle}>{area.label}</span>
                <span style={areaSubLabelStyle}>
                  {area.id === "archive"
                    ? `完成図パーツ ${collectedPartCount} / 9`
                    : area.id === "quarantine"
                      ? machineComplete
                        ? "ロック解除"
                        : "9パーツ必要"
                      : area.subLabel}
                </span>
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => runAfterRokuMove("part2", inspectPart2Point)}
            disabled={isMoving}
            title={hasPart2 ? "完成図パーツ 2 取得済み" : "小さなデータ片"}
            style={{
              ...part2PointStyle(hasPart2),
              ...(isMoving ? deltaActionDisabledStyle : null),
            }}
          >
            <span style={part2GlowStyle(hasPart2)} />
            <img src="/ui/delta-machine/map_part_fragment.png" alt="" style={part2ImageStyle(hasPart2)} />
            <span style={part2LabelStyle}>{hasPart2 ? "取得済み" : "反応あり"}</span>
          </button>

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

          {partNotice ? <div style={partNoticeStyle}>{partNotice}</div> : null}
        </div>
      </div>

      {activeArea ? (
        <div style={overlayStyle}>
          <div style={dialogStyle(activeArea, machineComplete)}>
            <div style={dialogEyebrowStyle}>{getAreaTitle(activeArea)}</div>
            <div style={dialogTitleStyle}>{getAreaDialogTitle(activeArea, machineComplete)}</div>
            {activeArea === "control" ? (
              <div style={scenarioListStyle}>
                <div style={scenarioEntryStyle}>
                  <div>
                    <div style={scenarioEntryTitleStyle}>第8話 厄介な訳解</div>
                    <div style={scenarioEntryTextStyle}>Deliがジーマを捕まえて、完成図パーツの手がかりを入手します。</div>
                  </div>
                  <button type="button" onClick={() => onStartScenario("scenario8")} style={scenarioStartButtonStyle}>
                    開始
                  </button>
                </div>
                <div style={scenarioEntryStyle}>
                  <div>
                    <div style={scenarioEntryTitleStyle}>第9話 誤起動</div>
                    <div style={scenarioEntryTextStyle}>
                      {scenario9Unlocked
                        ? "DeliとPlayerで、誤起動した試作ロボを制圧します。"
                        : "第8話クリアで解放"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartScenario("scenario9")}
                    style={{
                      ...scenarioStartButtonStyle,
                      opacity: scenario9Unlocked ? 1 : 0.52,
                      cursor: scenario9Unlocked ? "pointer" : "not-allowed",
                    }}
                    disabled={!scenario9Unlocked}
                  >
                    {scenario9Unlocked ? "開始" : "LOCK"}
                  </button>
                </div>
              </div>
            ) : null}
            {activeArea === "archive" ? (
              <>
                <div style={puzzleCaptionStyle}>メタルマシーン完成図パーツ {collectedPartCount} / 9</div>
                <div style={puzzleGridStyle} aria-label="メタルマシーン完成図パズル枠">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} style={puzzleSlotStyle(collectedPartIds.has(index + 1))}>
                      {collectedPartIds.has(index + 1) ? (
                        <img
                          src={`/ui/delta-machine/part_${index + 1}.png`}
                          alt={`Metal Machine blueprint part ${index + 1}`}
                          style={puzzlePartImageStyle}
                        />
                      ) : (
                        <span style={puzzleSlotNumberStyle(false)}>???</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <p style={dialogTextStyle}>{getAreaDialogText(activeArea, machineComplete)}</p>
            <button type="button" onClick={() => setActiveArea(null)} style={dialogButtonStyle(activeArea, machineComplete)}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getAreaTitle(areaId: DeltaAreaId) {
  if (areaId === "control") return "管制室";
  if (areaId === "archive") return "資料室";
  return "隔離ゲート";
}

function getAreaDialogTitle(areaId: DeltaAreaId, machineComplete: boolean) {
  if (areaId === "control") return "デルタ編シナリオ選択予定";
  if (areaId === "archive") return "メタルマシーン完成図";
  return machineComplete ? "ロック解除" : "ロック中";
}

function getAreaDialogText(areaId: DeltaAreaId, machineComplete: boolean) {
  if (areaId === "control") {
    return "管制室はまだ準備中です。ここからデルタ編の物語へ入る予定です。";
  }
  if (areaId === "archive") {
    return "資料室には9つの空枠があります。完成図の欠片を集める場所として、次工程以降で保存ロジックを追加します。";
  }
  if (machineComplete) {
    return "9パーツが揃い、隔離ゲートは起動可能になりました。ブラックノイズ戦はまだ準備中です。";
  }
  return "隔離ゲートは9パーツ完成後に開く予定です。奥にはBOSSブラックノイズの反応があります。";
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: "12px 10px 18px",
  color: "#eaf7ff",
  background:
    "radial-gradient(circle at 28% 12%, rgba(63,218,255,0.20), transparent 30%), radial-gradient(circle at 82% 20%, rgba(255,72,99,0.12), transparent 28%), linear-gradient(180deg, #07121b 0%, #0e1421 56%, #080a10 100%)",
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
  color: "#7de7ff",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: "2px 0 0",
  color: "#eaf7ff",
  fontSize: 26,
  textShadow: "0 2px 14px rgba(0,0,0,0.55)",
};

const leadStyle: CSSProperties = {
  margin: "6px 0 0",
  maxWidth: 430,
  color: "rgba(234,247,255,0.72)",
  fontSize: 13,
  lineHeight: 1.45,
};

const returnButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(125,231,255,0.38)",
  background: "rgba(9,24,34,0.82)",
  color: "#eaf7ff",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(125,231,255,0.10)",
};

const mapFrameStyle: CSSProperties = {
  position: "relative",
  width: "clamp(320px, 96vw, 640px)",
  maxWidth: "100%",
  aspectRatio: "9 / 16",
  minHeight: 0,
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 20,
  border: "1px solid rgba(125,231,255,0.30)",
  background:
    "linear-gradient(180deg, rgba(4,10,16,0.08), rgba(4,10,16,0.26)), url('/backgrounds/delta-facility-map.png') center / 100% 100% no-repeat, linear-gradient(180deg, rgba(12,31,43,0.98), rgba(11,16,28,0.98))",
  boxShadow: "0 22px 60px rgba(0,0,0,0.52), inset 0 0 62px rgba(64,211,255,0.13)",
};

const deltaActionDisabledStyle: CSSProperties = {
  opacity: 0.72,
  cursor: "wait",
};

const rokuSpriteStyle: CSSProperties = {
  position: "absolute",
  width: ROKU_PLAYER_SIZE,
  height: ROKU_PLAYER_SIZE * (SPRITE_CELL_HEIGHT / SPRITE_CELL_WIDTH),
  transform: "translate(-50%, -88%)",
  backgroundRepeat: "no-repeat",
  backgroundSize: `${SPRITE_CELL_WIDTH * ROKU_SPRITE_SCALE * 8}px ${SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE * 9}px`,
  imageRendering: "auto",
  filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.46)) drop-shadow(0 0 12px rgba(125,231,255,0.36))",
  transition: `left ${ROKU_MOVE_MS}ms ease, top ${ROKU_MOVE_MS}ms ease`,
  zIndex: 8,
  pointerEvents: "none",
};

const scanlineStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0 94%, rgba(125,231,255,0.06) 94% 100%), linear-gradient(90deg, rgba(255,255,255,0.03), transparent 32%, transparent 68%, rgba(255,255,255,0.025))",
  backgroundSize: "100% 18px, 100% 100%",
  pointerEvents: "none",
};

const facilityCoreStyle: CSSProperties = {
  position: "absolute",
  left: "31%",
  top: "35%",
  width: "38%",
  height: "23%",
  borderRadius: 18,
  border: "1px solid rgba(125,231,255,0.42)",
  background: "linear-gradient(180deg, rgba(30,67,86,0.88), rgba(11,22,34,0.92))",
  boxShadow: "inset 0 0 28px rgba(125,231,255,0.15), 0 12px 28px rgba(0,0,0,0.28)",
  display: "grid",
  placeItems: "center",
  opacity: 0.28,
  pointerEvents: "none",
};

const coreTitleStyle: CSSProperties = {
  color: "rgba(234,247,255,0.72)",
  fontSize: 12,
  fontWeight: 950,
};

const coreStatusStyle: CSSProperties = {
  position: "absolute",
  bottom: 14,
  minWidth: 82,
  minHeight: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(125,231,255,0.36)",
  color: "#7de7ff",
  fontSize: 11,
  fontWeight: 950,
  background: "rgba(7,18,27,0.78)",
};

const walkwayVerticalStyle: CSSProperties = {
  position: "absolute",
  left: "47%",
  top: "24%",
  width: "6%",
  height: "59%",
  borderRadius: 999,
  background: "linear-gradient(180deg, rgba(125,231,255,0.20), rgba(125,231,255,0.05))",
  opacity: 0.28,
  pointerEvents: "none",
};

const walkwayHorizontalStyle: CSSProperties = {
  position: "absolute",
  left: "19%",
  top: "48%",
  width: "62%",
  height: "5%",
  borderRadius: 999,
  background: "linear-gradient(90deg, rgba(125,231,255,0.07), rgba(125,231,255,0.22), rgba(125,231,255,0.07))",
  opacity: 0.28,
  pointerEvents: "none",
};

const nodeTopStyle: CSSProperties = {
  position: "absolute",
  left: "45%",
  top: "29%",
  width: "10%",
  height: "6%",
  borderRadius: 999,
  background: "rgba(125,231,255,0.16)",
  boxShadow: "0 0 24px rgba(125,231,255,0.18)",
  opacity: 0.28,
  pointerEvents: "none",
};

const nodeBottomStyle: CSSProperties = {
  position: "absolute",
  left: "45%",
  top: "70%",
  width: "10%",
  height: "6%",
  borderRadius: 999,
  background: "rgba(125,231,255,0.12)",
  boxShadow: "0 0 24px rgba(125,231,255,0.12)",
  opacity: 0.28,
  pointerEvents: "none",
};

function part2PointStyle(collected: boolean): CSSProperties {
  return {
    position: "absolute",
    right: "7%",
    bottom: "12%",
    width: "14%",
    minHeight: 34,
    borderRadius: 8,
    clipPath: "polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)",
    border: collected ? "1px solid rgba(125,231,255,0.24)" : "1px solid rgba(125,231,255,0.72)",
    background: collected
      ? "linear-gradient(135deg, rgba(7,18,27,0.56), rgba(16,38,50,0.46))"
      : "linear-gradient(135deg, rgba(13,45,61,0.78), rgba(8,17,29,0.68))",
    color: collected ? "rgba(234,247,255,0.56)" : "#eaf7ff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "2px 5px",
    boxSizing: "border-box",
    boxShadow: collected
      ? "inset 0 0 18px rgba(125,231,255,0.06)"
      : "0 0 26px rgba(125,231,255,0.34), inset 0 0 18px rgba(125,231,255,0.14)",
    backdropFilter: "blur(4px)",
    touchAction: "manipulation",
    cursor: "pointer",
  };
}

function part2GlowStyle(collected: boolean): CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: collected ? "rgba(125,231,255,0.38)" : "#7de7ff",
    boxShadow: collected ? "0 0 10px rgba(125,231,255,0.18)" : "0 0 18px rgba(125,231,255,0.86)",
    flex: "0 0 auto",
  };
}

function part2ImageStyle(collected: boolean): CSSProperties {
  return {
    width: 22,
    height: 22,
    objectFit: "contain",
    opacity: collected ? 0.42 : 0.96,
    filter: collected ? "grayscale(0.5)" : "drop-shadow(0 0 10px rgba(125,231,255,0.72))",
    flex: "0 0 auto",
  };
}

const part2LabelStyle: CSSProperties = {
  fontSize: 9,
  lineHeight: 1,
  fontWeight: 950,
};

const partNoticeStyle: CSSProperties = {
  position: "absolute",
  left: "8%",
  right: "8%",
  bottom: "7%",
  minHeight: 42,
  borderRadius: 10,
  border: "1px solid rgba(125,231,255,0.52)",
  background: "linear-gradient(135deg, rgba(7,18,27,0.90), rgba(15,40,54,0.82))",
  color: "#eaf7ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  boxSizing: "border-box",
  fontSize: 13,
  lineHeight: 1.45,
  fontWeight: 850,
  textAlign: "center",
  backdropFilter: "blur(5px)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.30), 0 0 22px rgba(125,231,255,0.20), inset 0 0 18px rgba(125,231,255,0.08)",
};

function areaButtonStyle(areaId: DeltaAreaId, machineComplete: boolean): CSSProperties {
  const locked = areaId === "quarantine" && !machineComplete;
  const archive = areaId === "archive";
  const entrance = areaId === "entrance";
  const openGate = areaId === "quarantine" && machineComplete;
  return {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
    padding: "6px 7px",
    borderRadius: 8,
    clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
    border: locked
      ? "1px solid rgba(255,93,93,0.72)"
      : archive
        ? "1px solid rgba(181,145,255,0.68)"
        : openGate
          ? "1px solid rgba(127,255,193,0.72)"
          : "1px solid rgba(125,231,255,0.70)",
    background: locked
      ? "linear-gradient(135deg, rgba(82,22,31,0.78), rgba(20,8,14,0.76)), linear-gradient(90deg, rgba(255,93,93,0.18), transparent 42%)"
      : archive
        ? "linear-gradient(135deg, rgba(43,35,82,0.76), rgba(10,17,31,0.74)), linear-gradient(90deg, rgba(181,145,255,0.16), transparent 48%)"
        : entrance
          ? "linear-gradient(135deg, rgba(53,71,84,0.72), rgba(12,24,34,0.74)), linear-gradient(90deg, rgba(234,247,255,0.12), transparent 45%)"
          : openGate
            ? "linear-gradient(135deg, rgba(25,82,59,0.78), rgba(8,25,21,0.76)), linear-gradient(90deg, rgba(127,255,193,0.18), transparent 45%)"
            : "linear-gradient(135deg, rgba(18,66,86,0.76), rgba(8,21,32,0.74)), linear-gradient(90deg, rgba(125,231,255,0.17), transparent 46%)",
    color: "#eaf7ff",
    boxShadow: locked
      ? "0 0 26px rgba(255,93,93,0.28), inset 0 0 24px rgba(255,93,93,0.08)"
      : archive
        ? "0 0 26px rgba(181,145,255,0.24), inset 0 0 24px rgba(181,145,255,0.07)"
        : openGate
          ? "0 0 28px rgba(127,255,193,0.28), inset 0 0 24px rgba(127,255,193,0.08)"
          : "0 0 26px rgba(125,231,255,0.24), inset 0 0 24px rgba(125,231,255,0.08)",
    backdropFilter: "blur(5px)",
    touchAction: "manipulation",
    cursor: "pointer",
  };
}

function areaIconStyle(areaId: DeltaAreaId, machineComplete: boolean): CSSProperties {
  const locked = areaId === "quarantine" && !machineComplete;
  const archive = areaId === "archive";
  const openGate = areaId === "quarantine" && machineComplete;
  return {
    flex: "0 0 auto",
    width: 32,
    minWidth: 32,
    height: 24,
    borderRadius: 6,
    clipPath: "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
    display: "grid",
    placeItems: "center",
    border: locked
      ? "1px solid rgba(255,93,93,0.62)"
      : archive
        ? "1px solid rgba(181,145,255,0.60)"
        : openGate
          ? "1px solid rgba(127,255,193,0.62)"
          : "1px solid rgba(125,231,255,0.62)",
    background: locked
      ? "rgba(255,93,93,0.15)"
      : archive
        ? "rgba(181,145,255,0.15)"
        : openGate
          ? "rgba(127,255,193,0.15)"
          : "rgba(125,231,255,0.15)",
    color: locked ? "#ff8f8f" : archive ? "#c8b6ff" : openGate ? "#9dffd4" : "#7de7ff",
    fontSize: 8,
    fontWeight: 950,
    letterSpacing: 0,
    boxShadow: locked
      ? "0 0 14px rgba(255,93,93,0.22)"
      : archive
        ? "0 0 14px rgba(181,145,255,0.18)"
        : openGate
          ? "0 0 14px rgba(127,255,193,0.20)"
          : "0 0 14px rgba(125,231,255,0.18)",
  };
}

const areaTextStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  alignItems: "flex-start",
};

const areaLabelStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.1,
  fontWeight: 950,
  textShadow: "0 0 10px rgba(125,231,255,0.20), 0 2px 4px rgba(0,0,0,0.55)",
};

const areaSubLabelStyle: CSSProperties = {
  color: "rgba(234,247,255,0.78)",
  fontSize: 9,
  lineHeight: 1.1,
  fontWeight: 800,
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 14000,
  display: "grid",
  placeItems: "center",
  padding: 14,
  boxSizing: "border-box",
  background: "rgba(5,8,12,0.68)",
  backdropFilter: "blur(2px)",
};

function dialogStyle(areaId: DeltaAreaId, machineComplete: boolean): CSSProperties {
  const locked = areaId === "quarantine" && !machineComplete;
  return {
    width: "min(460px, calc(100% - 10px))",
    padding: "24px 22px 20px",
    boxSizing: "border-box",
    borderRadius: 12,
    clipPath: "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)",
    border: locked ? "1px solid rgba(255,93,93,0.58)" : "1px solid rgba(125,231,255,0.54)",
    background: locked
      ? "linear-gradient(135deg, rgba(36,13,20,0.98), rgba(8,10,16,0.98)), linear-gradient(90deg, rgba(255,93,93,0.10), transparent)"
      : "linear-gradient(135deg, rgba(12,33,45,0.98), rgba(8,12,21,0.98)), linear-gradient(90deg, rgba(125,231,255,0.10), transparent)",
    boxShadow: locked
      ? "0 24px 58px rgba(0,0,0,0.58), 0 0 28px rgba(255,93,93,0.20), inset 0 0 34px rgba(255,93,93,0.10)"
      : "0 24px 58px rgba(0,0,0,0.58), 0 0 28px rgba(125,231,255,0.18), inset 0 0 34px rgba(125,231,255,0.10)",
    backdropFilter: "blur(6px)",
  };
}

const dialogEyebrowStyle: CSSProperties = {
  color: "rgba(125,231,255,0.82)",
  fontSize: 12,
  fontWeight: 950,
};

const dialogTitleStyle: CSSProperties = {
  marginTop: 8,
  color: "#eaf7ff",
  fontSize: 24,
  lineHeight: 1.15,
  fontWeight: 950,
};

const scenarioListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 16,
};

const scenarioEntryStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: 12,
  borderRadius: 10,
  clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
  border: "1px solid rgba(125,231,255,0.44)",
  background: "linear-gradient(135deg, rgba(125,231,255,0.12), rgba(6,14,24,0.54))",
  boxShadow: "inset 0 0 20px rgba(125,231,255,0.08)",
};

const scenarioEntryTitleStyle: CSSProperties = {
  color: "#eaf7ff",
  fontSize: 15,
  lineHeight: 1.2,
  fontWeight: 950,
};

const scenarioEntryTextStyle: CSSProperties = {
  marginTop: 5,
  color: "rgba(234,247,255,0.72)",
  fontSize: 12,
  lineHeight: 1.45,
};

const scenarioStartButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 8,
  clipPath: "polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)",
  border: "1px solid rgba(125,231,255,0.72)",
  background: "linear-gradient(180deg, #7de7ff, #388aa8)",
  color: "#061018",
  fontWeight: 950,
  touchAction: "manipulation",
  cursor: "pointer",
};

const puzzleCaptionStyle: CSSProperties = {
  marginTop: 16,
  color: "#c8b6ff",
  fontSize: 13,
  fontWeight: 950,
};

const puzzleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginTop: 10,
  padding: 10,
  borderRadius: 10,
  border: "1px solid rgba(181,145,255,0.42)",
  background: "linear-gradient(135deg, rgba(181,145,255,0.10), rgba(11,18,31,0.58))",
  boxShadow: "inset 0 0 22px rgba(181,145,255,0.08), 0 0 20px rgba(181,145,255,0.08)",
};

function puzzleSlotStyle(collected: boolean): CSSProperties {
  return {
    aspectRatio: "1",
    borderRadius: 6,
    overflow: "hidden",
    border: collected ? "1px solid rgba(125,231,255,0.72)" : "1px dashed rgba(181,145,255,0.48)",
    display: "grid",
    placeItems: "center",
    color: collected ? "#eaf7ff" : "rgba(234,247,255,0.42)",
    background: collected
      ? "linear-gradient(180deg, rgba(125,231,255,0.22), rgba(181,145,255,0.10))"
      : "linear-gradient(180deg, rgba(181,145,255,0.08), rgba(125,231,255,0.04)), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 4px, transparent 4px 10px)",
    boxShadow: collected ? "0 0 18px rgba(125,231,255,0.22), inset 0 0 16px rgba(125,231,255,0.12)" : undefined,
    fontWeight: 900,
  };
}

const puzzlePartImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

function puzzleSlotNumberStyle(collected: boolean): CSSProperties {
  return {
    minWidth: collected ? 28 : 36,
    height: 24,
    padding: "0 6px",
    boxSizing: "border-box",
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: collected ? "rgba(125,231,255,0.26)" : "rgba(10,13,22,0.62)",
    color: collected ? "#eaf7ff" : "rgba(234,247,255,0.46)",
    fontSize: 11,
  };
}

const dialogTextStyle: CSSProperties = {
  margin: "14px 0 0",
  color: "#eaf7ff",
  fontSize: 15,
  lineHeight: 1.7,
};

function dialogButtonStyle(areaId: DeltaAreaId, machineComplete: boolean): CSSProperties {
  const locked = areaId === "quarantine" && !machineComplete;
  return {
    marginTop: 18,
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: locked ? "1px solid rgba(255,93,93,0.72)" : "1px solid rgba(125,231,255,0.72)",
    background: locked ? "linear-gradient(180deg, #ff8f8f, #9e313d)" : "linear-gradient(180deg, #7de7ff, #388aa8)",
    color: locked ? "#1f080b" : "#061018",
    fontWeight: 950,
    touchAction: "manipulation",
    cursor: "pointer",
  };
}
