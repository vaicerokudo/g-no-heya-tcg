import { createPortal } from "react-dom";
import type { ScenarioId } from "../../game/scenario/scenarios";

type ScenarioSelectDialogProps = {
  open: boolean;
  clearedScenarioIds: ScenarioId[];
  onClose: () => void;
  onStartScenario: (scenarioId: ScenarioId) => void;
};

type ScenarioSelectItem = {
  id: ScenarioId;
  title: string;
  description: string;
  unlockText: string;
  unlockRequires?: ScenarioId;
  implemented: boolean;
};

const SCENARIO_SELECT_ITEMS: ScenarioSelectItem[] = [
  {
    id: "scenario1",
    title: "第1話 門前のボア戦",
    description: "街に入ろうとするボアを、総長たちで止めよう。",
    unlockText: "解放済み",
    implemented: true,
  },
  {
    id: "scenario2",
    title: "第2話 森の卵",
    description: "明王の依頼で、森へ向かう。レッサーワイバーンの卵を手に入れよう。",
    unlockText: "第1話クリアで解放",
    unlockRequires: "scenario1",
    implemented: true,
  },
  {
    id: "scenario3",
    title: "第3話 ゴブリン討伐",
    description: "森に現れたゴブリンたちを討伐しよう。",
    unlockText: "第2話クリアで解放",
    unlockRequires: "scenario2",
    implemented: false,
  },
];

export function ScenarioSelectDialog({
  open,
  clearedScenarioIds,
  onClose,
  onStartScenario,
}: ScenarioSelectDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const clearedSet = new Set(clearedScenarioIds);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="シナリオ選択"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10040,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.62)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          maxHeight: "88vh",
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.20)",
          borderRadius: 8,
          background: "rgba(18, 15, 12, 0.97)",
          color: "#fff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.64)",
          padding: 16,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 900 }}>物語</div>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, lineHeight: 1.2 }}>はじまりの記録</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.20)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {SCENARIO_SELECT_ITEMS.map((item) => {
            const unlocked = !item.unlockRequires || clearedSet.has(item.unlockRequires);
            const cleared = clearedSet.has(item.id);
            const canStart = unlocked && item.implemented;
            const status = cleared
              ? "クリア済み"
              : unlocked
                ? item.implemented
                  ? "解放済み"
                  : "準備中"
                : item.unlockText;

            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: unlocked ? "rgba(255,241,204,0.08)" : "rgba(255,255,255,0.04)",
                  opacity: unlocked ? 1 : 0.68,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 15, fontWeight: 950 }}>{item.title}</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.16)",
                        background: cleared ? "rgba(115,220,150,0.18)" : "rgba(0,0,0,0.20)",
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.45, opacity: 0.82 }}>
                    {item.description}
                  </div>
                </div>

                <button
                  disabled={!canStart}
                  onClick={() => onStartScenario(item.id)}
                  style={{
                    minWidth: 86,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.20)",
                    background: canStart ? "linear-gradient(180deg, #ffd66d, #b77b24)" : "rgba(255,255,255,0.08)",
                    color: canStart ? "#21160a" : "rgba(255,255,255,0.58)",
                    fontWeight: 950,
                    cursor: canStart ? "pointer" : "not-allowed",
                  }}
                >
                  {item.implemented ? "開始" : "準備中"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
