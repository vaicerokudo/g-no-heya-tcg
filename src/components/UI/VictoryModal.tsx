import { createPortal } from "react-dom";

type Props = {
  victory: { winner: "south" | "north"; detail: string } | null;
  onRestart: () => void;
};

export function VictoryModal({ victory, onRestart }: Props) {
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

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onRestart} style={{ padding: "8px 12px", fontWeight: 900 }}>
            RESTART
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
