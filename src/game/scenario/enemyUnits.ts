import type { UnitDef } from "../types";

export const BOAR_UNIT_DEF: UnitDef = {
  id: "BOAR",
  name: "ボア",
  enemyOnly: true,
  base: {
    atk: 2,
    hp: 8,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const scenarioEnemyUnits: UnitDef[] = [BOAR_UNIT_DEF];

export function getScenarioEnemyUnit(unitId: string) {
  return scenarioEnemyUnits.find((unit) => unit.id === unitId) ?? null;
}
