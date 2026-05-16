import type { UnitInstance } from "../types";

export function buildStatusRows(unit: UnitInstance | null | undefined): string[] {
  const rows: string[] = [];

  const stun = Number(unit?.stun ?? 0);
  if (stun > 0) rows.push(`スタン中：あと${stun}ターン`);

  const burn = Number(unit?.burn ?? 0);
  if (burn > 0) rows.push(`炎上中：あと${burn}ターン`);

  const dmgBonus = Number(unit?.dmgBonus ?? 0);
  if (dmgBonus > 0) rows.push(`通常攻撃 +${dmgBonus}`);

  const dmgReduction = Number(unit?.dmgReduction ?? 0);
  if (dmgReduction > 0) rows.push(`被ダメージ -${dmgReduction}`);

  if (unit?.hibikiShieldAllActive) rows.push("守護中：距離2以内の味方を守る");

  if (unit?.aegisLineActive) rows.push("守護結界：味方への被ダメージを軽減");

  return rows;
}
