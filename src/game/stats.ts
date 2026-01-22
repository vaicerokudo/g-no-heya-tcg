import type { Form } from "./types";

export function formBonus(form: Form) {
  if (form === "g") return { atk: 1, maxHp: 1 };
  return { atk: 0, maxHp: 0 };
}

export function getEffectiveAtk(baseAtk: number, form: Form) {
  return baseAtk + formBonus(form).atk;
}

export function getEffectiveMaxHp(baseHp: number, form: Form) {
  return baseHp + formBonus(form).maxHp;
}
