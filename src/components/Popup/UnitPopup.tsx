import { getAvailableSkillsForUnit, type SkillId, SKILLS } from "../../game/skills/registry";
import type { Side } from "../../game/types";
import { getEffectiveAtk, getEffectiveMaxHp } from "../../game/stats";

function skillUseKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}

type Props = {
  open: boolean;
  unit: any | null;
  unitsById: any;
  usedSkills: Record<string, boolean>;
  onClose: () => void;
  getPortrait: (unitId: string, side: "south" | "north") => string;
};

export function UnitPopup({ open, unit, unitsById, usedSkills, onClose, getPortrait }: Props) {
  if (!open || !unit) return null;

  const def = unitsById[unit.unitId];
  const form = unit.form ?? "base";
  const maxHp = getEffectiveMaxHp(def.base.hp, form);
  const atk = getEffectiveAtk(def.base.atk, form);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 13000,
        padding: 12,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "92vw",
          background: "rgba(10,10,12,0.92)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>{def.name}</div>
          <button
            onClick={onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>

        <img
          src={getPortrait(unit.unitId, unit.side)}
          alt={unit.unitId}
          style={{
            width: "100%",
            marginTop: 10,
            borderRadius: 12,
            objectFit: "contain",
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.14)",
            maxHeight: "48vh",
          }}
        />

        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span>
              side: <b>{String(unit.side).toUpperCase()}</b>
            </span>
            <span>
              form: <b>{form}</b>
            </span>
            <span>
              HP:{" "}
              <b>
                {unit.hp}/{maxHp}
              </b>
            </span>
            <span>
              ATK: <b>{atk}</b>
            </span>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 900, marginBottom: 6 }}>スキル</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {getAvailableSkillsForUnit(unit.unitId).map((s) => {
            const formOk = !s.requiresForm || form === s.requiresForm;
            const usedKey = skillUseKey(unit.side as Side, unit.instanceId, s.id);
            const used = !!usedSkills[usedKey];

            const disabledReason = !formOk
              ? "進化(G)が必要"
              : s.oncePerMatch && used
                ? "この試合で使用済み"
                : "";

            return (
              <div
                key={s.id}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.25)",
                }}
                title={disabledReason}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>{s.label}</div>

                  {s.requiresForm && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        opacity: formOk ? 0.9 : 0.6,
                      }}
                    >
                      要{String(s.requiresForm).toUpperCase()}
                    </span>
                  )}

                  {s.oncePerMatch && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        opacity: 0.9,
                      }}
                    >
                      1回
                    </span>
                  )}

                  {s.oncePerMatch && used && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.08)",
                        opacity: 0.9,
                      }}
                    >
                      使用済
                    </span>
                  )}

                  {!formOk && <span style={{ fontSize: 12, opacity: 0.75 }}>（進化してね）</span>}
                </div>

                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                  mode: {SKILLS[s.id]?.targetMode ?? s.targetMode}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
