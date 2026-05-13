import type { UnitDef, UnitInstance } from "../types";

type CreateSkillExecutionContextArgs = {
  rows: number;
  cols: number;
  instances: UnitInstance[];
  unitsById: Record<string, UnitDef>;
  selected: UnitInstance;
};

export type SkillExecutionContext = {
  stateLike: {
    rows: number;
    cols: number;
    instances: UnitInstance[];
    unitsById: Record<string, UnitDef>;
  };
  casterId: string;
};

export function createSkillExecutionContext({
  rows,
  cols,
  instances,
  unitsById,
  selected,
}: CreateSkillExecutionContextArgs): SkillExecutionContext {
  return {
    stateLike: { rows, cols, instances, unitsById },
    casterId: selected.instanceId,
  };
}
