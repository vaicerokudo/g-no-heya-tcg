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

export const BEAR_UNIT_DEF: UnitDef = {
  id: "BEAR",
  name: "ベア",
  enemyOnly: true,
  base: {
    atk: 3,
    hp: 8,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const ZIMA_UNIT_DEF: UnitDef = {
  id: "ZIMA",
  name: "ジーマ",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 0,
    hp: 5,
    movePattern: { type: "orthogonal", range: 2, diagonal: false, canPassThroughUnits: false },
  },
};

export const PROTO_ROBOT_UNIT_DEF: UnitDef = {
  id: "PROTO_ROBOT",
  name: "試作ロボ",
  enemyOnly: true,
  base: {
    atk: 2,
    hp: 6,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const ROKU_CLONE_UNIT_DEF: UnitDef = {
  id: "ROKU_CLONE",
  name: "ロク",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 4,
    hp: 2,
    movePattern: {
      type: "teleportFixed",
      destinationsRelative: [
        { dx: 2, dy: 0 },
        { dx: -2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: 0, dy: -2 },
        { dx: 2, dy: 2 },
        { dx: 2, dy: -2 },
        { dx: -2, dy: 2 },
        { dx: -2, dy: -2 },
      ],
      canPassThroughUnits: true,
    },
  },
};

export const BLACK_NOISE_ROKU_UNIT_DEF: UnitDef = {
  id: "BLACK_NOISE_ROKU",
  name: "暴走ロク",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 3,
    hp: 4,
    movePattern: {
      type: "teleportFixed",
      destinationsRelative: [
        { dx: 2, dy: 0 },
        { dx: -2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: 0, dy: -2 },
        { dx: 2, dy: 2 },
        { dx: 2, dy: -2 },
        { dx: -2, dy: 2 },
        { dx: -2, dy: -2 },
      ],
      canPassThroughUnits: true,
    },
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

export const MONTEN_UNIT_DEF: UnitDef = {
  id: "MONTEN",
  name: "\u9580\u5929",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 3,
    hp: 7,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const ROKUDO_AUTHOR_UNIT_DEF: UnitDef = {
  id: "ROKUDO_AUTHOR",
  name: "作者ロクド",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 10,
    hp: 69,
    movePattern: { type: "orthogonal", range: 2, diagonal: false, canPassThroughUnits: false },
  },
};

export const SCORPION_UNIT_DEF: UnitDef = {
  id: "SCORPION",
  name: "スコーピオン",
  enemyOnly: true,
  base: {
    atk: 2,
    hp: 5,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const ROCK_GOLEM_UNIT_DEF: UnitDef = {
  id: "ROCK_GOLEM",
  name: "ロックゴーレム",
  enemyOnly: true,
  base: {
    atk: 3,
    hp: 8,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const GIANT_SCORPION_UNIT_DEF: UnitDef = {
  id: "GIANT_SCORPION",
  name: "ジャイアントスコーピオン",
  enemyOnly: true,
  base: {
    atk: 4,
    hp: 14,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const KILLER_FISH_UNIT_DEF: UnitDef = {
  id: "KILLER_FISH",
  name: "キラーフィッシュ",
  enemyOnly: true,
  base: {
    atk: 2,
    hp: 4,
    movePattern: { type: "orthogonal", range: 2, diagonal: false, canPassThroughUnits: false },
  },
};

export const OCTOPUS_UNIT_DEF: UnitDef = {
  id: "OCTOPUS",
  name: "オクトパス",
  enemyOnly: true,
  base: {
    atk: 2,
    hp: 8,
    movePattern: { type: "orthogonal", range: 1, diagonal: true, canPassThroughUnits: false },
  },
};

export const KRAKEN_UNIT_DEF: UnitDef = {
  id: "KRAKEN",
  name: "クラーケン",
  enemyOnly: true,
  base: {
    atk: 3,
    hp: 16,
    movePattern: { type: "orthogonal", range: 1, diagonal: true, canPassThroughUnits: false },
  },
};

export const MIST_LEVIATHAN_UNIT_DEF: UnitDef = {
  id: "MIST_LEVIATHAN",
  name: "霧のリヴァイアサン",
  enemyOnly: true,
  hiddenFromCatalog: true,
  base: {
    atk: 4,
    hp: 24,
    movePattern: { type: "orthogonal", range: 1, diagonal: false, canPassThroughUnits: false },
  },
};

export const scenarioEnemyUnits: UnitDef[] = [
  BOAR_UNIT_DEF,
  LESSER_WYVERN_UNIT_DEF,
  GOBLIN_UNIT_DEF,
  BEAR_UNIT_DEF,
  ZIMA_UNIT_DEF,
  PROTO_ROBOT_UNIT_DEF,
  ROKU_CLONE_UNIT_DEF,
  BLACK_NOISE_ROKU_UNIT_DEF,
  HIDDEN_MYOUOU_UNIT_DEF,
  MONTEN_UNIT_DEF,
  ROKUDO_AUTHOR_UNIT_DEF,
  SCORPION_UNIT_DEF,
  ROCK_GOLEM_UNIT_DEF,
  GIANT_SCORPION_UNIT_DEF,
  KILLER_FISH_UNIT_DEF,
  OCTOPUS_UNIT_DEF,
  KRAKEN_UNIT_DEF,
  MIST_LEVIATHAN_UNIT_DEF,
];

export function getScenarioEnemyUnit(unitId: string) {
  return scenarioEnemyUnits.find((unit) => unit.id === unitId) ?? null;
}
