// src/game/skills/registry.ts

import type { Side } from "../types";


import {
  applySochoIaijutsu,
  applyTsutsuGChikayoraseneeYo,
  applyUshimaruGKantetsu,
  applyMyououYakiHarau,
  applyMyououGKaryuraFront3,
} from "../skills";

export type SkillId =
  | "ushimaru_kantetsu_g"
  | "socho_iaijutsu"
  | "tsutsu_chikayorasenee_g"
  | "myouou_yaki_harau"
  | "myouou_karyura_g";

export type SkillTargetMode =
  | "chooseLineDirection"
  | "chooseEnemyAdjacent"
  | "instant"
  | "chooseFront3Cells";

export type ChooseFront3CellsArgs = {
  stateLike: { rows: number; cols: number; instances: any[] };
  casterId: string;
  damage: number;
  burnTicks?: number;
  stunTurns?: number;
};

// --- args ---
export type ChooseLineDirectionArgs = {
  stateLike: { rows: number; cols: number; instances: any[] };
  casterId: string;
  dirR: number;
  dirC: number;
  range: number;
  damage: number;
  knockback: number;
};

export type ChooseEnemyAdjacentArgs = {
  stateLike: { rows: number; cols: number; instances: any[] };
  casterId: string;
  targetId: string;
  damage: number;
};

export type InstantArgs = {
  stateLike: { rows: number; cols: number; instances: any[] };
  casterId: string;
  aoeRadius: number;
  damage: number;
  knockback: number;
  stunTurns?: number;
};

// --- defs (unionで安全に) ---
type Common = {
  id: SkillId;
  label: string;
  unitId: string;
  requiresForm?: "g";
  oncePerMatch: boolean;
  desc?: string;
  stunTurns?: number; // 表示したいので共通に
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
      burnTicks?: number;
      execute: (args: ChooseFront3CellsArgs) => any[];
    });

// ========= 事故らないファクトリ =========
type DefBase = Common; // ★ targetMode を持たない

export function defineChooseLineDirection(
  def: DefBase & {
    range: number;
    damage: number;
    knockback: number;
    execute: (args: ChooseLineDirectionArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseLineDirection" };
}

export function defineChooseEnemyAdjacent(
  def: DefBase & {
    damage: number;
    execute: (args: ChooseEnemyAdjacentArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseEnemyAdjacent" };
}

export function defineInstant(
  def: DefBase & {
    aoeRadius: number;
    damage: number;
    knockback: number;
    execute: (args: InstantArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "instant" };
}

export function defineChooseFront3Cells(
  def: DefBase & {
    damage: number;
    burnTicks?: number;
    execute: (args: ChooseFront3CellsArgs) => any[];
  }
): SkillDef {
  return { ...def, targetMode: "chooseFront3Cells" };
}
// ========= ここまで =========



export const SKILLS: Record<SkillId, SkillDef> = {
  ushimaru_kantetsu_g: defineChooseLineDirection({
    id: "ushimaru_kantetsu_g",
    label: "うしまる(G) 貫徹",
    unitId: "USHIMARU",
    requiresForm: "g",
    oncePerMatch: true,
    range: 4,
    damage: 3,
    knockback: 1,
    execute: ({ stateLike, casterId, dirR, dirC, range, damage, knockback }) => {
      return applyUshimaruGKantetsu(
        stateLike as any,
        casterId,
        dirR,
        dirC,
        range,
        damage,
        knockback
      );
    },
  }),

  socho_iaijutsu: defineChooseEnemyAdjacent({
    id: "socho_iaijutsu",
    label: "居合い斬り 【一閃】",
　　desc: "指定した敵一体に4ダメージ",
    unitId: "SOCHO",
    oncePerMatch: true,
    damage: 4,
    execute: ({ stateLike, casterId, targetId, damage }) => {
      return applySochoIaijutsu(stateLike as any, casterId, targetId, damage);
    },
  }),

  myouou_yaki_harau: defineChooseEnemyAdjacent({
    id: "myouou_yaki_harau",
    label: "焼き払う",
    desc: "前面3マスの敵にそれぞれ2ダメージ",
    unitId: "MYOUOU",
    oncePerMatch: true,
    damage: 2,
    execute: ({ stateLike, casterId, targetId, damage }) => {
      return applyMyououYakiHarau(stateLike as any, casterId, targetId, damage);
    },
  }),

 myouou_karyura_g: defineChooseFront3Cells({
  id: "myouou_karyura_g",
  label: "(G) 迦楼羅",
  desc: "前面3マスの敵に2ダメ+炎上(1ダメ3ターン)+スタン",
  unitId: "MYOUOU",
  requiresForm: "g",
  oncePerMatch: true,
  damage: 2,
  burnTicks: 3,
  stunTurns: 1,
  execute: ({ stateLike, casterId, damage, burnTicks, stunTurns }) => {
    return applyMyououGKaryuraFront3(
      stateLike as any,
      casterId,
      damage,
      burnTicks ?? 3,
      stunTurns ?? 1
    );
  },
}),


  tsutsu_chikayorasenee_g: defineInstant({
    id: "tsutsu_chikayorasenee_g",
    label: "つつ(G) 近寄らせねぇよ",
    unitId: "TSUTSU",
    requiresForm: "g",
    oncePerMatch: true,
    aoeRadius: 2,
    damage: 2,
    knockback: 1,
    stunTurns: 1,
    execute: ({ stateLike, casterId, aoeRadius, damage, knockback, stunTurns }) => {
      return applyTsutsuGChikayoraseneeYo(
        stateLike as any,
        casterId,
        aoeRadius,
        damage,
        knockback,
        stunTurns ?? 1
      );
    },
  }),
};

export function skillKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}

export function getAvailableSkillsForUnit(unitId: string): SkillDef[] {
  return Object.values(SKILLS).filter((s) => s.unitId === unitId);
}

