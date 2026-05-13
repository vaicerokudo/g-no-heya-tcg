import type { SkillId } from "./registry";

export type SkillImpactVariant = "default" | "fire" | "stun" | "slash" | "force";

export function getSkillImpactVariant(skillId: SkillId): SkillImpactVariant {
  switch (skillId) {
    case "myouou_yaki_harau":
    case "myouou_karyura_g":
      return "fire";

    case "tsutsu_mietenda":
    case "7171_gaze":
    case "7171_shisen_no_ori_g":
    case "rokudo_kage_nui":
    case "rokudo_poison_stun_g":
      return "stun";

    case "socho_iaijutsu":
    case "socho_rensen_g":
    case "rockel_slash":
      return "slash";

    case "tsutsu_chikayorasenee_g":
    case "ushimaru_pierce":
    case "ushimaru_kantetsu_g":
    case "rockel_whirlwind_g":
    case "deli_throw":
    case "deli_uncontrolled_explosion_g":
    case "yabuko_fm_smash":
      return "force";

    default:
      return "default";
  }
}
