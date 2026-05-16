import type { Side, UnitInstance } from "../types";
import type { SkillDef } from "./registry";
import { canUseSkillByUsage, isSkillUsed } from "./canExecuteSkill";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type GetSkillButtonStateArgs = {
  skill: SkillDef;
  selected: UnitInstance;
  turn: Side;
  gameOver: boolean;
  perUnitTurn: PerUnitTurn;
  usedSkills: Record<string, boolean>;
  key: string;
};

export function getSkillButtonState({
  skill,
  selected,
  turn,
  gameOver,
  perUnitTurn,
  usedSkills,
  key,
}: GetSkillButtonStateArgs) {
  const used = isSkillUsed(usedSkills, key);
  const formOk = !skill.requiresForm || selected.form === skill.requiresForm;
  const me = perUnitTurn[selected.instanceId];
  const done = me?.done ?? false;
  const canUse =
    !gameOver &&
    selected.side === turn &&
    !done &&
    formOk &&
    canUseSkillByUsage(skill, usedSkills, key);
  const btnTitle = gameOver
    ? "ゲーム終了済み"
    : selected.side !== turn
      ? "自分のターンではありません"
      : done
        ? "このユニットは行動済み"
        : !formOk
          ? skill.requiresForm === "g"
            ? "進化(G)が必要"
            : "この形態では使用できません"
          : used
            ? "この試合で使用済み"
            : "";

  return {
    canUse,
    btnTitle,
    onceLabel: skill.oncePerMatch ? "（1回）" : "",
    used,
    formOk,
  };
}
