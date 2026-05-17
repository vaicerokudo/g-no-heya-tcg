import { useEffect, useState } from "react";
import {
  getAvailableSkillsForUnit,
  type SkillId,
  SKILLS,
  skillKey,
} from "../../game/skills/registry";
import type { Side } from "../../game/types";
import { getEffectiveAtk, getEffectiveMaxHp } from "../../game/stats";
import { buildStatusRows } from "../../game/ui/statusRows";
import { useImgFallback } from "../imgFallback";

function modeLabel(mode: unknown) {
  const m = String(mode ?? "");
  const dict: Record<string, string> = {
    chooseLineDirection: "直線方向を指定",
    chooseEnemyAdjacent: "隣接する敵を指定",
    enemiesInRange: "範囲内の敵すべて",
    instant: "即時発動",
    chooseFront3Cells: "正面3マスを指定",
    chooseAllyInRange: "範囲内の味方を指定",
    self: "自分",
    ally: "味方",
    enemy: "敵",
  };

  return dict[m] ?? m;
}

function autoDesc(s: any) {
  const parts: string[] = [];

  const mode = s?.targetMode ?? s?.mode;
  if (mode) parts.push(`対象: ${modeLabel(mode)}`);

  if (s?.range != null) parts.push(`射程: ${s.range}`);
  if (s?.aoeRadius != null) parts.push(`範囲: ${s.aoeRadius}`);
  if (s?.damage != null) parts.push(`ダメージ: ${s.damage}`);
  if (s?.heal != null) parts.push(`回復: ${s.heal}`);
  if (s?.knockback != null) parts.push(`KB: ${s.knockback}`);
  if (s?.stunTurns != null) parts.push(`スタン: ${s.stunTurns}`);
  if (s?.burnTicks != null) parts.push(`炎上: ${s.burnTicks}`);
  if (s?.requiresForm) parts.push(`条件: 進化(${String(s.requiresForm).toUpperCase()})`);
  if (s?.oncePerMatch) parts.push("制限: 1試合1回");

  return parts.join(" / ");
}

function getStatusBadges(unit: any): { key: string; label: string; title?: string }[] {
  const badges: { key: string; label: string; title?: string }[] = [];

  const stun = Number(unit?.stun ?? 0);
  if (stun > 0) badges.push({ key: "stun", label: `スタン:${stun}`, title: "行動不能" });

  const burn = Number(unit?.burn ?? 0);
  if (burn > 0) badges.push({ key: "burn", label: `炎上:${burn}`, title: "ターン終了時に1ダメージ" });

  const dr = Number(unit?.dmgReduction ?? 0);
  if (dr > 0) badges.push({ key: "dr", label: `軽減-${dr}`, title: "被ダメージ軽減" });

  const dmgBonus = Number(unit?.dmgBonus ?? 0);
  if (dmgBonus > 0) badges.push({ key: "dmgBonus", label: `ATK+${dmgBonus}`, title: "通常攻撃ダメージ上昇" });

  if (unit?.hibikiShieldAllActive)
    badges.push({ key: "hibikiShieldAll", label: "守護", title: "距離2以内の味方を守る" });

  if (unit?.aegisLineActive)
    badges.push({ key: "aegisLine", label: "守護結界", title: "味方への被ダメージを軽減" });

  return badges;
}

type Props = {
  open: boolean;
  unit: any | null;
  unitsById: any;
  usedSkills: Record<string, boolean>;
  onClose: () => void;
  getCardCandidates: (
    unitId: string,
    side: "south" | "north",
    form?: "base" | "g"
  ) => string[];
};

export function UnitPopup({
  open,
  unit,
  unitsById,
  usedSkills,
  onClose,
  getCardCandidates,
}: Props) {
  const [w, setW] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNarrow = w < 720;
  const form = (unit?.form ?? "base") as "base" | "g";
  const cardCands = unit ? getCardCandidates(unit.unitId, unit.side, form) : [];
  const fb = useImgFallback(cardCands, { placeholder: "" });

  if (!open || !unit) return null;

  const def = unitsById?.[unit.unitId];
  if (!def) return null;

  const maxHp = getEffectiveMaxHp(def.base.hp, form);
  const atk = getEffectiveAtk(def.base.atk, form);
  const statusBadges = getStatusBadges(unit);
  const statusRows = buildStatusRows(unit);

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

              {statusBadges.map((b) => (
                <span
                  key={b.key}
                  title={b.title ?? ""}
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(255,255,255,0.06)",
                    fontWeight: 950,
                    letterSpacing: 0.2,
                  }}
                >
                  {b.label}
                </span>
              ))}
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

        <div
          style={{
            padding: 14,
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "minmax(340px, 420px) 1fr",
            gap: 14,
            alignItems: "start",
          }}
        >
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
              画像がない場合は候補からフォールバックします
            </div>
          </div>

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

              <div
                style={{
                  marginTop: 12,
                  padding: "10px 10px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.18)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.78, fontWeight: 950 }}>現在の状態</div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    fontSize: 12,
                    lineHeight: 1.35,
                    opacity: 0.9,
                    overflowWrap: "anywhere",
                  }}
                >
                  {statusRows.length > 0 ? (
                    statusRows.map((row) => <div key={row}>{row}</div>)
                  ) : (
                    <div>なし</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 950 }}>スキル</div>

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {getAvailableSkillsForUnit(unit.unitId).map((s) => {
                  const full = { ...(s as any), ...(SKILLS?.[s.id] ?? {}) };
                  const formOk = !full.requiresForm || form === full.requiresForm;
                  const usedKey = skillKey(unit.side as Side, unit.instanceId, s.id as SkillId);
                  const used = !!usedSkills[usedKey];
                  const desc = autoDesc(full);
                  const naturalDesc = typeof full.desc === "string" ? full.desc.trim() : "";

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
                        <div style={{ fontWeight: 950, fontSize: 14 }}>{full.label ?? s.label}</div>

                        {full.requiresForm && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.16)",
                              opacity: formOk ? 0.9 : 0.6,
                            }}
                          >
                            要{String(full.requiresForm).toUpperCase()}
                          </span>
                        )}

                        {full.oncePerMatch && (
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

                        {full.oncePerMatch && used && (
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
                            使用済み
                          </span>
                        )}

                        {!formOk && full.requiresForm ? (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.16)",
                              background: "rgba(255,80,80,0.10)",
                              opacity: 0.9,
                            }}
                          >
                            条件未達
                          </span>
                        ) : null}
                      </div>

                      {naturalDesc ? (
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.92, lineHeight: 1.45 }}>
                          {naturalDesc}
                        </div>
                      ) : null}

                      {desc ? (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.86, lineHeight: 1.35 }}>
                          {desc}
                        </div>
                      ) : null}
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
