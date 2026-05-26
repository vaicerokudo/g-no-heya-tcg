import type { UnitInstance } from "../types";

const AUTHOR_UNIT_ID = "ROKUDO_AUTHOR";
const AUTHOR_DAMAGE_CAP_PER_TURN = 16;

type DamageOptions = {
  applyDmgReduction?: boolean;
};

function getAuthorLimitedDamage(unit: UnitInstance, damage: number) {
  if (unit.unitId !== AUTHOR_UNIT_ID) {
    return { damage, damageTakenThisTurn: unit.authorDamageTakenThisTurn };
  }

  const damageTakenThisTurn = Math.max(0, unit.authorDamageTakenThisTurn ?? 0);
  const remaining = Math.max(0, AUTHOR_DAMAGE_CAP_PER_TURN - damageTakenThisTurn);
  const limitedDamage = Math.min(damage, remaining);

  return {
    damage: limitedDamage,
    damageTakenThisTurn: damageTakenThisTurn + limitedDamage,
  };
}

function applyAuthorReflection(
  instances: UnitInstance[],
  sourceId: string | undefined,
  targetId: string,
  targetWasAuthor: boolean,
  damageDealt: number
) {
  if (!targetWasAuthor || damageDealt <= 0 || !sourceId || sourceId === targetId) {
    return instances;
  }

  return instances
    .map((unit) =>
      unit.instanceId === sourceId ? { ...unit, hp: Math.max(0, unit.hp - 1) } : unit
    )
    .filter((unit) => unit.hp > 0);
}

export function applyUnitDamage(
  instances: UnitInstance[],
  targetId: string,
  amount: number,
  sourceId?: string,
  options: DamageOptions = {}
) {
  const rawDamage = Math.max(0, amount ?? 0);
  if (rawDamage <= 0) return instances;

  let targetWasAuthor = false;
  let damageDealt = 0;

  const next = instances
    .map((unit) => {
      if (!unit || unit.instanceId !== targetId) return unit;

      const reduction = options.applyDmgReduction ? Math.max(0, unit.dmgReduction ?? 0) : 0;
      const reducedDamage = Math.max(0, rawDamage - reduction);
      const limited = getAuthorLimitedDamage(unit, reducedDamage);

      targetWasAuthor = unit.unitId === AUTHOR_UNIT_ID;
      damageDealt = limited.damage;

      const nextUnit = {
        ...unit,
        hp: Math.max(0, unit.hp - limited.damage),
      };

      if (unit.unitId === AUTHOR_UNIT_ID) {
        return { ...nextUnit, authorDamageTakenThisTurn: limited.damageTakenThisTurn };
      }

      return nextUnit;
    })
    .filter((unit) => unit.hp > 0);

  return applyAuthorReflection(next, sourceId, targetId, targetWasAuthor, damageDealt);
}
