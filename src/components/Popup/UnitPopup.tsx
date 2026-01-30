import { useEffect, useState } from "react";
import { getAvailableSkillsForUnit, type SkillId, SKILLS } from "../../game/skills/registry";
import type { Side } from "../../game/types";
import { getEffectiveAtk, getEffectiveMaxHp } from "../../game/stats";
import { useImgFallback } from "../imgFallback";

function skillUseKey(side: Side, instanceId: string, skillId: SkillId) {
  return `${side}:${instanceId}:${skillId}`;
}

type Props = {
  open: boolean;
  unit: any | null;
  unitsById: any;
  usedSkills: Record<string, boolean>;
  onClose: () => void;

  // フォールバック候補（Appから渡す）
  getCardCandidates: (unitId: string, side: "south" | "north", form?: "base" | "g") => string[];
};

export function UnitPopup({
  open,
  unit,
  unitsById,
  usedSkills,
  onClose,
  getCardCandidates,
}: Props) {
  const [w, setW] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNarrow = w < 720;

 const form = (unit?.form ?? "base") as "base" | "g";
  const cardCands = unit ? getCardCandidates(unit.unitId, unit.side, form) : [];
  const fb = useImgFallback(cardCands, { placeholder: "" }); // ← optsはオブジェクトね


  if (!open || !unit) return null;

  const def = unitsById?.[unit.unitId];
  if (!def) return null;

  const maxHp = getEffectiveMaxHp(def.base.hp, form);
  const atk = getEffectiveAtk(def.base.atk, form);





  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 13000,
        padding: 12,
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1020px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "rgba(10,10,12,0.96)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 18,
          boxShadow: "0 18px 60px rgba(0,0,0,0.72)",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {/* --- Sticky Header --- */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(10,10,12,0.92)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, fontSize: 16, lineHeight: 1.15 }}>
              {def.name}{" "}
              <span style={{ opacity: 0.7, fontSize: 12, fontWeight: 800 }}>
                ({String(unit.unitId)})
              </span>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(0,0,0,0.22)",
                  fontWeight: 900,
                  letterSpacing: 0.2,
                }}
              >
                SIDE: {String(unit.side).toUpperCase()}
              </span>

              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: form === "g" ? "rgba(255,215,0,0.12)" : "rgba(0,0,0,0.22)",
                  fontWeight: 900,
                  letterSpacing: 0.2,
                }}
              >
                FORM: {form.toUpperCase()}
              </span>

              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(0,0,0,0.22)",
                  fontWeight: 900,
                }}
              >
                ID: {String(unit.instanceId)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.30)",
              color: "#fff",
              fontWeight: 950,
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          >
            閉じる
          </button>
        </div>

        {/* --- Body --- */}
        <div
          style={{
            padding: 14,
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "minmax(340px, 420px) 1fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* --- Left: Card --- */}
          <div
            style={{
              position: isNarrow ? "relative" : "sticky",
              top: isNarrow ? "auto" : 64,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.22)",
              padding: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.9 }}>カード</div>

            <div
              style={{
                marginTop: 10,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.24)",
              }}
            >

   <img
        src={fb.src}
        onError={fb.onError}
        alt={`${unit.unitId}-${form}`}
        style={{
          width: "100%",
          display: "block",
          objectFit: "contain",
          maxHeight: isNarrow ? "56vh" : "72vh",
        }}
        draggable={false}
/>

            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.72 }}>
              ※画像が無い場合は候補へフォールバック
            </div>
          </div>

          {/* --- Right: Info --- */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.22)",
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 950, fontSize: 14 }}>ステータス</div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div
                  style={{
                    padding: "10px 10px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 900 }}>HP</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 950 }}>
                    {unit.hp}/{maxHp}
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 10px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 900 }}>ATK</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 950 }}>{atk}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 950 }}>スキル</div>

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {getAvailableSkillsForUnit(unit.unitId).map((s) => {
                  const formOk = !s.requiresForm || form === s.requiresForm;
                  const usedKey = skillUseKey(unit.side as Side, unit.instanceId, s.id);
                  const used = !!usedSkills[usedKey];
                  const mode = SKILLS?.[s.id]?.targetMode ?? s.targetMode;

                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: "10px 10px",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.22)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 950, fontSize: 14 }}>{s.label}</div>

                        {s.requiresForm && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.16)",
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
                              padding: "3px 10px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.16)",
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
                              padding: "3px 10px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.16)",
                              background: "rgba(255,255,255,0.08)",
                              opacity: 0.9,
                            }}
                          >
                            使用済
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.82 }}>
                        <span style={{ fontWeight: 900, opacity: 0.9 }}>mode:</span> {String(mode)}
                        {s.damage != null ? (
                          <>
                            {" "}
                            / <span style={{ fontWeight: 900, opacity: 0.9 }}>dmg:</span> {String(s.damage)}
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
