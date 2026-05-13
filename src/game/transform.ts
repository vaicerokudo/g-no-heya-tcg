import type { UnitDef, UnitInstance } from "./types";

export function applyYabukoTransform(
  instances: UnitInstance[],
  unitsById: Record<string, UnitDef>
) {
  const fmDef = unitsById["YABUKO_FM"];
  if (!fmDef) return instances;

  return instances.map((unit) => {
    if (unit.unitId !== "YABUKO_NORMAL") return unit;
    if (unit.hp > 3) return unit;

    const hp = Math.min(unit.hp, fmDef.base.hp);

    return {
      ...unit,
      unitId: "YABUKO_FM",
      form: unit.form ?? "base",
      hp,
    };
  });
}
