// src/game/types.ts

export type Side = "south" | "north";
export type Form = "base" | "g";

export type Pos = { r: number; c: number };

export type UnitInstance = {
  instanceId: string;
  unitId: string;
  side: Side;
  pos: Pos;
  hp: number;
  form: Form;      // ★ここが必須
  stun?: number;
  burn?: number;
};



export type Shape = "chebyshev" | "orthogonal";

export type MovePattern =
  | {
      type: "orthogonal";
      range: number;
      diagonal: boolean;
      canPassThroughUnits: boolean;
    }
  | {
      type: "custom";
      movesRelative: Array<{ dx: number; dy: number }>;
      canPassThroughUnits: boolean;
    }
  | {
      type: "teleportFixed";
      destinationsRelative: Array<{ dx: number; dy: number }>;
      canPassThroughUnits: boolean;
    };


export type RangeSpec =
  | { shape: Shape; distance: number; includeSelf?: boolean }
  | { shape: "chebyshev"; distance: number; includeSelf?: boolean }
  | { shape: "orthogonal"; distance: number; includeSelf?: boolean };

export type Targeting =
  | { mode: "cells"; cellsRelative: Array<{ dx: number; dy: number }>; facingRequired?: boolean }
  | { mode: "aura"; range: RangeSpec }
  | { mode: "globalAllies" }
  | { mode: "global" }
  | { mode: "enemiesInRange"; range: RangeSpec }
  | { mode: "enemyInRange"; range: RangeSpec }
  | { mode: "enemyLine"; range: number; lineOfSightBlockedByUnits: boolean }
  | { mode: "triggered"; range: RangeSpec }
  | { mode: "markCells"; cellsRelative: Array<{ dx: number; dy: number }>; facingRequired?: boolean }
  | {
      mode: "chooseOriginWithinRangeThenLine";
      originRange: RangeSpec;
      lineDirections: "8";
    }
  | { mode: "lineFromSelf"; lineDirections: "8" }
  | { mode: "allyInRange"; range: RangeSpec };

export type Passive = {
  id: string;
  name: string;
  effect: string;
  range?: RangeSpec;
  params?: Record<string, unknown>;
  extras?: string[];
};

export type Skill = {
  id: string;
  name: string;
  type: "active";
  oncePerMatch: boolean;
  requiresEvolved?: boolean;
  targeting: Targeting;
  restrictions?: Array<Record<string, unknown>>;
  effect: Record<string, unknown>;
};

export type UnitDef = {
  id: string;
  name: string;
  base: { atk: number; hp: number; movePattern: MovePattern };
  evolve?: { grantsSkill2?: boolean };
  passives?: Passive[];
  attacks?: Record<string, unknown>;
  skills?: { skill1?: Skill; skill2?: Skill };
  transform?: {
    toUnitId: string;
    trigger: { type: "hpThreshold"; value: number; comparison: "<=" };
  };
};

export type UnitsData = {
  meta: Record<string, unknown>;
  statusEffects: Record<string, unknown>;
  sharedRules: Record<string, unknown>;
  units: UnitDef[];
};
