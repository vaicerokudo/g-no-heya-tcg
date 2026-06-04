import type { SkillId } from "../game/skills/registry";

export type SkillCutInDefinition = {
  skillId: SkillId;
  characterName: string;
  skillName: string;
  imagePath: string;
};

const SKILL_CUTINS: Partial<Record<SkillId, SkillCutInDefinition>> = {
  myouou_yaki_harau: {
    skillId: "myouou_yaki_harau",
    characterName: "明王",
    skillName: "焼き払う",
    imagePath: "/cutins/myouou_yaki_harau.svg",
  },
  myouou_karyura_g: {
    skillId: "myouou_karyura_g",
    characterName: "明王",
    skillName: "迦楼羅",
    imagePath: "/cutins/myouou_karyura_g.svg",
  },
  "7171_gaze": {
    skillId: "7171_gaze",
    characterName: "7171",
    skillName: "凝視",
    imagePath: "/cutins/7171_gaze.svg",
  },
  "7171_shisen_no_ori_g": {
    skillId: "7171_shisen_no_ori_g",
    characterName: "7171",
    skillName: "視線の檻",
    imagePath: "/cutins/7171_shisen_no_ori_g.svg",
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
