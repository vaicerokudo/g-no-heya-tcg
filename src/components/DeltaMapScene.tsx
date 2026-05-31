import { useState, type CSSProperties } from "react";

type DeltaMapSceneProps = {
  onReturnContinent: () => void;
};

type DeltaAreaId = "entrance" | "control" | "archive" | "quarantine";

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
  { id: "control", label: "管制室", subLabel: "シナリオ選択予定", icon: "CTRL", x: 28, y: 13, w: 44, h: 15 },
  { id: "archive", label: "資料室", subLabel: "完成図パズル", icon: "DATA", x: 8, y: 42, w: 36, h: 17 },
  { id: "quarantine", label: "隔離ゲート", subLabel: "ロック中", icon: "LOCK", x: 56, y: 42, w: 36, h: 17 },
  { id: "entrance", label: "入口", subLabel: "大陸MAPへ戻る", icon: "EXIT", x: 32, y: 76, w: 36, h: 14 },
];

export function DeltaMapScene({ onReturnContinent }: DeltaMapSceneProps) {
  const [activeArea, setActiveArea] = useState<DeltaAreaId | null>(null);

  const openArea = (areaId: DeltaAreaId) => {
    if (areaId === "entrance") {
      onReturnContinent();
      return;
    }

    setActiveArea(areaId);
  };

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
              onClick={() => openArea(area.id)}
              title={`${area.label}: ${area.subLabel}`}
              style={{
                ...areaButtonStyle(area.id),
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.w}%`,
                height: `${area.h}%`,
              }}
            >
              <span style={areaIconStyle(area.id)}>{area.icon}</span>
              <span style={areaTextStyle}>
                <span style={areaLabelStyle}>{area.label}</span>
                <span style={areaSubLabelStyle}>{area.subLabel}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeArea ? (
        <div style={overlayStyle}>
          <div style={dialogStyle(activeArea)}>
            <div style={dialogEyebrowStyle}>{getAreaTitle(activeArea)}</div>
            <div style={dialogTitleStyle}>{getAreaDialogTitle(activeArea)}</div>
            {activeArea === "archive" ? (
              <>
                <div style={puzzleCaptionStyle}>メタルマシーン完成図</div>
                <div style={puzzleGridStyle} aria-label="メタルマシーン完成図パズル枠">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} style={puzzleSlotStyle}>
                      <span style={puzzleSlotNumberStyle}>{index + 1}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <p style={dialogTextStyle}>{getAreaDialogText(activeArea)}</p>
            <button type="button" onClick={() => setActiveArea(null)} style={dialogButtonStyle(activeArea)}>
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

function getAreaDialogTitle(areaId: DeltaAreaId) {
  if (areaId === "control") return "デルタ編シナリオ選択予定";
  if (areaId === "archive") return "メタルマシーン完成図";
  return "ロック中";
}

function getAreaDialogText(areaId: DeltaAreaId) {
  if (areaId === "control") {
    return "管制室はまだ準備中です。ここからデルタ編の物語へ入る予定です。";
  }
  if (areaId === "archive") {
    return "資料室には9つの空枠があります。完成図の欠片を集める場所として、次工程以降で保存ロジックを追加します。";
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
    "radial-gradient(circle at 50% 38%, rgba(125,231,255,0.12), transparent 26%), linear-gradient(180deg, rgba(12,31,43,0.98), rgba(11,16,28,0.98)), repeating-linear-gradient(90deg, rgba(125,231,255,0.05) 0 1px, transparent 1px 42px), repeating-linear-gradient(0deg, rgba(125,231,255,0.04) 0 1px, transparent 1px 42px)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.52), inset 0 0 62px rgba(64,211,255,0.13)",
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
};

const walkwayHorizontalStyle: CSSProperties = {
  position: "absolute",
  left: "19%",
  top: "48%",
  width: "62%",
  height: "5%",
  borderRadius: 999,
  background: "linear-gradient(90deg, rgba(125,231,255,0.07), rgba(125,231,255,0.22), rgba(125,231,255,0.07))",
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
};

function areaButtonStyle(areaId: DeltaAreaId): CSSProperties {
  const locked = areaId === "quarantine";
  const archive = areaId === "archive";
  const entrance = areaId === "entrance";
  return {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 16,
    border: locked
      ? "1px solid rgba(255,93,93,0.58)"
      : archive
        ? "1px solid rgba(181,145,255,0.54)"
        : "1px solid rgba(125,231,255,0.58)",
    background: locked
      ? "linear-gradient(180deg, rgba(72,22,28,0.94), rgba(24,12,19,0.92))"
      : archive
        ? "linear-gradient(180deg, rgba(41,35,76,0.94), rgba(13,19,34,0.92))"
        : entrance
          ? "linear-gradient(180deg, rgba(48,64,74,0.94), rgba(14,22,30,0.92))"
          : "linear-gradient(180deg, rgba(24,58,76,0.94), rgba(11,22,32,0.92))",
    color: "#eaf7ff",
    boxShadow: locked
      ? "0 0 22px rgba(255,93,93,0.16)"
      : archive
        ? "0 0 22px rgba(181,145,255,0.15)"
        : "0 0 22px rgba(125,231,255,0.15)",
    touchAction: "manipulation",
    cursor: "pointer",
  };
}

function areaIconStyle(areaId: DeltaAreaId): CSSProperties {
  const locked = areaId === "quarantine";
  const archive = areaId === "archive";
  return {
    flex: "0 0 auto",
    width: 44,
    minWidth: 44,
    height: 34,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    border: locked
      ? "1px solid rgba(255,93,93,0.52)"
      : archive
        ? "1px solid rgba(181,145,255,0.50)"
        : "1px solid rgba(125,231,255,0.50)",
    background: locked ? "rgba(255,93,93,0.12)" : archive ? "rgba(181,145,255,0.12)" : "rgba(125,231,255,0.12)",
    color: locked ? "#ff8f8f" : archive ? "#c8b6ff" : "#7de7ff",
    fontSize: 10,
    fontWeight: 950,
    letterSpacing: 0,
  };
}

const areaTextStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 3,
  alignItems: "flex-start",
};

const areaLabelStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.1,
  fontWeight: 950,
};

const areaSubLabelStyle: CSSProperties = {
  color: "rgba(234,247,255,0.72)",
  fontSize: 11,
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

function dialogStyle(areaId: DeltaAreaId): CSSProperties {
  const locked = areaId === "quarantine";
  return {
    width: "min(460px, calc(100% - 10px))",
    padding: "24px 22px 20px",
    boxSizing: "border-box",
    borderRadius: 18,
    border: locked ? "1px solid rgba(255,93,93,0.48)" : "1px solid rgba(125,231,255,0.44)",
    background: "linear-gradient(180deg, rgba(13,31,43,0.98), rgba(10,13,22,0.98))",
    boxShadow: locked
      ? "0 24px 58px rgba(0,0,0,0.58), inset 0 0 34px rgba(255,93,93,0.08)"
      : "0 24px 58px rgba(0,0,0,0.58), inset 0 0 34px rgba(125,231,255,0.08)",
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
  borderRadius: 14,
  border: "1px solid rgba(181,145,255,0.28)",
  background: "rgba(181,145,255,0.06)",
};

const puzzleSlotStyle: CSSProperties = {
  aspectRatio: "1",
  borderRadius: 10,
  border: "1px dashed rgba(181,145,255,0.48)",
  display: "grid",
  placeItems: "center",
  color: "rgba(234,247,255,0.42)",
  background:
    "linear-gradient(180deg, rgba(181,145,255,0.08), rgba(125,231,255,0.04)), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 4px, transparent 4px 10px)",
  fontWeight: 900,
};

const puzzleSlotNumberStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(10,13,22,0.62)",
  fontSize: 11,
};

const dialogTextStyle: CSSProperties = {
  margin: "14px 0 0",
  color: "#eaf7ff",
  fontSize: 15,
  lineHeight: 1.7,
};

function dialogButtonStyle(areaId: DeltaAreaId): CSSProperties {
  const locked = areaId === "quarantine";
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
