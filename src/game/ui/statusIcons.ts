import type { UnitInstance } from "../types";

export type StatusIcon = {
  key: string;
  label: string;
  title: string;
};

export function buildStatusIcons(unit: UnitInstance | null | undefined): StatusIcon[] {
  const icons: StatusIcon[] = [];

  const stun = Number(unit?.stun ?? 0);
  if (stun > 0) {
    icons.push({
      key: "stun",
      label: "STUN",
      title: `スタン中：あと${stun}ターン`,
    });
  }

  const burn = Number(unit?.burn ?? 0);
  if (burn > 0) {
    icons.push({
      key: "burn",
      label: "BURN",
      title: `炎上中：あと${burn}ターン`,
    });
  }

  const dmgBonus = Number(unit?.dmgBonus ?? 0);
  if (dmgBonus > 0) {
    icons.push({
      key: "atk",
      label: "ATK+",
      title: `通常攻撃 +${dmgBonus}`,
    });
  }

  return icons;
}
