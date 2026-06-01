import type { CSSProperties } from "react";

type DustWastelandSceneProps = {
  onReturnContinent: () => void;
};

const DUST_WASTELAND_BACKGROUND_URL = "/backgrounds/dust-wasteland-map.png";

export function DustWastelandScene({ onReturnContinent }: DustWastelandSceneProps) {
  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>DUST WASTELAND</div>
            <h1 style={titleStyle}>砂塵の荒野</h1>
            <div style={subtitleStyle}>調査準備中</div>
          </div>
          <button type="button" onClick={onReturnContinent} style={returnButtonStyle}>
            大陸MAPへ戻る
          </button>
        </header>

        <div style={mapStyle}>
          <div style={scanPanelStyle}>
            <div style={scanEyebrowStyle}>NEXT ROUTE</div>
            <div style={scanTitleStyle}>砂嵐の向こうに、新たな調査地点を確認</div>
            <div style={scanTextStyle}>シナリオ導線は次回以降に接続予定です。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: "10px 8px 18px",
  color: "#fff3d4",
  background:
    "radial-gradient(circle at 20% 12%, rgba(255, 213, 128, 0.26), transparent 30%), radial-gradient(circle at 78% 18%, rgba(255, 146, 74, 0.14), transparent 28%), linear-gradient(180deg, #2a241d 0%, #211816 48%, #111217 100%)",
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
  color: "#ffd27b",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#fff0c2",
  fontSize: 28,
  textShadow: "0 2px 14px rgba(0,0,0,0.5)",
};

const subtitleStyle: CSSProperties = {
  marginTop: 4,
  color: "#f2c487",
  fontSize: 13,
  fontWeight: 900,
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

const mapStyle: CSSProperties = {
  position: "relative",
  width: "clamp(320px, 96vw, 640px)",
  maxWidth: "100%",
  aspectRatio: "941 / 1672",
  minHeight: 0,
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 18,
  border: "1px solid rgba(255,220,150,0.26)",
  background:
    `linear-gradient(180deg, rgba(32, 24, 14, 0.12), rgba(37, 20, 10, 0.5)), url(${DUST_WASTELAND_BACKGROUND_URL}), linear-gradient(180deg, #9c7449 0%, #6d4a2d 45%, #2a201c 100%)`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  boxShadow: "0 22px 60px rgba(0,0,0,0.5), inset 0 0 70px rgba(55,30,12,0.34)",
};

const scanPanelStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "8%",
  width: "min(82%, 420px)",
  transform: "translateX(-50%)",
  padding: "14px 16px",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255, 227, 169, 0.34)",
  background: "linear-gradient(180deg, rgba(44, 29, 19, 0.86), rgba(21, 17, 16, 0.76))",
  boxShadow: "0 18px 38px rgba(0,0,0,0.34)",
};

const scanEyebrowStyle: CSSProperties = {
  color: "#ffd27b",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: 0,
};

const scanTitleStyle: CSSProperties = {
  marginTop: 5,
  color: "#fff2cf",
  fontSize: 16,
  fontWeight: 950,
  lineHeight: 1.35,
};

const scanTextStyle: CSSProperties = {
  marginTop: 7,
  color: "rgba(255, 239, 207, 0.78)",
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 800,
};
