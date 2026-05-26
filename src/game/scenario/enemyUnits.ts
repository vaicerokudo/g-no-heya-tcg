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

export const LESSER_WYVERN_UNIT_DEF: UnitDef = {
  id: "LESSER_WYVERN",
  name: "レッサーワイバーン",
  enemyOnly: true,
  base: {
    atk: 3,
    hp: 10,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const GOBLIN_UNIT_DEF: UnitDef = {
  id: "GOBLIN",
  name: "ゴブリン",
  enemyOnly: true,
  base: {
    atk: 2,
    hp: 4,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const HIDDEN_MYOUOU_UNIT_DEF: UnitDef = {
  id: "HIDDEN_MYOUOU",
  name: "明王・試練",
  enemyOnly: true,
  base: {
    atk: 5,
    hp: 18,
    movePattern: { type: "orthogonal", range: 2, diagonal: false, canPassThroughUnits: false },
  },
};

export const ROKUDO_AUTHOR_UNIT_DEF: UnitDef = {
  id: "ROKUDO_AUTHOR",
  name: "作者ロクド",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 6,
    hp: 30,
    movePattern: { type: "orthogonal", range: 2, diagonal: false, canPassThroughUnits: false },
  },
};

export const scenarioEnemyUnits: UnitDef[] = [
  BOAR_UNIT_DEF,
  LESSER_WYVERN_UNIT_DEF,
  GOBLIN_UNIT_DEF,
  HIDDEN_MYOUOU_UNIT_DEF,
  ROKUDO_AUTHOR_UNIT_DEF,
];

export function getScenarioEnemyUnit(unitId: string) {
  return scenarioEnemyUnits.find((unit) => unit.id === unitId) ?? null;
}
