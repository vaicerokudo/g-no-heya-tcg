export function getLetters(cols: number) {
  return Array.from({ length: cols }, (_, index) => String.fromCharCode(65 + index));
}

export function getEvolveRow(rows: number) {
  return Math.floor(rows / 2);
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
