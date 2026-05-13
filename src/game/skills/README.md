# Skills

- Skill execution is currently owned by `src/game/skills/registry.ts`.
- `usedSkills` keys currently use the registry `SkillId`.
- Skill IDs in `src/data/units.v1.2.json` are treated as design/spec notes for now and are not yet unified with registry IDs.
- Status effect ticking is handled outside skills, in the status effect layer.
- `src/game/skills/index.ts` is a deletion candidate when it remains unreferenced.

See `skillMapping.md` for the current mapping between `units.v1.2.json` skill IDs and registry `SkillId` values.
