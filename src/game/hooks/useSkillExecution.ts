import type { Dispatch, SetStateAction } from "react";
import type { Side, UnitDef, UnitInstance } from "../types";
import { SKILLS, skillKey, type SkillDef, type SkillId } from "../skills/registry";
import { executeSkillToInstances } from "../skills/execution";
import { createSkillExecutionContext } from "../skills/executionContext";
import { canStartSkillExecution } from "../skills/canStartSkillExecution";
import { canUseSkillByUsage } from "../skills/canExecuteSkill";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type SkillFireLogPayload = {
  turn: Side;
  casterId: string;
  unitId: string;
  skillId: SkillId;
  targetMode: SkillDef["targetMode"];
};

type SkillTryLogPayload = {
  turn: Side;
  casterId: string;
  unitId: string;
  skillMode: SkillId;
  cell: { r: number; c: number };
  hasInst: boolean;
};

type UseSkillExecutionArgs = {
  turn: Side;
  unitsById: Record<string, UnitDef>;
  applyNextInstances: (next: UnitInstance[]) => void;
  logSkill: (ev: "TRY" | "FIRE", payload: SkillTryLogPayload | SkillFireLogPayload) => void;
  onSkillFired?: (payload: { casterId: string; skillId: SkillId }) => void;
  onSkillImpact?: (payload: {
    skillId: SkillId;
    casterId: string;
    impacts: Array<{ targetId: string; r: number; c: number }>;
  }) => void;
  setPerUnitTurn: Dispatch<SetStateAction<PerUnitTurn>>;
  setUsedSkills: Dispatch<SetStateAction<Record<string, boolean>>>;
  setSkillMode: Dispatch<SetStateAction<SkillId | null>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
};

type SuccessfulSkillExecutionArgs = {
  nextInstances: UnitInstance[];
  selected: UnitInstance;
  def: SkillDef;
  key: string;
  casterId: string;
};

type SkillExecutionTarget = {
  r: number;
  c: number;
  inst: UnitInstance | null;
};

type ExecuteSkillArgs = {
  def: SkillDef;
  selected: UnitInstance;
  key: string;
  rows: number;
  cols: number;
  instances: UnitInstance[];
  unitsById: Record<string, UnitDef>;
  target?: SkillExecutionTarget;
};

type TryExecuteSkillOnCellArgs = {
  skillMode: SkillId;
  selected: UnitInstance | null;
  gameOver: boolean;
  perUnitTurn: PerUnitTurn;
  usedSkills: Record<string, boolean>;
  skillTargetSet: Set<string>;
  rows: number;
  cols: number;
  instances: UnitInstance[];
  target: SkillExecutionTarget;
};

type TryExecuteImmediateSkillArgs = {
  def: SkillDef;
  selected: UnitInstance | null;
  usedSkills: Record<string, boolean>;
  rows: number;
  cols: number;
  instances: UnitInstance[];
};

function statusValue(value: number | undefined) {
  return value ?? 0;
}

function buildSkillImpactTargets({
  prevInstances,
  nextInstances,
  caster,
}: {
  prevInstances: UnitInstance[];
  nextInstances: UnitInstance[];
  caster: UnitInstance;
}) {
  const nextById = new Map(nextInstances.map((unit) => [unit.instanceId, unit]));

  return prevInstances
    .filter((unit) => unit.instanceId !== caster.instanceId)
    .filter((unit) => unit.side !== caster.side)
    .filter((unit) => {
      const next = nextById.get(unit.instanceId);
      if (!next) return true;
      if ((next.hp ?? 0) < (unit.hp ?? 0)) return true;
      if (statusValue(next.burn) > statusValue(unit.burn)) return true;
      if (statusValue(next.stun) > statusValue(unit.stun)) return true;
      if (next.pos.r !== unit.pos.r || next.pos.c !== unit.pos.c) return true;
      return false;
    })
    .map((unit) => ({
      targetId: unit.instanceId,
      r: unit.pos.r,
      c: unit.pos.c,
    }));
}

export function useSkillExecution({
  turn,
  unitsById,
  applyNextInstances,
  logSkill,
  onSkillFired,
  onSkillImpact,
  setPerUnitTurn,
  setUsedSkills,
  setSkillMode,
  setSelectedId,
}: UseSkillExecutionArgs) {
  function finishExecutedSkill(casterId: string, def: SkillDef, key: string) {
    setPerUnitTurn((m) => ({
      ...m,
      [casterId]: {
        ...(m[casterId] ?? { moved: false, attacked: false, done: false }),
        attacked: true,
        done: true,
      },
    }));

    if (def.oncePerMatch) setUsedSkills((m) => ({ ...m, [key]: true }));

    setSkillMode(null);
    setSelectedId(null);
  }

  function handleSuccessfulSkillExecution({
    nextInstances,
    selected,
    def,
    key,
    casterId,
  }: SuccessfulSkillExecutionArgs) {
    applyNextInstances(nextInstances);

    logSkill("FIRE", {
      turn,
      casterId: selected.instanceId,
      unitId: selected.unitId,
      skillId: def.id,
      targetMode: def.targetMode,
    });

    finishExecutedSkill(casterId, def, key);
    onSkillFired?.({ casterId, skillId: def.id });
  }

  function executeSkill({ def, selected, key, rows, cols, instances, unitsById, target }: ExecuteSkillArgs) {
    const skillContext = createSkillExecutionContext({ rows, cols, instances, unitsById, selected });
    const nextInstances = executeSkillToInstances({ def, skillContext, selected, target });
    if (!nextInstances) return false;

    const impacts = buildSkillImpactTargets({
      prevInstances: instances,
      nextInstances,
      caster: selected,
    });

    if (impacts.length > 0) {
      onSkillImpact?.({
        skillId: def.id,
        casterId: skillContext.casterId,
        impacts,
      });
    }

    handleSuccessfulSkillExecution({
      nextInstances,
      selected,
      def,
      key,
      casterId: skillContext.casterId,
    });

    return true;
  }

  function tryExecuteSkillOnCell({
    skillMode,
    selected,
    gameOver,
    perUnitTurn,
    usedSkills,
    skillTargetSet,
    rows,
    cols,
    instances,
    target,
  }: TryExecuteSkillOnCellArgs) {
    if (!selected) return false;

    logSkill("TRY", {
      turn,
      casterId: selected.instanceId,
      unitId: selected.unitId,
      skillMode,
      cell: { r: target.r, c: target.c },
      hasInst: !!target.inst,
    });

    const def = SKILLS[skillMode];
    if (!def) return false;

    const key = skillKey(turn, selected.instanceId, def.id);

    if (
      !canStartSkillExecution({
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
      })
    ) {
      return false;
    }

    return executeSkill({ def, selected, key, rows, cols, instances, unitsById, target });
  }

  function tryExecuteImmediateSkill({
    def,
    selected,
    usedSkills,
    rows,
    cols,
    instances,
  }: TryExecuteImmediateSkillArgs) {
    if (!selected) return false;

    const key = skillKey(turn, selected.instanceId, def.id);
    if (!canUseSkillByUsage(def, usedSkills, key)) return false;

    return executeSkill({ def, selected, key, rows, cols, instances, unitsById });
  }

  return { executeSkill, tryExecuteSkillOnCell, tryExecuteImmediateSkill };
}
