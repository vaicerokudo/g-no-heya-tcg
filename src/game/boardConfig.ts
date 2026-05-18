import type { Side } from "./types";

export type BoardSizeMode = "starter7" | "intermediate9";

export type BoardSizeConfig = {
  mode: BoardSizeMode;
  label: string;
  rows: number;
  cols: number;
  initialDeployCount: number;
  initialHandSize: number;
};

export const BOARD_SIZE_OPTIONS: BoardSizeConfig[] = [
  {
    mode: "starter7",
    label: "スターター 7x7",
    rows: 7,
    cols: 7,
    initialDeployCount: 3,
    initialHandSize: 5,
  },
  {
    mode: "intermediate9",
    label: "中級 9x9",
    rows: 9,
    cols: 9,
    initialDeployCount: 4,
    initialHandSize: 4,
  },
];

export function getBoardSizeConfig(mode: BoardSizeMode) {
  return BOARD_SIZE_OPTIONS.find((option) => option.mode === mode) ?? BOARD_SIZE_OPTIONS[0];
}

export function getLetters(cols: number) {
  return Array.from({ length: cols }, (_, index) => String.fromCharCode(65 + index));
}

export function getEvolveRow(rows: number) {
  return Math.floor(rows / 2);
}

export function isAtOrBeyondEvolveRow(side: Side, r: number, rows: number) {
  const evolveRow = getEvolveRow(rows);
  return side === "south" ? r <= evolveRow : r >= evolveRow;
}

export function getGateCols(cols: number) {
  const center = Math.floor(cols / 2);
  return [center - 2, center, center + 2].filter((c) => c >= 0 && c < cols);
}

export function getNorthGateRow() {
  return 0;
}

export function getSouthGateRow(rows: number) {
  return rows - 1;
}

export function getSouthReinforceStartRow(rows: number) {
  return getEvolveRow(rows);
}

export function getInitialDeployCandidateCols(cols: number) {
  if (cols === 9) return [2, 3, 4, 5, 6];
  return Array.from({ length: cols }, (_, index) => index);
}
