import type { SkillDef } from "./registry";

export function isSkillUsed(usedSkills: Record<string, boolean>, key: string) {
  return !!usedSkills[key];
}

export function canUseSkillByUsage(def: SkillDef, usedSkills: Record<string, boolean>, key: string) {
  return !def.oncePerMatch || !isSkillUsed(usedSkills, key);
}
