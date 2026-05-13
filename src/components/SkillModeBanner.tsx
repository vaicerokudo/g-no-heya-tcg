import type { UnitInstance } from "../game/types";
import { SKILLS, type SkillId } from "../game/skills/registry";

type SkillModeBannerProps = {
  skillMode: SkillId | null;
  selected: UnitInstance | null;
  gameOver: boolean;
  onCancel: () => void;
};

export function SkillModeBanner({ skillMode, selected, gameOver, onCancel }: SkillModeBannerProps) {
  if (gameOver || !skillMode || !selected) return null;

  const def = SKILLS[skillMode];
  const label = def?.label ?? skillMode;

  return (
    <div
      style={{
        marginBottom: 10,
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #6a5a00",
        background: "rgba(90,74,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, lineHeight: 1.25 }}>
        <div style={{ fontWeight: 900 }}>スキル選択中: {label}</div>
        <div style={{ opacity: 0.9, marginTop: 2 }}>
          盤面の対象セルをクリックして発動。<span style={{ fontWeight: 800 }}>ESC</span>で解除
        </div>
      </div>

      <button
        onClick={onCancel}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #6a5a00",
          background: "rgba(0,0,0,0.35)",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        解除
      </button>
    </div>
  );
}
