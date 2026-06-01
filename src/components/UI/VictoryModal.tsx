import { createPortal } from "react-dom";

type Props = {
  victory: { winner: "south" | "north"; detail: string } | null;
  onRestart: () => void;
  restartLabel?: string;
  onScenarioSelect?: () => void;
  onRetryScenario?: () => void;
  deltaClearRewardImageSrc?: string;
};

export function VictoryModal({
  victory,
  onRestart,
  restartLabel = "RESTART",
  onScenarioSelect,
  onRetryScenario,
  deltaClearRewardImageSrc,
}: Props) {
  if (!victory || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "92vw",
          background: "#111",
          border: "1px solid #444",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
          {victory.winner.toUpperCase()} WIN
        </div>

        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14 }}>{victory.detail}</div>

        {deltaClearRewardImageSrc ? (
          <div style={deltaRewardStyle}>
            <div style={deltaRewardTextStyle}>
              <div style={deltaRewardEyebrowStyle}>DELTA CLEAR</div>
              <div style={deltaRewardTitleStyle}>Deli専用メタルマシーン 解放</div>
              <div style={deltaRewardBodyStyle}>
                ブラックノイズを制圧した。メタルマシーン完成図が起動し、カード図鑑と戦闘中表示で使用可能になりました。
              </div>
            </div>
            <img src={deltaClearRewardImageSrc} alt="" style={deltaRewardImageStyle} />
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          {onScenarioSelect ? (
            <button onClick={onScenarioSelect} style={{ padding: "8px 12px", fontWeight: 900 }}>
              シナリオ選択へ
            </button>
          ) : null}
          {onRetryScenario ? (
            <button onClick={onRetryScenario} style={{ padding: "8px 12px", fontWeight: 900 }}>
              もう一度挑戦
            </button>
          ) : null}
          <button onClick={onRestart} style={{ padding: "8px 12px", fontWeight: 900 }}>
            {restartLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const deltaRewardStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 116px",
  gap: 12,
  alignItems: "center",
  margin: "0 0 14px",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(125,231,255,0.34)",
  background:
    "linear-gradient(135deg, rgba(16,46,67,0.74), rgba(8,12,24,0.88)), radial-gradient(circle at 82% 20%, rgba(255,181,62,0.16), transparent 38%)",
  boxShadow: "inset 0 0 26px rgba(125,231,255,0.10), 0 0 24px rgba(125,231,255,0.10)",
} as const;

const deltaRewardTextStyle = {
  minWidth: 0,
} as const;

const deltaRewardEyebrowStyle = {
  color: "#7de7ff",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
} as const;

const deltaRewardTitleStyle = {
  marginTop: 4,
  color: "#fff4cd",
  fontSize: 16,
  fontWeight: 950,
} as const;

const deltaRewardBodyStyle = {
  marginTop: 6,
  color: "rgba(255,255,255,0.82)",
  fontSize: 12,
  lineHeight: 1.45,
} as const;

const deltaRewardImageStyle = {
  width: 116,
  height: 116,
  objectFit: "contain",
  filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45)) drop-shadow(0 0 18px rgba(125,231,255,0.24))",
} as const;
