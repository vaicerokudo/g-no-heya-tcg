import { getEffectiveMaxHp } from "../stats";
import type { UnitDef, UnitInstance } from "../types";
import type { SkillDef } from "./registry";

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

export type SkillTargetCell = {
  r: number;
  c: number;
  inst: UnitInstance | null;
};

type CanTargetSkillCellArgs = {
  def: SkillDef;
  selected: UnitInstance;
  target: SkillTargetCell;
  skillTargetSet: Set<string>;
  unitsById: Record<string, UnitDef>;
};

export function canTargetSkillCell({
  def,
  selected,
  target,
  skillTargetSet,
  unitsById,
}: CanTargetSkillCellArgs) {
  if (!skillTargetSet.has(posKey(target.r, target.c))) return false;
  if (def.requiresForm && selected.form !== def.requiresForm) return false;

  switch (def.targetMode) {
    case "chooseFront3Cells": {
      const fr = selected.side === "south" ? -1 : 1;
      const frontRows = def.frontRows ?? 1;
      const forwardDistance = (target.r - selected.pos.r) / fr;

      return (
        Number.isInteger(forwardDistance) &&
        forwardDistance >= 1 &&
        forwardDistance <= frontRows &&
        (target.c === selected.pos.c - 1 || target.c === selected.pos.c || target.c === selected.pos.c + 1)
      );
    }

    case "chooseEnemyAdjacent": {
      if (!target.inst) return false;
      if (target.inst.side === selected.side) return false;

      const dr = Math.abs(target.r - selected.pos.r);
      const dc = Math.abs(target.c - selected.pos.c);
      return Math.max(dr, dc) === 1;
    }

    case "chooseAllyInRange": {
      if (!target.inst) return false;
      if (target.inst.instanceId === selected.instanceId) return false;
      if (target.inst.side !== selected.side) return false;

      const dr = Math.abs(target.r - selected.pos.r);
      const dc = Math.abs(target.c - selected.pos.c);
      if (Math.max(dr, dc) > def.range) return false;

      const targetDef = unitsById[target.inst.unitId];
      if (!targetDef) return false;

      const maxHp = getEffectiveMaxHp(targetDef.base.hp, target.inst.form ?? "base");
      if (def.requireDamagedAlly) return (target.inst.hp ?? 0) < maxHp;

      return true;
    }

    case "chooseLineDirection": {
      const dR = target.r - selected.pos.r;
      const dC = target.c - selected.pos.c;

      const absR = Math.abs(dR);
      const absC = Math.abs(dC);

      const isLine =
        (absR === 0 && absC > 0) || (absC === 0 && absR > 0) || (absR === absC && absR > 0);

      const dist = Math.max(absR, absC);
      return isLine && dist <= def.range;
    }

    default:
      return true;
  }
}
