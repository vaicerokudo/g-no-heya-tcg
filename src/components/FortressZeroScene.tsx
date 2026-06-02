import type { CSSProperties } from "react";

type FortressZeroSceneProps = {
  onReturnContinent: () => void;
};

const MEMORY_CITY_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdstxjL-kygkAcjePKf3fpLFtdBUxOK17kM_QnYPJ6mdF5zNA/viewform";
const GATEKEEPER_MEMO_IMAGE_URL = "/ui/fortress-zero/gatekeeper-memo.png";

export function FortressZeroScene({ onReturnContinent }: FortressZeroSceneProps) {
  const openMemoryCity = () => {
    window.open(MEMORY_CITY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={sceneStyle}>
      <div style={panelStyle}>
        <div style={eyebrowStyle}>ARG GATEWAY</div>
        <h1 style={titleStyle}>FORTRESS ZERO</h1>
        <div style={jpTitleStyle}>記憶の街</div>
        <div style={subTitleStyle}>記憶の街へ続く城塞跡</div>

        <div style={bodyStyle}>
          <p style={paragraphStyle}>ここは、忘れられた記録が眠る城塞跡。</p>
          <p style={paragraphStyle}>
            この先には、Gの部屋の外側に残された「記憶の街」への入口があります。
          </p>
          <p style={paragraphStyle}>準備ができたら、記録領域へ進んでください。</p>
        </div>

        <div style={memoPanelStyle}>
          <div style={memoLabelStyle}>門番のメモ</div>
          <img src={GATEKEEPER_MEMO_IMAGE_URL} alt="門番のメモ" style={memoImageStyle} />
        </div>

        <div style={noticeStyle}>この先は、Gの部屋の外側に残された記録領域です。</div>

        <div style={actionsStyle}>
          <button type="button" onClick={openMemoryCity} style={primaryButtonStyle}>
            記憶の街へ進む
          </button>
          <button type="button" onClick={onReturnContinent} style={secondaryButtonStyle}>
            大陸MAPへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: "18px 12px",
  color: "#f7efe3",
  background:
    "radial-gradient(circle at 25% 15%, rgba(119, 180, 255, 0.16), transparent 28%), radial-gradient(circle at 78% 18%, rgba(255, 212, 122, 0.14), transparent 26%), linear-gradient(180deg, #141b25 0%, #181513 52%, #0c0e12 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const panelStyle: CSSProperties = {
  width: "min(560px, 100%)",
  padding: "24px 22px",
  boxSizing: "border-box",
  borderRadius: 14,
  border: "1px solid rgba(255, 232, 181, 0.28)",
  background:
    "linear-gradient(180deg, rgba(31, 35, 42, 0.92), rgba(23, 17, 14, 0.9)), radial-gradient(circle at 82% 14%, rgba(255, 211, 118, 0.12), transparent 30%)",
  boxShadow: "0 22px 64px rgba(0,0,0,0.56), inset 0 0 52px rgba(109, 160, 255, 0.06)",
};

const eyebrowStyle: CSSProperties = {
  color: "#8fc7ff",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#fff2d1",
  fontSize: 30,
  lineHeight: 1.1,
  textShadow: "0 2px 14px rgba(0,0,0,0.54)",
};

const jpTitleStyle: CSSProperties = {
  marginTop: 4,
  color: "#ffd783",
  fontSize: 19,
  fontWeight: 950,
};

const subTitleStyle: CSSProperties = {
  marginTop: 8,
  color: "rgba(247, 239, 227, 0.78)",
  fontSize: 13,
  fontWeight: 850,
};

const bodyStyle: CSSProperties = {
  marginTop: 22,
  padding: "16px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255, 232, 181, 0.18)",
  background: "rgba(0, 0, 0, 0.22)",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "rgba(255, 247, 229, 0.9)",
  fontSize: 14,
  lineHeight: 1.72,
  fontWeight: 800,
};

const noticeStyle: CSSProperties = {
  marginTop: 14,
  color: "#cfe6ff",
  fontSize: 12,
  lineHeight: 1.55,
  fontWeight: 850,
};

const memoPanelStyle: CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255, 232, 181, 0.22)",
  background:
    "linear-gradient(180deg, rgba(255, 240, 205, 0.08), rgba(0, 0, 0, 0.22))",
  boxShadow: "inset 0 0 28px rgba(255, 214, 128, 0.06), 0 14px 30px rgba(0,0,0,0.26)",
};

const memoLabelStyle: CSSProperties = {
  marginBottom: 8,
  color: "#ffd783",
  fontSize: 12,
  fontWeight: 950,
};

const memoImageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: 430,
  maxHeight: 420,
  margin: "0 auto",
  objectFit: "contain",
  borderRadius: 10,
  border: "1px solid rgba(255, 232, 181, 0.24)",
  boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 22,
};

const baseButtonStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 10,
  fontWeight: 950,
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid rgba(255, 220, 136, 0.68)",
  background: "linear-gradient(180deg, #ffd979, #b87624)",
  color: "#22160a",
  boxShadow: "0 10px 24px rgba(191, 119, 34, 0.24)",
};

const secondaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid rgba(255, 232, 181, 0.28)",
  background: "rgba(255, 247, 229, 0.08)",
  color: "#fff2d1",
};
