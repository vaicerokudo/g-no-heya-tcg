// src/assets/imagePaths.ts
export type Side = "north" | "south";
export type Form = "base" | "g";
export type Skin = "default" | "dark" | "travel"; // 増えたら追加

function normId(unitId: string) {
  return unitId.trim().toLowerCase();
}

export function getCardImage(
  unitId: string,
  side: Side,
  form: Form = "base",
  skin: Skin = "default"
) {
  return `/cards/${side}/${skin}/${form}/${normId(unitId)}.png`;
}

export function getPortrait(
  unitId: string,
  side: Side,
  form: Form = "base",
  skin: Skin = "default"
) {
  return `/portraits/${side}/${skin}/${form}/${normId(unitId)}.png`;
}

// 既存の export type Side/Form/Skin と normId はそのまま

export function cardCandidates(
  unitId: string,
  side: Side,
  form: Form = "base",
  skin: Skin = "default"
) {
  const id = normId(unitId);
  const list = [
    `/cards/${side}/${skin}/${form}/${id}.png`,
    `/cards/${side}/default/${form}/${id}.png`,
    `/cards/${side}/default/base/${id}.png`,
    `/cards/unknown.png`,
  ];
  // 重複除去（skin=defaultの時など）
  return Array.from(new Set(list));
}

export function portraitCandidates(
  unitId: string,
  side: Side,
  form: Form = "base",
  skin: Skin = "default"
) {
  const id = normId(unitId);
  const list = [
    `/portraits/${side}/${skin}/${form}/${id}.png`,
    `/portraits/${side}/default/${form}/${id}.png`,
    `/portraits/${side}/default/base/${id}.png`,
    `/portraits/unknown.png`,
  ];
  return Array.from(new Set(list));
}
