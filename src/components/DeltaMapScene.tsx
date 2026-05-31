import { useState, type CSSProperties } from "react";

type DeltaMapSceneProps = {
  onReturnContinent: () => void;
};

type DeltaAreaId = "entrance" | "control" | "archive" | "quarantine";

type DeltaArea = {
  id: DeltaAreaId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const AREAS: DeltaArea[] = [
  { id: "entrance", label: "入口", subLabel: "大陸MAPへ戻る", x: 37, y: 78, w: 26, h: 12 },
  { id: "control", label: "管制室", subLabel: "準備中", x: 36, y: 16, w: 28, h: 14 },
  { id: "archive", label: "資料室", subLabel: "9パーツ", x: 8, y: 43, w: 30, h: 15 },
  { id: "quarantine", label: "隔離ゲート", subLabel: "ロック", x: 62, y: 43, w: 30, h: 15 },
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
          </div>
          <button type="button" onClick={onReturnContinent} style={returnButtonStyle}>
            大陸MAPへ
          </button>
        </header>

        <div style={mapStyle}>
          <div style={facilityCoreStyle} />
          <div style={walkwayVerticalStyle} />
          <div style={walkwayHorizontalStyle} />

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
              <span style={areaLabelStyle}>{area.label}</span>
              <span style={areaSubLabelStyle}>{area.subLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {activeArea ? (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <div style={dialogEyebrowStyle}>{getAreaTitle(activeArea)}</div>
            <div style={dialogTitleStyle}>{getAreaDialogTitle(activeArea)}</div>
            {activeArea === "archive" ? (
              <div style={puzzleGridStyle} aria-label="メタルマシーン完成図パズル枠">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} style={puzzleSlotStyle}>
                    {index + 1}
                  </div>
                ))}
              </div>
            ) : null}
            <p style={dialogTextStyle}>{getAreaDialogText(activeArea)}</p>
            <button type="button" onClick={() => setActiveArea(null)} style={dialogButtonStyle}>
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
  if (areaId === "control") return "管制室はまだ準備中です。ここからデルタ編の物語へ入る予定です。";
  if (areaId === "archive") return "資料室には9つの空枠があります。パズルパーツの保存は次工程以降で実装します。";
  return "隔離ゲートは9パーツ完成後に開く予定です。今は固く閉ざされています。";
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: 14,
  color: "#eaf7ff",
  background:
    "radial-gradient(circle at 28% 14%, rgba(60,210,255,0.18), transparent 30%), radial-gradient(circle at 76% 24%, rgba(155,117,255,0.14), transparent 28%), linear-gradient(180deg, #0b1822 0%, #10131f 58%, #090c12 100%)",
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
  color: "#7de7ff",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#eaf7ff",
  fontSize: 26,
  textShadow: "0 2px 14px rgba(0,0,0,0.55)",
};

const returnButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(125,231,255,0.34)",
  background: "rgba(9,24,34,0.82)",
  color: "#eaf7ff",
  fontWeight: 900,
  cursor: "pointer",
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
  border: "1px solid rgba(125,231,255,0.28)",
  background:
    "linear-gradient(180deg, rgba(12,31,43,0.98), rgba(11,16,28,0.98)), repeating-linear-gradient(90deg, rgba(125,231,255,0.05) 0 1px, transparent 1px 48px), repeating-linear-gradient(0deg, rgba(125,231,255,0.04) 0 1px, transparent 1px 48px)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.52), inset 0 0 62px rgba(64,211,255,0.12)",
};

const facilityCoreStyle: CSSProperties = {
  position: "absolute",
  left: "31%",
  top: "35%",
  width: "38%",
  height: "23%",
  borderRadius: 18,
  border: "1px solid rgba(125,231,255,0.34)",
  background: "linear-gradient(180deg, rgba(28,60,78,0.82), rgba(12,22,34,0.86))",
  boxShadow: "inset 0 0 28px rgba(125,231,255,0.12), 0 12px 28px rgba(0,0,0,0.28)",
};

const walkwayVerticalStyle: CSSProperties = {
  position: "absolute",
  left: "47%",
  top: "22%",
  width: "6%",
  height: "63%",
  borderRadius: 999,
  background: "linear-gradient(180deg, rgba(125,231,255,0.18), rgba(125,231,255,0.05))",
};

const walkwayHorizontalStyle: CSSProperties = {
  position: "absolute",
  left: "21%",
  top: "48%",
  width: "58%",
  height: "5%",
  borderRadius: 999,
  background: "linear-gradient(90deg, rgba(125,231,255,0.07), rgba(125,231,255,0.2), rgba(125,231,255,0.07))",
};

function areaButtonStyle(areaId: DeltaAreaId): CSSProperties {
  const locked = areaId === "quarantine";
  return {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: 8,
    borderRadius: 14,
    border: locked ? "1px solid rgba(255,93,93,0.52)" : "1px solid rgba(125,231,255,0.58)",
    background: locked
      ? "linear-gradient(180deg, rgba(67,24,28,0.92), rgba(22,15,22,0.90))"
      : "linear-gradient(180deg, rgba(24,58,76,0.92), rgba(11,22,32,0.90))",
    color: "#eaf7ff",
    boxShadow: locked ? "0 0 18px rgba(255,93,93,0.12)" : "0 0 18px rgba(125,231,255,0.14)",
    touchAction: "manipulation",
    cursor: "pointer",
  };
}

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

const dialogStyle: CSSProperties = {
  width: "min(460px, calc(100% - 10px))",
  padding: "24px 22px 20px",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(125,231,255,0.44)",
  background: "linear-gradient(180deg, rgba(13,31,43,0.98), rgba(10,13,22,0.98))",
  boxShadow: "0 24px 58px rgba(0,0,0,0.58), inset 0 0 34px rgba(125,231,255,0.08)",
};

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

const puzzleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginTop: 16,
};

const puzzleSlotStyle: CSSProperties = {
  aspectRatio: "1",
  borderRadius: 8,
  border: "1px dashed rgba(125,231,255,0.42)",
  display: "grid",
  placeItems: "center",
  color: "rgba(234,247,255,0.44)",
  background: "rgba(125,231,255,0.06)",
  fontWeight: 900,
};

const dialogTextStyle: CSSProperties = {
  margin: "14px 0 0",
  color: "#eaf7ff",
  fontSize: 15,
  lineHeight: 1.7,
};

const dialogButtonStyle: CSSProperties = {
  marginTop: 18,
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(125,231,255,0.72)",
  background: "linear-gradient(180deg, #7de7ff, #388aa8)",
  color: "#061018",
  fontWeight: 950,
  touchAction: "manipulation",
  cursor: "pointer",
};
