import type { SkillId } from "../game/skills/registry";

export type SkillCutInDefinition = {
  skillId: SkillId;
  characterName: string;
  skillName: string;
  imagePath: string;
};

const SKILL_CUTINS: Partial<Record<SkillId, SkillCutInDefinition>> = {
  socho_iaijutsu: {
    skillId: "socho_iaijutsu",
    characterName: "総長",
    skillName: "居合【一閃】",
    imagePath: "/cutins/socho_iaijutsu.png",
  },
  socho_rensen_g: {
    skillId: "socho_rensen_g",
    characterName: "総長",
    skillName: "(G) 連閃",
    imagePath: "/cutins/socho_multislash_g.png",
  },
  tsutsu_mietenda: {
    skillId: "tsutsu_mietenda",
    characterName: "つつ",
    skillName: "見えてんだよ",
    imagePath: "/cutins/tsutsu_mietendayo.png",
  },
  tsutsu_chikayorasenee_g: {
    skillId: "tsutsu_chikayorasenee_g",
    characterName: "つつ",
    skillName: "(G) ちかよらせねえよ",
    imagePath: "/cutins/tsutsu_chikayorasenee_g.png",
  },
  rokudo_kage_nui: {
    skillId: "rokudo_kage_nui",
    characterName: "ROKUDO",
    skillName: "影縫い",
    imagePath: "/cutins/rokudo_skill_1.png",
  },
  rokudo_poison_stun_g: {
    skillId: "rokudo_poison_stun_g",
    characterName: "ROKUDO",
    skillName: "毒痺（G）",
    imagePath: "/cutins/rokudo_skill_g.png",
  },
  myouou_yaki_harau: {
    skillId: "myouou_yaki_harau",
    characterName: "明王",
    skillName: "焼き払う",
    imagePath: "/cutins/myouou_yaki_harau.png",
  },
  myouou_karyura_g: {
    skillId: "myouou_karyura_g",
    characterName: "明王",
    skillName: "(G) 迦楼羅",
    imagePath: "/cutins/myouou_karyura_g.png",
  },
  "7171_gaze": {
    skillId: "7171_gaze",
    characterName: "7171",
    skillName: "凝視",
    imagePath: "/cutins/7171_gaze.png",
  },
  "7171_shisen_no_ori_g": {
    skillId: "7171_shisen_no_ori_g",
    characterName: "7171",
    skillName: "(G) 視線の檻",
    imagePath: "/cutins/7171_shisen_no_ori_g.png",
  },
  hibiki_shield_all: {
    skillId: "hibiki_shield_all",
    characterName: "hibiki",
    skillName: "ぜったいに守る！",
    imagePath: "/cutins/hibiki_protect_barrier.png",
  },
  hibiki_aegisline_g: {
    skillId: "hibiki_aegisline_g",
    characterName: "hibiki",
    skillName: "(G) Aegis Line",
    imagePath: "/cutins/hibiki_aegis_line_g.png",
  },
  ushimaru_pierce: {
    skillId: "ushimaru_pierce",
    characterName: "うしまる",
    skillName: "貫通",
    imagePath: "/cutins/ushimaru_pierce.png",
  },
  ushimaru_kantetsu_g: {
    skillId: "ushimaru_kantetsu_g",
    characterName: "うしまる",
    skillName: "うしまる(G) 貫徹",
    imagePath: "/cutins/ushimaru_kantetsu_g.png",
  },
  deli_throw: {
    skillId: "deli_throw",
    characterName: "Deli",
    skillName: "投げつけ",
    imagePath: "/cutins/deli_throw_charge.png",
  },
  deli_uncontrolled_explosion_g: {
    skillId: "deli_uncontrolled_explosion_g",
    characterName: "Deli",
    skillName: "(G) 暴発",
    imagePath: "/cutins/deli_uncontrolled_explosion_g.png",
  },
  yabuko_deliver: {
    skillId: "yabuko_deliver",
    characterName: "やぶこ",
    skillName: "届けこの想い",
    imagePath: "/cutins/yabuko_todoke_kono_omoi.png",
  },
  yabuko_fm_smash: {
    skillId: "yabuko_fm_smash",
    characterName: "やぶこ",
    skillName: "叩き潰す！",
    imagePath: "/cutins/yabuko_crush.png",
  },
  rockel_slash: {
    skillId: "rockel_slash",
    characterName: "ROCKEL",
    skillName: "斬撃",
    imagePath: "/cutins/rockel_slash.png",
  },
  rockel_whirlwind_g: {
    skillId: "rockel_whirlwind_g",
    characterName: "ROCKEL",
    skillName: "(G) 旋風",
    imagePath: "/cutins/rockel_whirlwind_g.png",
  },
  player_support_shot: {
    skillId: "player_support_shot",
    characterName: "Player",
    skillName: "援護射撃",
    imagePath: "/cutins/player_support_shot.png",
  },
  player_overclock_g: {
    skillId: "player_overclock_g",
    characterName: "Player",
    skillName: "(G) オーバークロック",
    imagePath: "/cutins/player_overclock_g.png",
  },
};

const imageAvailabilityCache = new Map<string, boolean>();

export function getSkillCutInDefinition(skillId: SkillId) {
  return SKILL_CUTINS[skillId] ?? null;
}

export function loadSkillCutInImage(imagePath: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  const cached = imageAvailabilityCache.get(imagePath);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      imageAvailabilityCache.set(imagePath, true);
      resolve(true);
    };
    image.onerror = () => {
      imageAvailabilityCache.set(imagePath, false);
      resolve(false);
    };
    image.src = imagePath;
  });
}
