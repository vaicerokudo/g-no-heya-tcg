import { useEffect, useState } from "react";
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
  getPortrait: (unitId: string, side: "south" | "north", form?: "base" | "g") => string;
  getCardImage: (unitId: string, side: "south" | "north", form?: "base" | "g") => string;
};

export function UnitPopup({ open, unit, unitsById, usedSkills, onClose, getCardImage }: Props) {


  const [w, setW] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isNarrow = w < 720;

  if (!open || !unit) return null;

  const def = unitsById?.[unit.unitId];
  if (!def) return null;

  const form = (unit.form ?? "base") as "base" | "g";
  const maxHp = getEffectiveMaxHp(def.base.hp, form);
  const atk = getEffectiveAtk(def.base.atk, form);



  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.70)",
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
          width: "min(980px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "rgba(10,10,12,0.94)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            {def.name} <span style={{ opacity: 0.7, fontSize: 12 }}>({String(unit.unitId)})</span>
          </div>

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

        {/* C：左カード / 右情報 */}
        <div
          style={{
            display: "flex",
            flexDirection: isNarrow ? "column" : "row",
            gap: 12,
            marginTop: 12,
            alignItems: isNarrow ? "stretch" : "flex-start",
          }}
        >
          {/* 左：カード */}
          <div
            style={{
              flex: isNarrow ? "0 0 auto" : "0 0 52%",
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 14,
              padding: 10,
            }}
          >
           {/* カード画像（ポップアップのメイン） */}
<img
  src={getCardImage(unit.unitId, unit.side, form)}
  alt={`${unit.unitId}-${form}`}
  style={{
    width: "100%",
    marginTop: 10,
    borderRadius: 12,
    objectFit: "contain",
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.14)",
    maxHeight: "72vh",
    display: "block",
  }}
  onError={() =>
    console.log("CARD IMG NG", unit.unitId, getCardImage(unit.unitId, unit.side, form))
  }
  onLoad={() =>
    console.log("CARD IMG OK", unit.unitId, getCardImage(unit.unitId, unit.side, form))
  }
/>

          </div>

          {/* 右：情報 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                padding: "10px 10px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, alignItems: "center" }}>
                <span>side: <b>{String(unit.side).toUpperCase()}</b></span>
                <span>form: <b>{form}</b></span>
                <span>HP: <b>{unit.hp}/{maxHp}</b></span>
                <span>ATK: <b>{atk}</b></span>
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
                      background: "rgba(0,0,0,0.22)",
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

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
              ※カード画像が無い場合はコンソールに CARD IMG NG が出るよ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
