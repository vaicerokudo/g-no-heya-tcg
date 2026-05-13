export function damageOne(instances: any[], targetId: string, amount: number) {
  return instances
    .map((u) => (u.instanceId === targetId ? { ...u, hp: (u.hp ?? 0) - amount } : u))
    .filter((u) => (u.hp ?? 0) > 0);
}

export function chebDist(a: { r: number; c: number }, b: { r: number; c: number }) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
}
