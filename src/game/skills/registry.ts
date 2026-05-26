// src/game/skills/registry.ts
import type { Side, UnitDef } from "../types";
import {
  dealDamage,
  healUnit,
  addStun,
  addBurn,
  removeDead,
  collectLineTargets,
  knockback1,
} from "./skillRuntime";
import { computeFinalDamage } from "../combat/damage";
import { isBackOrSideSimple } from "../combat/facing";
import { getEffectiveMaxHp } from "../stats";

// =====================
// ids / target modes
// =====================
export type SkillId =
  | "tsutsu_mietenda"
  | "tsutsu_chikayorasenee_g"
  | "socho_iaijutsu"
  | "socho_rensen_g"
  | "ushimaru_pierce"
  | "ushimaru_kantetsu_g"
  | "myouou_yaki_harau"
  | "myouou_karyura_g"
  | "rockel_slash"
  | "rockel_whirlwind_g"
  | "hibiki_shield_all"
  | "hibiki_aegisline_g"
  | "rokudo_kage_nui"
  | "rokudo_poison_stun_g"
  | "player_support_shot"
  | "player_overclock_g"
  | "deli_throw"
  | "deli_uncontrolled_explosion_g"
  | "7171_gaze"
  | "7171_shisen_no_ori_g"
  | "yabuko_deliver"
  | "yabuko_fm_smash";

export type SkillTargetMode =
  | "chooseLineDirection"
  | "chooseEnemyAdjacent"
  | "chooseFront3Cells"
  | "instant"
  | "enemiesInRange"
  | "chooseAllyInRange";

// =====================
// args
// =====================
type StateLikeLite = {
  rows: number;
  cols: number;
  instances: any[];
  unitsById?: Record<string, UnitDef>;
};

export type ChooseFront3CellsArgs = {
  stateLike: StateLikeLite;
  casterId: string;
  damage: number;
  burnTicks?: number;
  stunTurns?: number;
};

export type ChooseLineDirectionArgs = {
  stateLike: StateLikeLite;
  casterId: string;
  dirR: number;
  dirC: number;
  range: number;
  damage: number;
  knockback: number;
  stunTurns?: number;
  burnTicks?: number;
};

export type ChooseEnemyAdjacentArgs = {
  stateLike: StateLikeLite;
  casterId: string;
  targetId: string;
  damage: number;
  knockback?: number;
  stunTurns?: number;
};

export type InstantArgs = {
  stateLike: StateLikeLite;
  casterId: string;
  aoeRadius: number;
  damage: number;
  knockback: number;
  stunTurns?: number;

  // instant系で必要になった拡張（7171, Deli(G)など）
  range?: number;
  burnTicks?: number;
  selfDamage?: number;
};

export type EnemiesInRangeArgs = {
  stateLike: StateLikeLite;
  casterId: string;
  range: number;
  damage: number;
};

export type ChooseAllyInRangeArgs = {
  stateLike: StateLikeLite;
  casterId: string;
  targetId: string;
  range: number;
  heal: number;
};

// =====================
// defs (safe union)
// =====================
type Common = {
  id: SkillId;
  label: string;
  unitId: string;
  requiresForm?: "g";
  oncePerMatch: boolean;
  desc?: string;

  // メタ情報（型安全のためここに寄せる）
  stunTurns?: number;
  burnTicks?: number;
  range?: number; // 7171など
  selfDamage?: number; // Deli(G)など
};

export type SkillDef =
  | (Common & {
      targetMode: "chooseLineDirection";
      range: number;
      damage: number;
      knockback: number;
      execute: (args: ChooseLineDirectionArgs) => any[];
    })
  | (Common & {
      targetMode: "chooseEnemyAdjacent";
      damage: number;
      knockback?: number;
      execute: (args: ChooseEnemyAdjacentArgs) => any[];
    })
  | (Common & {
      targetMode: "instant";
      aoeRadius: number;
      damage: number;
      knockback: number;
      execute: (args: InstantArgs) => any[];
    })
  | (Common & {
      targetMode: "chooseFront3Cells";
      damage: number;
      frontRows?: number;
      execute: (args: ChooseFront3CellsArgs) => any[];
    })
  | (Common & {
      targetMode: "enemiesInRange";
      range: number;
      damage: number;
      execute: (args: EnemiesInRangeArgs) => any[];
    })
  | (Common & {
      targetMode: "chooseAllyInRange";
      range: number;
      heal: number;
      requireDamagedAlly?: boolean;
      execute: (args: ChooseAllyInRangeArgs) => any[];
    });

