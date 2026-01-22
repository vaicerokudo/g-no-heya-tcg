// src/game/skills/index.ts
// 既存: export { applyUshimaruGKantetsu } ... がある想定


export function applySochoIaijutsu(
  stateLike: { rows: number; cols: number; instances: any[] },
  casterId: string,
  targetId: string,
  damage: number
) {
  const instances = stateLike.instances;

  const caster = instances.find((u) => u.instanceId === casterId);
  const target = instances.find((u) => u.instanceId === targetId);
  if (!caster || !target) return instances;

  // 敵のみ
  if (caster.side === target.side) return instances;

  // 8方向隣接（縦横斜め）
  const dr = Math.abs(caster.pos.r - target.pos.r);
  const dc = Math.abs(caster.pos.c - target.pos.c);
  if (Math.max(dr, dc) !== 1) return instances;

  // ダメージ適用
  const next = instances.map((u) => {
    if (u.instanceId !== targetId) return u;
    return { ...u, hp: u.hp - damage };
  });

  // 死亡除去（プロジェクト側ルールに合わせて）
  return next.filter((u) => u.hp > 0);
}
