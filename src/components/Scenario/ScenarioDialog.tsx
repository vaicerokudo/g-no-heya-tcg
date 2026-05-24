import { createPortal } from "react-dom";

export type ScenarioLine = {
  speaker: string;
  text: string;
};

type ScenarioDialogProps = {
  title: string;
  lines: ScenarioLine[];
  index: number;
  onNext: () => void;
};

export function ScenarioDialog({ title, lines, index, onNext }: ScenarioDialogProps) {
  if (typeof document === "undefined" || lines.length === 0) return null;

  const line = lines[Math.min(index, lines.length - 1)];
  const isLast = index >= lines.length - 1;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "24px 14px calc(24px + env(safe-area-inset-bottom))",
        background: "rgba(0,0,0,0.42)",
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 8,
          background: "rgba(13, 12, 10, 0.96)",
          color: "#fff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.62)",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 900, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 10 }}>{line.speaker}</div>
        <div style={{ fontSize: 18, lineHeight: 1.55, minHeight: 56, overflowWrap: "anywhere" }}>
          {line.text}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <div style={{ fontSize: 12, opacity: 0.68 }}>
            {index + 1} / {lines.length}
          </div>
          <button
            onClick={onNext}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.24)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            {isLast ? "閉じる" : "次へ"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
