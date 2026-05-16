import type { UnitInstance } from "../game/types";
import { SKILLS, type SkillDef, type SkillId } from "../game/skills/registry";

type SkillModeBannerProps = {
  skillMode: SkillId | null;
  selected: UnitInstance | null;
  gameOver: boolean;
  onCancel: () => void;
};

function getTargetModeInstruction(targetMode: SkillDef["targetMode"] | undefined) {
  switch (targetMode) {
    case "chooseEnemyAdjacent":
      return "隣接する敵を選んでください。";
    case "chooseFront3Cells":
      return "正面3マスの対象セルを選んでください。";
    case "chooseAllyInRange":
      return "範囲内の味方を選んでください。";
    case "chooseLineDirection":
      return "発動方向のセルを選んでください。";
    case "enemiesInRange":
      return "範囲内の敵に即時発動します。";
    case "instant":
      return "即時発動するスキルです。";
    default:
      return "対象を選んでください。";
  }
}

export function SkillModeBanner({ skillMode, selected, gameOver, onCancel }: SkillModeBannerProps) {
  if (gameOver || !skillMode || !selected) return null;

  const def = SKILLS[skillMode];
  const label = def?.label ?? skillMode;
  const desc = typeof def?.desc === "string" ? def.desc.trim() : "";
  const instruction = getTargetModeInstruction(def?.targetMode);

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
      <div style={{ minWidth: 0, fontSize: 13, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 900 }}>スキル選択中: {label}</div>
        {desc ? <div style={{ opacity: 0.92, marginTop: 3, overflowWrap: "anywhere" }}>{desc}</div> : null}
        <div style={{ opacity: 0.9, marginTop: 3 }}>
          {instruction}
          <span style={{ marginLeft: 4 }}>
            <span style={{ fontWeight: 800 }}>ESC</span>で解除
          </span>
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
