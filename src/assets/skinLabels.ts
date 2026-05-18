import type { Skin } from "./imagePaths";

const SKIN_LABELS: Record<Skin, string> = {
  default: "デフォルト",
  dark: "闇",
  travel: "旅装",
  comic: "サウンドコミック",
};

export function getSkinLabel(skin: Skin): string {
  return SKIN_LABELS[skin];
}
