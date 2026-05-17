// src/assets/imagePaths.ts
export type Side = "north" | "south";
export type Form = "base" | "g";
export type Skin = "default" | "dark" | "travel" | "comic"; // add new skin names here

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

export function portraitThumbCandidates(
  unitId: string,
  side: Side,
  form: Form = "base",
  skin: Skin = "default"
) {
  const id = normId(unitId);
  const list = [
    `/portraits/thumb/${side}/${skin}/${form}/${id}.webp`,
    `/portraits/${side}/${skin}/${form}/${id}.png`,
    `/portraits/${side}/${skin}/base/${id}.png`,
    `/portraits/thumb/${side}/default/${form}/${id}.webp`,
    `/portraits/thumb/${side}/default/base/${id}.webp`,
    `/portraits/${side}/default/${form}/${id}.png`,
    `/portraits/${side}/default/base/${id}.png`,
    `/portraits/unknown.png`,
  ];
  return Array.from(new Set(list));
}
