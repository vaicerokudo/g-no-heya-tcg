import type { Side, UnitDef, UnitInstance } from "../types";
import type { SkillDef } from "./registry";
import { canUseSkillByUsage } from "./canExecuteSkill";
import { canTargetSkillCell, type SkillTargetCell } from "./canTargetSkillCell";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type CanStartSkillExecutionArgs = {
  gameOver: boolean;
  turn: Side;
  selected: UnitInstance;
  perUnitTurn: PerUnitTurn;
  def: SkillDef;
  target: SkillTargetCell;
  skillTargetSet: Set<string>;
  usedSkills: Record<string, boolean>;
  key: string;
  unitsById: Record<string, UnitDef>;
};

export function canStartSkillExecution({
  gameOver,
  turn,
  selected,
  perUnitTurn,
  def,
  target,
  skillTargetSet,
  usedSkills,
  key,
  unitsById,
}: CanStartSkillExecutionArgs) {
  const me = perUnitTurn[selected.instanceId];

  if (gameOver) return false;
  if (selected.side !== turn) return false;
  if (me?.done ?? false) return false;
  if (me?.attacked ?? false) return false;
  if (!canTargetSkillCell({ def, selected, target, skillTargetSet, unitsById })) return false;
  if (!canUseSkillByUsage(def, usedSkills, key)) return false;

  return true;
}
