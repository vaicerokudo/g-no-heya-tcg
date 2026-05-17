import { useMemo } from "react";
import { getEffectiveMaxHp } from "../stats";
import type { UnitDef, UnitInstance } from "../types";
import { SKILLS, getAvailableSkillsForUnit, type SkillId } from "../skills/registry";

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

type UseSkillTargetingArgs = {
  skillMode: SkillId | null;
  selected: UnitInstance | null;
  gameOver: boolean;
  rows: number;
  cols: number;
  instances: UnitInstance[];
  unitsById: Record<string, UnitDef>;
};

export function useSkillTargeting({
  skillMode,
  selected,
  gameOver,
  rows,
  cols,
  instances,
  unitsById,
}: UseSkillTargetingArgs) {
  const selectedSkills =
    selected && !(selected.stun && selected.stun > 0) ? getAvailableSkillsForUnit(selected.unitId) : [];

  const skillTargetSet = useMemo(() => {
    const s = new Set<string>();
    if (!skillMode || !selected || gameOver) return s;

    const def = SKILLS[skillMode];
    if (!def) return s;
    if (def.requiresForm && selected.form !== def.requiresForm) return s;

    const occLocal = new Map<string, UnitInstance>();
    for (const u of instances) occLocal.set(posKey(u.pos.r, u.pos.c), u);

    const dirs8 = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const;

    if (def.targetMode === "enemiesInRange") {
      const R = def.range ?? 0;
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const dr = Math.abs(rr - selected.pos.r);
          const dc = Math.abs(cc - selected.pos.c);
          if (Math.max(dr, dc) <= R) s.add(posKey(rr, cc));
        }
      }
    }

    if (def.targetMode === "chooseEnemyAdjacent") {
      for (const [dr, dc] of dirs8) {
        const rr = selected.pos.r + dr;
        const cc = selected.pos.c + dc;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
        const hit = occLocal.get(posKey(rr, cc));
        if (hit && hit.side !== selected.side) s.add(posKey(rr, cc));
      }
    }

    if (def.targetMode === "chooseAllyInRange") {
      const R = def.range ?? 0;
      for (const unit of instances) {
        if (unit.instanceId === selected.instanceId) continue;
        if (unit.side !== selected.side) continue;

        const dr = Math.abs(unit.pos.r - selected.pos.r);
        const dc = Math.abs(unit.pos.c - selected.pos.c);
        if (Math.max(dr, dc) > R) continue;

        const targetDef = unitsById[unit.unitId];
        if (!targetDef) continue;

        const maxHp = getEffectiveMaxHp(targetDef.base.hp, unit.form ?? "base");
        if (def.requireDamagedAlly && (unit.hp ?? 0) >= maxHp) continue;

        s.add(posKey(unit.pos.r, unit.pos.c));
      }
    }

    if (def.targetMode === "chooseLineDirection") {
      for (const [dr, dc] of dirs8) {
        for (let i = 1; i <= def.range; i++) {
          const rr = selected.pos.r + dr * i;
          const cc = selected.pos.c + dc * i;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;

          const k = posKey(rr, cc);
          s.add(k);

          if (occLocal.get(k)) break;
        }
      }
    }

    if (def.targetMode === "instant") {
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const dr = Math.abs(rr - selected.pos.r);
          const dc = Math.abs(cc - selected.pos.c);
          if (Math.max(dr, dc) <= def.aoeRadius) s.add(posKey(rr, cc));
        }
      }
    }

    if (def.targetMode === "chooseFront3Cells") {
      const fr = selected.side === "south" ? -1 : 1;
      const frontRows = def.frontRows ?? 1;
      for (let row = 1; row <= frontRows; row++) {
        const rr = selected.pos.r + fr * row;
        for (const dc of [-1, 0, 1]) {
          const cc = selected.pos.c + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          s.add(posKey(rr, cc));
        }
      }
    }

    return s;
  }, [skillMode, selected, gameOver, rows, cols, instances, unitsById]);

  return { selectedSkills, skillTargetSet };
}
