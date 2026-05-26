import type { UnitInstance } from "../types";
import type { SkillDef } from "./registry";
import type { SkillExecutionContext } from "./executionContext";

type SkillExecutionTarget = {
  r: number;
  c: number;
  inst: UnitInstance | null;
};

type ExecuteSkillToInstancesArgs = {
  def: SkillDef;
  skillContext: SkillExecutionContext;
  selected: UnitInstance;
  target?: SkillExecutionTarget;
};

export function executeSkillToInstances({
  def,
  skillContext,
  selected,
  target,
}: ExecuteSkillToInstancesArgs): UnitInstance[] | null {
  switch (def.targetMode) {
    case "chooseFront3Cells":
      return def.execute({
        stateLike: skillContext.stateLike,
        casterId: skillContext.casterId,
        damage: def.damage,
        burnTicks: def.burnTicks,
        stunTurns: def.stunTurns,
      }) as UnitInstance[];

    case "chooseEnemyAdjacent":
      if (!target?.inst) return null;
      return def.execute({
        stateLike: skillContext.stateLike,
        casterId: skillContext.casterId,
        targetId: target.inst.instanceId,
        damage: def.damage,
        knockback: def.knockback,
        stunTurns: def.stunTurns,
      }) as UnitInstance[];

    case "chooseAllyInRange":
      if (!target?.inst) return null;
      return def.execute({
        stateLike: skillContext.stateLike,
        casterId: skillContext.casterId,
        targetId: target.inst.instanceId,
        range: def.range,
        heal: def.heal,
      }) as UnitInstance[];

    case "chooseLineDirection": {
      if (!target) return null;

      const dR = target.r - selected.pos.r;
      const dC = target.c - selected.pos.c;

      return def.execute({
        stateLike: skillContext.stateLike,
        casterId: skillContext.casterId,
        dirR: Math.sign(dR),
        dirC: Math.sign(dC),
        range: def.range,
        damage: def.damage,
        knockback: def.knockback,
        burnTicks: def.burnTicks,
        stunTurns: def.stunTurns,
      }) as UnitInstance[];
    }

    case "enemiesInRange":
      return def.execute({
        stateLike: skillContext.stateLike,
        casterId: skillContext.casterId,
        range: def.range,
        damage: def.damage,
      }) as UnitInstance[];

    case "instant":
      return def.execute({
        stateLike: skillContext.stateLike,
        casterId: skillContext.casterId,
        aoeRadius: def.aoeRadius,
        damage: def.damage,
        knockback: def.knockback,
        stunTurns: def.stunTurns,
      }) as UnitInstance[];

    default:
      return null;
  }
}