// =====================
// factories
// =====================
type DefBase = Omit<Common, "id"> & { id: SkillId };

function defineChooseLineDirection(
  def: DefBase & {
    range: number;
    damage: number;
    knockback: number;
    execute: (args: ChooseLineDirectionArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseLineDirection" };
}

function defineChooseEnemyAdjacent(
  def: DefBase & {
    damage: number;
    knockback?: number;
    execute: (args: ChooseEnemyAdjacentArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseEnemyAdjacent" };
}

function defineInstant(
  def: DefBase & {
    aoeRadius: number;
    damage: number;
    knockback: number;
    execute: (args: InstantArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "instant" };
}

function defineChooseFront3Cells(
  def: DefBase & {
    damage: number;
    frontRows?: number;
    execute: (args: ChooseFront3CellsArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseFront3Cells" };
}

// いま未使用でも将来使うので export して noUnusedLocals を回避
export function defineEnemiesInRange(
  def: DefBase & {
    range: number;
    damage: number;
    execute: (args: EnemiesInRangeArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "enemiesInRange" };
}

function defineChooseAllyInRange(
  def: DefBase & {
    range: number;
    heal: number;
    requireDamagedAlly?: boolean;
    execute: (args: ChooseAllyInRangeArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseAllyInRange" };
}

// =====================
// registry
// =====================
export const SKILLS: Record<SkillId, SkillDef> = {
  // ---- TSUTSU ----
  tsutsu_mietenda: defineChooseLineDirection({
    id: "tsutsu_mietenda",
    label: "見えてんだよ",
    desc: "方向を選び、最初に当たった敵へ3ダメ+スタン",
    unitId: "TSUTSU",
    oncePerMatch: true,
    range: 3,
    damage: 3,
    knockback: 0,
    stunTurns: 1,
    execute: ({ stateLike, casterId, dirR, dirC, range, damage, stunTurns }) => {
      const hits = collectLineTargets({
        rows: stateLike.rows,
        cols: stateLike.cols,
        instances: stateLike.instances,
        casterId,
        dirR,
        dirC,
        range,
        stopOnFirstHit: true,
      });

      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      const first = hits[0];
      if (!caster || !first) return next;
      if (first.side === caster.side) return next;

      next = dealDamage(next, first.instanceId, damage ?? 0, casterId);
      next = addStun(next, first.instanceId, stunTurns ?? 0);
      next = removeDead(next);
      return next;
    },
  }),

  tsutsu_chikayorasenee_g: defineInstant({
    id: "tsutsu_chikayorasenee_g",
    label: "(G) ちかよらせねえよ",
    desc: "周囲(半径2)の敵全員に2ダメ＋ノックバック＋スタン(1)（軽減は通常攻撃と同様に適用）",
    unitId: "TSUTSU",
    requiresForm: "g",
    oncePerMatch: true,
    aoeRadius: 2,
    damage: 2,
    knockback: 1,
    stunTurns: 1,
    execute: ({ stateLike, casterId, aoeRadius, damage, knockback, stunTurns }) => {
      const inst = stateLike.instances as any[];
      const casterSnap = inst.find((u: any) => u.instanceId === casterId);
      if (!casterSnap) return inst;

      let next = inst;

      for (const snap of inst) {
        if (snap.side === casterSnap.side) continue;

        const dr = Math.abs(snap.pos.r - casterSnap.pos.r);
        const dc = Math.abs(snap.pos.c - casterSnap.pos.c);
        if (Math.max(dr, dc) > (aoeRadius ?? 0)) continue;

        const caster = next.find((u: any) => u.instanceId === casterId);
        const t = next.find((u: any) => u.instanceId === snap.instanceId);
        if (!caster || !t) continue;
        if (t.side === caster.side) continue;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

        next = dealDamage(next, t.instanceId, finalDmg, casterId);
        next = addStun(next, t.instanceId, stunTurns ?? 0);

        if ((knockback ?? 0) > 0) {
          const dR = Math.sign(t.pos.r - caster.pos.r);
          const dC = Math.sign(t.pos.c - caster.pos.c);
          next = knockback1({ ...stateLike, instances: next }, t.instanceId, dR, dC);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- SOCHO ----
  socho_iaijutsu: defineChooseEnemyAdjacent({
    id: "socho_iaijutsu",
    label: "居合【一閃】",
    desc: "隣接する敵1体に4ダメ（軽減は通常攻撃と同様に適用）",
    unitId: "SOCHO",
    oncePerMatch: true,
    damage: 4,
    execute: ({ stateLike, casterId, targetId }) => {
      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      const t = next.find((u: any) => u.instanceId === targetId);
      if (!caster || !t) return next;
      if (t.side === caster.side) return next;

      const raw = 4;
      const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

      next = dealDamage(next, targetId, finalDmg, casterId);
      next = removeDead(next);
      return next;
    },
  }),

  socho_rensen_g: defineInstant({
    id: "socho_rensen_g",
    label: "(G) 連閃",
    desc: "周囲(半径2)の敵全員に3ダメ（軽減は通常攻撃と同様に適用）",
    unitId: "SOCHO",
    requiresForm: "g",
    oncePerMatch: true,
    aoeRadius: 2,
    damage: 3,
    knockback: 0, // defineInstant の型を満たす（効果はなし）
    execute: ({ stateLike, casterId, aoeRadius, damage }) => {
      const inst = stateLike.instances as any[];
      const casterSnap = inst.find((u: any) => u.instanceId === casterId);
      if (!casterSnap) return inst;

      let next = inst;

      for (const snap of inst) {
        if (snap.side === casterSnap.side) continue;

        const dr = Math.abs(snap.pos.r - casterSnap.pos.r);
        const dc = Math.abs(snap.pos.c - casterSnap.pos.c);
        if (Math.max(dr, dc) > (aoeRadius ?? 0)) continue;

        const caster = next.find((u: any) => u.instanceId === casterId);
        const t = next.find((u: any) => u.instanceId === snap.instanceId);
        if (!caster || !t) continue;
        if (t.side === caster.side) continue;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);
        next = dealDamage(next, t.instanceId, finalDmg, casterId);
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- USHIMARU ----
  ushimaru_pierce: defineChooseLineDirection({
    id: "ushimaru_pierce",
    label: "貫通",
    desc: "方向を選び、射程2の直線上の敵に3ダメ+ノックバック（軽減は通常攻撃と同様に適用）",
    unitId: "USHIMARU",
    oncePerMatch: true,
    range: 2,
    damage: 3,
    knockback: 1,
    execute: ({ stateLike, casterId, dirR, dirC, range, damage, knockback }) => {
      const hits = collectLineTargets({
        rows: stateLike.rows,
        cols: stateLike.cols,
        instances: stateLike.instances,
        casterId,
        dirR,
        dirC,
        range,
        stopOnFirstHit: false,
      });

      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      if (!caster) return next;

      for (const h of hits) {
        if (h.side === caster.side) break;

        const t = next.find((u: any) => u.instanceId === h.instanceId);
        if (!t) continue;
        if (t.side === caster.side) break;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

        next = dealDamage(next, t.instanceId, finalDmg, casterId);

        if ((knockback ?? 0) > 0) {
          next = knockback1({ ...stateLike, instances: next }, t.instanceId, dirR, dirC);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  ushimaru_kantetsu_g: defineChooseLineDirection({
    id: "ushimaru_kantetsu_g",
    label: "うしまる(G) 貫徹",
    desc: "方向を選び、射程4の直線上の敵に3ダメ+ノックバック（軽減は通常攻撃と同様に適用）",
    unitId: "USHIMARU",
    requiresForm: "g",
    oncePerMatch: true,
    range: 4,
    damage: 3,
    knockback: 1,
    execute: ({ stateLike, casterId, dirR, dirC, range, damage, knockback }) => {
      const hits = collectLineTargets({
        rows: stateLike.rows,
        cols: stateLike.cols,
        instances: stateLike.instances,
        casterId,
        dirR,
        dirC,
        range,
        stopOnFirstHit: false,
      });

      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      if (!caster) return next;

      for (const h of hits) {
        if (h.side === caster.side) break;

        const t = next.find((u: any) => u.instanceId === h.instanceId);
        if (!t) continue;
        if (t.side === caster.side) break;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

        next = dealDamage(next, t.instanceId, finalDmg, casterId);

        if ((knockback ?? 0) > 0) {
          next = knockback1({ ...stateLike, instances: next }, t.instanceId, dirR, dirC);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- MYOUOU ----
  myouou_yaki_harau: defineChooseFront3Cells({
    id: "myouou_yaki_harau",
    label: "焼き払う",
    desc: "前面3マスの敵にそれぞれ2ダメ（軽減は通常攻撃と同様に適用）",
    unitId: "MYOUOU",
    oncePerMatch: true,
    damage: 2,
    execute: ({ stateLike, casterId, damage }) => {
      const inst = stateLike.instances as any[];
      const casterSnap = inst.find((u: any) => u.instanceId === casterId);
      if (!casterSnap) return inst;

      const fr = casterSnap.side === "south" ? -1 : 1;
      const rr = casterSnap.pos.r + fr;

      let next = inst;

      for (const dc of [-1, 0, 1]) {
        const cc = casterSnap.pos.c + dc;

        const caster = next.find((u: any) => u.instanceId === casterId);
        const t = next.find((u: any) => u.pos.r === rr && u.pos.c === cc);
        if (!caster || !t) continue;
        if (t.side === caster.side) continue;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

        next = dealDamage(next, t.instanceId, finalDmg, casterId);
      }

      next = removeDead(next);
      return next;
    },
  }),

  myouou_karyura_g: defineChooseFront3Cells({
    id: "myouou_karyura_g",
    label: "(G) 迦楼羅",
    desc: "前面3マスの敵に2ダメ+炎上(3)+スタン(1)（軽減は通常攻撃と同様に適用）",
    unitId: "MYOUOU",
    requiresForm: "g",
    oncePerMatch: true,
    damage: 2,
    frontRows: 2,
    burnTicks: 3,
    stunTurns: 1,
    execute: ({ stateLike, casterId, damage, burnTicks, stunTurns }) => {
      const inst = stateLike.instances as any[];
      const casterSnap = inst.find((u: any) => u.instanceId === casterId);
      if (!casterSnap) return inst;

      const fr = casterSnap.side === "south" ? -1 : 1;
      let next = inst;

      for (const row of [1, 2]) {
        const rr = casterSnap.pos.r + fr * row;

        for (const dc of [-1, 0, 1]) {
          const cc = casterSnap.pos.c + dc;

          const caster = next.find((u: any) => u.instanceId === casterId);
          const t = next.find((u: any) => u.pos.r === rr && u.pos.c === cc);
          if (!caster || !t) continue;
          if (t.side === caster.side) continue;

          const raw = damage ?? 0;
          const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

          next = dealDamage(next, t.instanceId, finalDmg, casterId);
          next = addBurn(next, t.instanceId, burnTicks ?? 3);
          next = addStun(next, t.instanceId, stunTurns ?? 1);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- 7171 ----
  "7171_gaze": defineChooseFront3Cells({
    id: "7171_gaze",
    label: "凝視",
    desc: "前方3マスの敵にスタン(1)",
    unitId: "7171",
    oncePerMatch: true,
    damage: 0,
    stunTurns: 1,
    execute: ({ stateLike, casterId, stunTurns }) => {
      const inst = stateLike.instances;
      const casterSnap = inst.find((u) => u.instanceId === casterId);
      if (!casterSnap) return inst;

      const fr = casterSnap.side === "south" ? -1 : 1;
      const rr = casterSnap.pos.r + fr;

      let next = inst;

      for (const dc of [-1, 0, 1]) {
        const cc = casterSnap.pos.c + dc;

        const caster = next.find((u) => u.instanceId === casterId);
        const t = next.find((u) => u.pos.r === rr && u.pos.c === cc);
        if (!caster || !t) continue;
        if (t.side === caster.side) continue;

        next = addStun(next, t.instanceId, stunTurns ?? 1);
      }

      return next;
    },
  }),

  "7171_shisen_no_ori_g": defineInstant({
    id: "7171_shisen_no_ori_g",
    label: "(G) 視線の檻",
    desc: "7171の視線（8方向直線・遮蔽あり）内の敵をスタン(1)する",
    unitId: "7171",
    requiresForm: "g",
    oncePerMatch: true,

    // defineInstant の型を満たすダミー値
    aoeRadius: 0,
    damage: 0,
    knockback: 0,

    // メタ情報
    range: 3,
    stunTurns: 1,

    execute: ({ stateLike, casterId, range, stunTurns }) => {
      const inst = stateLike.instances as any[];
      const caster = inst.find((u: any) => u.instanceId === casterId);
      if (!caster) return inst;

      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
        { dr: -1, dc: -1 },
        { dr: -1, dc: 1 },
        { dr: 1, dc: -1 },
        { dr: 1, dc: 1 },
      ];

      let next = inst;

      for (const d of dirs) {
        const hits = collectLineTargets({
          rows: stateLike.rows,
          cols: stateLike.cols,
          instances: next,
          casterId,
          dirR: d.dr,
          dirC: d.dc,
          range: range ?? 3,
          stopOnFirstHit: true,
        });

        const first = hits[0];
        if (!first) continue;

        // 味方が最初に当たった場合は遮蔽のみ（スタンしない）
        if (first.side === caster.side) continue;

        next = addStun(next, first.instanceId, stunTurns ?? 1);
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- YABUKO ----
  yabuko_deliver: defineChooseAllyInRange({
    id: "yabuko_deliver",
    label: "届けこの想い",
    desc: "射程3以内のHPが減っている味方1体を2回復",
    unitId: "YABUKO_NORMAL",
    oncePerMatch: true,
    range: 3,
    heal: 2,
    requireDamagedAlly: true,
    execute: ({ stateLike, casterId, targetId, range, heal }) => {
      const inst = stateLike.instances;
      const unitsById = stateLike.unitsById;
      if (!unitsById) return inst;

      const caster = inst.find((u) => u.instanceId === casterId);
      const target = inst.find((u) => u.instanceId === targetId);
      if (!caster || !target) return inst;
      if (target.instanceId === caster.instanceId) return inst;
      if (target.side !== caster.side) return inst;

      const dr = Math.abs(target.pos.r - caster.pos.r);
      const dc = Math.abs(target.pos.c - caster.pos.c);
      if (Math.max(dr, dc) > (range ?? 0)) return inst;

      const targetDef = unitsById[target.unitId];
      if (!targetDef) return inst;

      const maxHp = getEffectiveMaxHp(targetDef.base.hp, target.form ?? "base");
      if ((target.hp ?? 0) >= maxHp) return inst;

      return healUnit(inst, targetId, heal, unitsById);
    },
  }),

  yabuko_fm_smash: defineChooseEnemyAdjacent({
    id: "yabuko_fm_smash",
    label: "叩き潰す！",
    desc: "隣接する敵1体に4ダメージ。さらに後方へ1マス吹き飛ばす",
    unitId: "YABUKO_FM",
    oncePerMatch: true,
    damage: 4,
    knockback: 1,
    execute: ({ stateLike, casterId, targetId, damage, knockback }) => {
      let next = stateLike.instances;
      const caster = next.find((u) => u.instanceId === casterId);
      const target = next.find((u) => u.instanceId === targetId);
      if (!caster || !target) return next;
      if (target.side === caster.side) return next;

      const raw = damage ?? 0;
      const finalDmg = computeFinalDamage(stateLike, caster, target, raw);
      next = dealDamage(next, targetId, finalDmg, casterId);

      const aliveTarget = next.find((u) => u.instanceId === targetId);
      if (!aliveTarget || (aliveTarget.hp ?? 0) <= 0) {
        return removeDead(next);
      }

      if ((knockback ?? 0) > 0) {
        const dR = Math.sign(target.pos.r - caster.pos.r);
        const dC = Math.sign(target.pos.c - caster.pos.c);
        next = knockback1({ ...stateLike, instances: next }, targetId, dR, dC);
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- ROCKEL ----
  rockel_slash: defineChooseLineDirection({
    id: "rockel_slash",
    label: "斬撃",
    desc: "方向を選び、直線3マス以内の最初の敵に3ダメージ（軽減は通常攻撃と同様に適用）",
    unitId: "ROCKEL",
    oncePerMatch: true,
    range: 3,
    damage: 3,
    knockback: 0,
    execute: ({ stateLike, casterId, dirR, dirC, range, damage }) => {
      const hits = collectLineTargets({
        rows: stateLike.rows,
        cols: stateLike.cols,
        instances: stateLike.instances,
        casterId,
        dirR,
        dirC,
        range,
        stopOnFirstHit: true,
      });

      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      const first = hits[0];
      if (!caster || !first) return next;
      if (first.side === caster.side) return next;

      const t = next.find((u: any) => u.instanceId === first.instanceId);
      if (!t) return next;
      if (t.side === caster.side) return next;

      const raw = damage ?? 0;
      const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

      next = dealDamage(next, t.instanceId, finalDmg, casterId);
      next = removeDead(next);
      return next;
    },
  }),

  rockel_whirlwind_g: defineInstant({
    id: "rockel_whirlwind_g",
    label: "(G) 旋風",
    desc: "周囲(半径1)の敵全員に3ダメ＋ノックバック（軽減は通常攻撃と同様に適用）",
    unitId: "ROCKEL",
    requiresForm: "g",
    oncePerMatch: true,
    aoeRadius: 1,
    damage: 3,
    knockback: 1,
    execute: ({ stateLike, casterId, aoeRadius, damage, knockback }) => {
      const inst = stateLike.instances as any[];
      const caster = inst.find((u: any) => u.instanceId === casterId);
      if (!caster) return inst;

      let next = inst;

      for (const snap of inst) {
        if (snap.side === caster.side) continue;

        const dr = Math.abs(snap.pos.r - caster.pos.r);
        const dc = Math.abs(snap.pos.c - caster.pos.c);
        if (Math.max(dr, dc) > (aoeRadius ?? 0)) continue;

        const t = next.find((u: any) => u.instanceId === snap.instanceId);
        if (!t) continue;
        if (t.side === caster.side) continue;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

        next = dealDamage(next, t.instanceId, finalDmg, casterId);

        if ((knockback ?? 0) > 0) {
          const dR = Math.sign(t.pos.r - caster.pos.r);
          const dC = Math.sign(t.pos.c - caster.pos.c);
          next = knockback1({ ...stateLike, instances: next }, t.instanceId, dR, dC);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- HIBIKI ----
  hibiki_shield_all: defineInstant({
    id: "hibiki_shield_all",
    label: "ぜったいに守る！",
    desc: "発動後、hibikiから距離2以内の味方が受けるダメージ-1（重複なし）",
    unitId: "HIBIKI",
    oncePerMatch: true,

    // defineInstant の型を満たすダミー値
    aoeRadius: 0,
    damage: 0,
    knockback: 0,

    execute: ({ stateLike, casterId }) => {
      const inst = stateLike.instances;
      const caster = inst.find((u) => u.instanceId === casterId);
      if (!caster) return inst;

      return inst.map((u) =>
        u.instanceId === casterId ? { ...u, hibikiShieldAllActive: true } : u
      );
    },
  }),

  hibiki_aegisline_g: defineInstant({
    id: "hibiki_aegisline_g",
    label: "(G) Aegis Line",
    desc: "発動後、味方が受けるダメージ-1（重複なし）",
    unitId: "HIBIKI",
    requiresForm: "g",
    oncePerMatch: true,

    // defineInstant の型を満たすダミー値
    aoeRadius: 0,
    damage: 0,
    knockback: 0,

    execute: ({ stateLike, casterId }) => {
      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      if (!caster) return next;

      return next.map((u: any) =>
        u.instanceId === casterId ? { ...u, aegisLineActive: true } : u
      );
    },
  }),

  // ---- ROKUDO (base) ----
  rokudo_kage_nui: defineChooseEnemyAdjacent({
    id: "rokudo_kage_nui",
    label: "影縫い",
    desc: "隣接する敵1体に4ダメ+スタン(2)。背面/側面なら+1ダメ（軽減は通常攻撃と同様に適用）",
    unitId: "ROKUDO",
    oncePerMatch: true,
    damage: 4,
    stunTurns: 2,
    execute: ({ stateLike, casterId, targetId, damage, stunTurns }) => {
      let next = stateLike.instances as any[];

      const caster = next.find((u: any) => u.instanceId === casterId);
      const t = next.find((u: any) => u.instanceId === targetId);
      if (!caster || !t) return next;
      if (t.side === caster.side) return next;

      const bonus = isBackOrSideSimple(caster.pos, t.pos, t.side) ? 1 : 0;

      const raw = (damage ?? 0) + bonus;
      const finalDmg = computeFinalDamage(stateLike, caster, t, raw);

      next = dealDamage(next, targetId, finalDmg, casterId);
      next = addStun(next, targetId, stunTurns ?? 2);
      next = removeDead(next);
      return next;
    },
  }),

  // ---- ROKUDO (G) ----
  rokudo_poison_stun_g: defineChooseLineDirection({
    id: "rokudo_poison_stun_g",
    label: "毒痺（G）",
    desc: "方向を選び、最初に当たった敵に2ダメ+毒(2)+スタン(1)（軽減は通常攻撃と同様に適用）",
    unitId: "ROKUDO",
    requiresForm: "g",
    oncePerMatch: true,
    range: 3,
    damage: 2,
    knockback: 0,
    burnTicks: 2,
    stunTurns: 1,
    execute: ({ stateLike, casterId, dirR, dirC, range, damage, burnTicks, stunTurns }) => {
      const hits = collectLineTargets({
        rows: stateLike.rows,
        cols: stateLike.cols,
        instances: stateLike.instances,
        casterId,
        dirR,
        dirC,
        range,
        stopOnFirstHit: true,
      });

      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      const first = hits[0];
      if (!caster || !first) return next;
      if (first.side === caster.side) return next;

      const raw = damage ?? 0;
      const finalDmg = computeFinalDamage(stateLike, caster, first, raw);

      next = dealDamage(next, first.instanceId, finalDmg, casterId);
      next = addBurn(next, first.instanceId, burnTicks ?? 0);
      next = addStun(next, first.instanceId, stunTurns ?? 0);
      next = removeDead(next);
      return next;
    },
  }),

  // ---- DELI ----
  deli_throw: defineChooseEnemyAdjacent({
    id: "deli_throw",
    label: "投げつけ",
    desc: "隣接する敵1体に2ダメ。さらに後方へ2マス吹き飛ばす。途中/着地で衝突したら追加で2ダメ（軽減は通常攻撃と同様に適用）",
    unitId: "DELI",
    oncePerMatch: true,
    damage: 2,
    execute: ({ stateLike, casterId, targetId, damage }) => {
      let next = stateLike.instances as any[];
      const caster = next.find((u: any) => u.instanceId === casterId);
      const t0 = next.find((u: any) => u.instanceId === targetId);
      if (!caster || !t0) return next;
      if (t0.side === caster.side) return next;

      // 1) 基本ダメ（B案）
      {
        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t0, raw);
        next = dealDamage(next, targetId, finalDmg, casterId);
      }

      // 死亡なら終了
      {
        const t = next.find((u: any) => u.instanceId === targetId);
        if (!t || (t.hp ?? 0) <= 0) {
          next = removeDead(next);
          return next;
        }
      }

      // 2) KB方向（caster→target の延長）
      const dR0 = Math.sign(t0.pos.r - caster.pos.r);
      const dC0 = Math.sign(t0.pos.c - caster.pos.c);
      const dR = dR0 === 0 && dC0 === 0 ? 0 : dR0;
      const dC = dR0 === 0 && dC0 === 0 ? 0 : dC0;

      const inBounds = (r: number, c: number) =>
        r >= 0 && r < stateLike.rows && c >= 0 && c < stateLike.cols;

      const isOccupied = (r: number, c: number, instances: any[]) =>
        instances.some(
          (u: any) => u.instanceId !== targetId && u.pos.r === r && u.pos.c === c
        );

      const moveTo = (instances: any[], id: string, r: number, c: number) =>
        instances.map((u: any) => (u.instanceId === id ? { ...u, pos: { r, c } } : u));

      // 3) 2歩シミュレーション
      let collided = false;
      for (let step = 0; step < 2; step++) {
        const t = next.find((u: any) => u.instanceId === targetId);
        if (!t) break;

        const nr = t.pos.r + dR;
        const nc = t.pos.c + dC;

        if (!inBounds(nr, nc) || isOccupied(nr, nc, next)) {
          collided = true;
          break;
        }

        next = moveTo(next, targetId, nr, nc);
      }

      // 4) 衝突追加+2（B案）
      if (collided) {
        const t = next.find((u: any) => u.instanceId === targetId);
        if (t) {
          const rawImpact = 2;
          const finalImpact = computeFinalDamage(stateLike, caster, t, rawImpact);
          next = dealDamage(next, targetId, finalImpact, casterId);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  deli_uncontrolled_explosion_g: defineInstant({
    id: "deli_uncontrolled_explosion_g",
    label: "(G) 暴発",
    desc: "周囲(半径2)の敵全員に3ダメ＋ノックバック。自分も2ダメ（軽減は通常攻撃と同様に適用）",
    unitId: "DELI",
    requiresForm: "g",
    oncePerMatch: true,
    aoeRadius: 2,
    damage: 3,
    knockback: 1,
    selfDamage: 2,
    execute: ({ stateLike, casterId, aoeRadius, damage, knockback, selfDamage }) => {
      const inst = stateLike.instances as any[];
      const casterSnap = inst.find((u: any) => u.instanceId === casterId);
      if (!casterSnap) return inst;

      let next = inst;

      // 1) 敵AoE
      for (const snap of inst) {
        if (snap.side === casterSnap.side) continue;

        const dr = Math.abs(snap.pos.r - casterSnap.pos.r);
        const dc = Math.abs(snap.pos.c - casterSnap.pos.c);
        if (Math.max(dr, dc) > (aoeRadius ?? 0)) continue;

        const caster = next.find((u: any) => u.instanceId === casterId);
        const t = next.find((u: any) => u.instanceId === snap.instanceId);
        if (!caster || !t) continue;
        if (t.side === caster.side) continue;

        const raw = damage ?? 0;
        const finalDmg = computeFinalDamage(stateLike, caster, t, raw);
        next = dealDamage(next, t.instanceId, finalDmg, casterId);

        if ((knockback ?? 0) > 0) {
          const dR = Math.sign(t.pos.r - caster.pos.r);
          const dC = Math.sign(t.pos.c - caster.pos.c);
          next = knockback1({ ...stateLike, instances: next }, t.instanceId, dR, dC);
        }
      }

      // 2) 自傷
      {
        const caster = next.find((u: any) => u.instanceId === casterId);
        if (caster) {
          const rawSelf = selfDamage ?? 0;
          const finalSelf = computeFinalDamage(stateLike, caster, caster, rawSelf);
          next = dealDamage(next, casterId, finalSelf, casterId);
        }
      }

      next = removeDead(next);
      return next;
    },
  }),

  // ---- PLAYER ----
  player_support_shot: defineChooseAllyInRange({
    id: "player_support_shot",
    label: "援護射撃",
    desc: "射程3以内の味方1体に通常攻撃ダメージ+1を付与",
    unitId: "PLAYER",
    oncePerMatch: true,
    range: 3,
    heal: 0,
    requireDamagedAlly: false,
    execute: ({ stateLike, casterId, targetId, range }) => {
      const inst = stateLike.instances;
      const caster = inst.find((u) => u.instanceId === casterId);
      const target = inst.find((u) => u.instanceId === targetId);
      if (!caster || !target) return inst;
      if (target.instanceId === caster.instanceId) return inst;
      if (target.side !== caster.side) return inst;

      const dr = Math.abs(target.pos.r - caster.pos.r);
      const dc = Math.abs(target.pos.c - caster.pos.c);
      if (Math.max(dr, dc) > (range ?? 0)) return inst;

      return inst.map((u) => {
        if (u.instanceId !== targetId) return u;
        const cur = u.dmgBonus ?? 0;
        return { ...u, dmgBonus: Math.max(cur, 1) };
      });
    },
  }),

  player_overclock_g: defineInstant({
    id: "player_overclock_g",
    label: "(G) オーバークロック",
    desc: "このターン、味方全員の与ダメ+1（実装：dmgBonus:+1付与）",
    unitId: "PLAYER",
    requiresForm: "g",
    oncePerMatch: true,
    aoeRadius: 0,
    damage: 0,
    knockback: 0,
    execute: ({ stateLike, casterId }) => {
      const inst = stateLike.instances as any[];
      const caster = inst.find((u: any) => u.instanceId === casterId);
      if (!caster) return inst;

      return inst.map((u: any) => {
        if (!u) return u;
        if (u.side !== caster.side) return u;
        const cur = u.dmgBonus ?? 0;
        if (cur >= 1) return u;
        return { ...u, dmgBonus: 1 };
      });
    },
  }),
} as const;

// =====================
// helpers
// =====================
export function skillKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}

const ROKUDO_AUTHOR_SKILL_IDS: SkillId[] = [
  "socho_iaijutsu",
  "myouou_karyura_g",
  "rokudo_kage_nui",
  "rokudo_poison_stun_g",
  "7171_gaze",
  "7171_shisen_no_ori_g",
  "tsutsu_mietenda",
  "tsutsu_chikayorasenee_g",
  "hibiki_shield_all",
  "hibiki_aegisline_g",
  "ushimaru_pierce",
  "ushimaru_kantetsu_g",
  "deli_throw",
  "yabuko_fm_smash",
  "rockel_slash",
  "rockel_whirlwind_g",
  "player_support_shot",
  "player_overclock_g",
];

export function getAvailableSkillsForUnit(unitId: string): SkillDef[] {
  if (unitId === "ROKUDO_AUTHOR") {
    return ROKUDO_AUTHOR_SKILL_IDS.map((id) => ({
      ...SKILLS[id],
      unitId: "ROKUDO_AUTHOR",
      requiresForm: undefined,
    })) as SkillDef[];
  }

  return Object.values(SKILLS).filter((s) => s.unitId === unitId);
}
