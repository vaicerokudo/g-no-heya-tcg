import type { UnitsData, UnitDef, Side, Form } from "./types";

export type Pos = { r: number; c: number }; // 0-based

export type UnitInstance = {
  instanceId: string;
  unitId: string;
  side: Side;
  hp: number;
  form: Form;        // ★B方式のコア
  pos: Pos;

  // ★Step1：ここを追加（状態異常カウンタ）
  stun?: number; // 1以上で行動不可（あなたの現仕様）
  burn?: number; // 残りtick数（例: 3）
};

export type GameState = {
  rows: number;
  cols: number;
  unitsById: Record<string, UnitDef>;
  instances: UnitInstance[];
  selectedInstanceId: string | null;
};

export function buildUnitsById(data: UnitsData) {
  const map: Record<string, UnitDef> = {};
  for (const u of data.units) map[u.id] = u;
  return map;
}

export function createDemoState(data: UnitsData): GameState {
  const rows = 7;
  const cols = 7;
  const unitsById = buildUnitsById(data);

  const mk = (instanceId: string, unitId: string, side: Side, pos: Pos): UnitInstance => {
    const def = unitsById[unitId];
    if (!def) throw new Error(`Unknown unitId: ${unitId}`);
    return {
      instanceId,
      unitId,
      side,
      hp: def.base.hp,
      form: "base",   // ★初期は必ず base
      pos,
    };
  };

  // デモ配置（南=プレイヤー、北=CPU想定）
  const instances: UnitInstance[] = [
    mk("S1", "MYOUOU", "south", { r: 6, c: 3 }),   // D7
    mk("S2", "SOCHO", "south", { r: 6, c: 2 }), // C7
    mk("S3", "TSUTSU", "south", { r: 6, c: 4 }),// E7

    mk("N1", "MYOUOU", "north", { r: 0, c: 3 }),   // D1
    mk("N2", "SOCHO", "north", { r: 0, c: 2 }), // C1
    mk("N3", "TSUTSU", "north", { r: 0, c: 4 }) // E1
  ];

  return { rows, cols, unitsById, instances, selectedInstanceId: null };
}
