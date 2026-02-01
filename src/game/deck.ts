// src/game/deck.ts
export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawN<T>(deck: T[], n: number) {
  const take = deck.slice(0, n);
  const rest = deck.slice(n);
  return { take, rest };
}
