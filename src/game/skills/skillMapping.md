# Skill ID Mapping

This document maps skill IDs written in `src/data/units.v1.2.json` to the currently implemented registry `SkillId` values.

Important:

- Runtime skill execution is currently owned by `src/game/skills/registry.ts`.
- UI skill buttons are built from registry entries via `getAvailableSkillsForUnit(unitId)`.
- `units.v1.2.json` skill IDs are not directly connected to the UI or execution path yet.
- JSON skill IDs are treated as design/spec notes until the ID systems are intentionally unified.

Status values:

- `implemented`: implemented in registry and broadly matches the JSON intent.
- `missing`: present in JSON, but no corresponding registry implementation exists.
- `simplified`: implemented, but with a simpler effect/targeting model than the JSON spec.
- `behavior-different`: implemented under a related concept, but behavior differs significantly from the JSON spec.

| Character | Form | units JSON skillId | registry SkillId | Status | Spec Difference / Notes | Future Direction |
|---|---|---|---|---|---|---|
| 明王 / MYOUOU | base | `MYO_BURN` | `myouou_yaki_harau` | implemented | JSON ID differs. Both are front 3 cells with 2 damage. Registry does not apply burn for base. | Keep registry ID for now; optionally rename later during ID unification. |
| 明王 / MYOUOU | G | `MYO_G_KARYURA` | `myouou_karyura_g` | implemented | JSON ID differs. Registry applies damage + burn + stun to front 3 cells. | Good current match; use as reference implementation for G skills. |
| hibiki / HIBIKI | base | `HIBIKI_SHIELDALL` | `hibiki_shield_all` | simplified | JSON applies `GUARD_BARRIER` for `durationTurns: 1` in range 2. Registry sets `hibikiShieldAllActive` on caster and reduces damage by 1 for same-side units within range 2; duration is not implemented yet. | Keep as base support skill; revisit duration when shared buff timing exists. |
| hibiki / HIBIKI | G | `HIBIKI_G_FIELDWALL` | `hibiki_aegisline_g` | behavior-different | JSON describes global allies guard barrier. Registry currently sets `aegisLineActive` only on caster. | Decide whether to implement global ally barrier or keep caster-only design. |
| つつ / TSUTSU | base | `TSUTSU_SEEN` | `tsutsu_mietenda` | implemented | JSON ID differs. Both are line/ranged hit with damage + paralyze/stun. | Good current match; keep registry ID until ID unification. |
| つつ / TSUTSU | G | `TSUTSU_G_NO_NEAR` | `tsutsu_chikayorasenee_g` | implemented | JSON ID differs. Registry handles enemies in radius with damage + stun + knockback. | Good current match; verify knockback direction if rules are tightened. |
| ROKUDO | base | `ROKUDO_ASSASSIN` | `rokudo_kage_nui` | behavior-different | JSON describes teleport/assassin positioning and behind bonus. Registry is adjacent target damage + stun with side/back bonus. | Revisit after movement/teleport skill support is designed. |
| ROKUDO | G | `ROKUDO_G_SMOKE` | `rokudo_poison_stun_g` | behavior-different | JSON describes enemies in range with paralyze + poison. Registry is line target damage + burn + stun. | Decide whether this should become area debuff or remain line attack. |
| 7171 | base | `7171_GAZE` | `7171_gaze` | simplified | JSON marks front cells and applies paralyze on cast/enter. Registry stuns enemies currently in the front 3 cells on cast only; mark zone and enter trigger are not implemented yet. | Keep as base gaze skill; revisit zone effects later. |
| 7171 | G | `7171_G_CAGE` | `7171_shisen_no_ori_g` | simplified | JSON describes marked cells, movement restriction, and enter triggers. Registry stuns first enemy in each of 8 directions. | Keep simplified version until zone/mark effects exist. |
| Player | base | `PLAYER_SUPPORT` | `player_support_shot` | simplified | JSON describes triggered ally damage support. Registry targets one ally within range 3 and gives `dmgBonus: 1` for normal attacks. Duration is not implemented yet. | Keep as the first single-target attack support skill; revisit triggered follow-up later. |
| Player | G | `PLAYER_G_FULLBURST` | `player_overclock_g` | behavior-different | JSON modifies `PLAYER_SUPPORT`; registry gives same-side units `dmgBonus: 1`. `dmgBonus` is now connected to normal attack damage only. | Decide later whether G should become `dmgBonus: 2` or a true PLAYER_SUPPORT override. |
| ROCKEL | base | `ROCKEL_SLASH` | `rockel_slash` | simplified | JSON targets a fixed cell pattern and pierce. Registry is line direction, first enemy only. | Revisit if cell-pattern targeting is restored. |
| ROCKEL | G | `ROCKEL_G_WHIRL` | `rockel_whirlwind_g` | implemented | JSON ID differs. Both are nearby enemies damage + knockback. | Good current match. |
| Deli / DELI | base | `DELI_THROW` | `deli_throw` | simplified | JSON describes dash-to-target-adjacent and throw landing rules. Registry damages and pushes target; Deli does not dash. | Implement dash/throw positioning later if desired. |
| Deli / DELI | G | `DELI_G_BOOM` | `deli_uncontrolled_explosion_g` | simplified | JSON describes dash destination explosion. Registry uses caster-centered radius damage/knockback and self damage. | Revisit after Deli movement/positioning skill support. |
| うしまる / USHIMARU | base | `USHI_PIERCE` | `ushimaru_pierce` | implemented | JSON ID differs. Both are piercing/line-style damage; registry uses line direction from self. | Good current match; origin-selection spec may be revisited. |
| うしまる / USHIMARU | G | `USHI_G_LINEPUSH` | `ushimaru_kantetsu_g` | implemented | JSON ID differs. Both are line damage + knockback. | Good current match. |
| 総長 / SOCHO | base | `SOCHO_IAI` | `socho_iaijutsu` | implemented | JSON ID differs. Both are enemy-in-range damage. Registry currently requires adjacent enemy targeting. | Verify intended range before tightening. |
| 総長 / SOCHO | G | `SOCHO_G_RENSEN` | `socho_rensen_g` | implemented | JSON ID differs. Both are enemies-in-range damage. | Good current match. |
| やぶこ通常 / YABUKO_NORMAL | base | `YABUKO_DELIVER` | `yabuko_deliver` | implemented | JSON describes ally heal in range. Registry heals one damaged ally within range 3 for 2 HP. | Keep as the first support-skill reference implementation. |
| やぶこFM / YABUKO_FM | base/FM | `YABUKO_FM_SMASH` | `yabuko_fm_smash` | simplified | JSON describes `chargeTurns: 2`, cannot act, dash to target, and instant kill on resolve. Registry implements an immediate adjacent smash: 4 damage + knockback 1. | Keep as first FM attack skill; revisit charge/delayed resolve later. |

## Registry Skills Without Exact JSON IDs

Every registry skill currently has no exact ID match in `units.v1.2.json`; this is expected for now because registry IDs are the execution IDs and JSON IDs are still treated as spec IDs.

## JSON Skill IDs Missing From Registry

None at the moment.

## Large Behavior Differences

- `HIBIKI_G_FIELDWALL` -> `hibiki_aegisline_g`
- `ROKUDO_ASSASSIN` -> `rokudo_kage_nui`
- `ROKUDO_G_SMOKE` -> `rokudo_poison_stun_g`
- `7171_G_CAGE` -> `7171_shisen_no_ori_g`
- `PLAYER_G_FULLBURST` -> `player_overclock_g`
- `DELI_THROW` -> `deli_throw`
- `DELI_G_BOOM` -> `deli_uncontrolled_explosion_g`

## Recommended Next Implementation Candidates

All listed unit JSON skills now have a registry-side first-pass implementation. Next candidates are improving simplified skills toward their JSON behavior, especially `YABUKO_FM_SMASH`, `7171_GAZE`, and `PLAYER_SUPPORT`.
