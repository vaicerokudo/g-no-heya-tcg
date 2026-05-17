import type { Ref } from "react";
import type { Side, UnitInstance } from "../game/types";
import type { SkillDef, SkillId } from "../game/skills/registry";
import { skillKey } from "../game/skills/registry";
import { getSkillButtonState } from "../game/skills/skillButtonState";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type BottomBarProps = {
  bottomBarRef: Ref<HTMLDivElement>;
  selected: UnitInstance | null;
  selectedSkills: SkillDef[];
  turn: Side;
  gameOver: boolean;
  perUnitTurn: PerUnitTurn;
  usedSkills: Record<string, boolean>;
  skillMode: SkillId | null;
  canUndoMove: boolean;
  onSkillButtonClick: (skill: SkillDef) => void;
  onWaitSelectedUnit: () => void;
  onUndoMove: () => void;
  onEndTurn: () => void;
};

function buildSkillButtonDescription(skill: SkillDef, disabledReason: string) {
  const skillDescription = `${skill.label}${skill.desc ? `：${skill.desc}` : ""}`;
  return disabledReason ? `${disabledReason}。${skillDescription}` : skillDescription;
}

export function BottomBar({
  bottomBarRef,
  selected,
  selectedSkills,
  turn,
  gameOver,
  perUnitTurn,
  usedSkills,
  skillMode,
  canUndoMove,
  onSkillButtonClick,
  onWaitSelectedUnit,
  onUndoMove,
  onEndTurn,
}: BottomBarProps) {
  const waitDisabled = !selected || !!gameOver || selected.side !== turn || (perUnitTurn[selected.instanceId]?.done ?? false);
  const endTurnDisabled = gameOver || !!skillMode;
  const disabledSkillReasons = selected
    ? Array.from(
        new Set(
          selectedSkills
            .map((skill) => {
              const key = skillKey(turn, selected.instanceId, skill.id);
              const { canUse, btnTitle } = getSkillButtonState({
                skill,
                selected,
                turn,
                gameOver,
                perUnitTurn,
                usedSkills,
                key,
              });
              return !canUse && btnTitle ? btnTitle : "";
            })
            .filter(Boolean)
        )
      )
    : [];

  return (
    <div
      ref={bottomBarRef}
      className="bottomBar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9000,
        padding: "10px 12px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        background: "rgba(17,17,17,0.96)",
        borderTop: "1px solid #444",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "min(720px, 100%)", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
          {selected
            ? selectedSkills.map((skill) => {
                const key = skillKey(turn, selected.instanceId, skill.id);
                const { canUse, btnTitle, onceLabel } = getSkillButtonState({
                  skill,
                  selected,
                  turn,
                  gameOver,
                  perUnitTurn,
                  usedSkills,
                  key,
                });
                const buttonDescription = buildSkillButtonDescription(skill, btnTitle);

                return (
                  <button
                    key={skill.id}
                    className={`skillButton${canUse ? "" : " skillButtonDisabled"}`}
                    disabled={!canUse}
                    title={buttonDescription}
                    aria-label={buttonDescription}
                    onClick={() => onSkillButtonClick(skill)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: canUse ? "1px solid #444" : "1px solid rgba(255,255,255,0.12)",
                      background: canUse ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.34)",
                      color: "#fff",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {skill.label}
                    {onceLabel}
                  </button>
                );
              })
            : null}
        </div>

        {disabledSkillReasons.length > 0 && (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.35,
              opacity: 0.86,
              overflowWrap: "anywhere",
            }}
          >
            使用不可：{disabledSkillReasons.join(" / ")}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={waitDisabled}
            onClick={onWaitSelectedUnit}
            style={{
              flex: 1,
              padding: "10px 10px",
              fontWeight: 900,
              opacity: waitDisabled ? 0.6 : 1,
            }}
          >
            待機
          </button>

          <button
            onClick={onUndoMove}
            disabled={!canUndoMove}
            style={{
              flex: 1,
              padding: "10px 10px",
              fontWeight: 900,
              cursor: canUndoMove ? "pointer" : "not-allowed",
              opacity: canUndoMove ? 1 : 0.6,
            }}
            title={!canUndoMove ? "移動後・攻撃前のみ取り消し可能" : ""}
          >
            移動取消
          </button>

          <button
            onClick={onEndTurn}
            disabled={endTurnDisabled}
            style={{
              flex: 1,
              padding: "10px 10px",
              fontWeight: 900,
              cursor: endTurnDisabled ? "not-allowed" : "pointer",
              opacity: endTurnDisabled ? 0.6 : 1,
            }}
            title={skillMode ? "スキル選択中はターン終了できません。ESCで解除" : ""}
          >
            ターン終了
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
          操作: 自分の駒をクリック → 緑で移動 / 赤い敵をクリックで攻撃（1ターン攻撃1回）→ ターン終了
        </div>
      </div>
    </div>
  );
}
