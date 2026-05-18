import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { cardCandidates, type Skin } from "../../assets/imagePaths";
import { getSkinLabel } from "../../assets/skinLabels";
import type { UnitDef } from "../../game/types";
import { getAvailableSkillsForUnit, SKILLS } from "../../game/skills/registry";
import { useImgFallback } from "../imgFallback";

type CollectionDialogProps = {
  unitsById: Record<string, UnitDef>;
  onClose: () => void;
};

const SKINS: Skin[] = ["default", "dark", "travel", "comic"];

function describeMove(unit: UnitDef) {
  const pattern = unit.base.movePattern;
  if (pattern.type === "orthogonal") return `${pattern.range}`;
  if (pattern.type === "custom") return `${pattern.movesRelative.length} pattern`;
  if (pattern.type === "teleportFixed") return `${pattern.destinationsRelative.length} fixed`;
  return "-";
}

function CardThumb({
  unit,
  skin,
  selected,
  onClick,
}: {
  unit: UnitDef;
  skin: Skin;
  selected: boolean;
  onClick: () => void;
}) {
  const imageCandidates = useMemo(
    () => cardCandidates(unit.id, "south", "base", skin),
    [skin, unit.id]
  );
  const fb = useImgFallback(imageCandidates, { placeholder: "" });

  return (
    <button
      onClick={onClick}
      style={{
        ...cardButtonStyle,
        border: selected ? "2px solid rgba(255, 216, 102, 0.96)" : cardButtonStyle.border,
        boxShadow: selected ? "0 0 0 3px rgba(255, 216, 102, 0.16)" : cardButtonStyle.boxShadow,
      }}
    >
      <div style={cardImageWrapStyle}>
        {fb.src ? (
          <img
            src={fb.src}
            onError={fb.onError}
            alt={unit.name}
            loading="lazy"
            decoding="async"
            style={cardImageStyle}
          />
        ) : null}
      </div>
      <div style={cardNameStyle}>{unit.name}</div>
    </button>
  );
}

export function CollectionDialog({ unitsById, onClose }: CollectionDialogProps) {
  const units = useMemo(
    () => Object.values(unitsById).sort((a, b) => a.name.localeCompare(b.name, "ja")),
    [unitsById]
  );
  const [skin, setSkin] = useState<Skin>("default");
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => units[0]?.id ?? "");

  useEffect(() => {
    if (!selectedUnitId && units[0]) setSelectedUnitId(units[0].id);
  }, [selectedUnitId, units]);

  const selectedUnit = unitsById[selectedUnitId] ?? units[0] ?? null;
  const detailImageCandidates = useMemo(
    () => (selectedUnit ? cardCandidates(selectedUnit.id, "south", "base", skin) : []),
    [selectedUnit, skin]
  );
  const detailImage = useImgFallback(detailImageCandidates, { placeholder: "" });
  const skills = selectedUnit ? getAvailableSkillsForUnit(selectedUnit.id) : [];

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          閉じる
        </button>

        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>CARD COLLECTION</div>
            <h2 style={titleStyle}>カード収集表</h2>
          </div>

          <div style={tabsStyle}>
            {SKINS.map((nextSkin) => (
              <button
                key={nextSkin}
                onClick={() => setSkin(nextSkin)}
                style={tabButtonStyle(nextSkin === skin)}
              >
                {getSkinLabel(nextSkin)}
              </button>
            ))}
          </div>
        </div>

        <div style={contentStyle}>
          <div style={listStyle}>
            {units.map((unit) => (
              <CardThumb
                key={unit.id}
                unit={unit}
                skin={skin}
                selected={unit.id === selectedUnit?.id}
                onClick={() => setSelectedUnitId(unit.id)}
              />
            ))}
          </div>

          <div style={detailStyle}>
            {selectedUnit ? (
              <>
                <div style={detailImageWrapStyle}>
                  {detailImage.src ? (
                    <img
                      src={detailImage.src}
                      onError={detailImage.onError}
                      alt={selectedUnit.name}
                      style={detailImageStyle}
                    />
                  ) : null}
                </div>

                <div style={detailTextStyle}>
                  <div style={detailNameStyle}>{selectedUnit.name}</div>
                  <div style={statsStyle}>
                    <span>ATK {selectedUnit.base.atk}</span>
                    <span>HP {selectedUnit.base.hp}</span>
                    <span>MOVE {describeMove(selectedUnit)}</span>
                  </div>

                  <div style={skillsTitleStyle}>スキル</div>
                  <div style={skillsListStyle}>
                    {skills.length > 0 ? (
                      skills.map((skill) => {
                        const full = { ...(skill as any), ...(SKILLS?.[skill.id] ?? {}) };
                        const desc = typeof full.desc === "string" ? full.desc.trim() : "";
                        return (
                          <div key={skill.id} style={skillRowStyle}>
                            <div style={skillNameStyle}>{full.label ?? skill.label}</div>
                            {desc ? <div style={skillDescStyle}>{desc}</div> : null}
                          </div>
                        );
                      })
                    ) : (
                      <div style={emptySkillStyle}>スキルなし</div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 12000,
  padding: "clamp(10px, 3dvh, 22px)",
  boxSizing: "border-box",
  background: "rgba(6, 5, 5, 0.66)",
  backdropFilter: "blur(2px)",
  display: "grid",
  placeItems: "center",
};

const panelStyle: CSSProperties = {
  position: "relative",
  width: "min(1080px, calc(100% - 12px))",
  maxHeight: "calc(100dvh - 24px)",
  overflowY: "auto",
  boxSizing: "border-box",
  padding: "22px",
  borderRadius: 20,
  border: "1px solid rgba(255,216,102,0.58)",
  background: "linear-gradient(180deg, rgba(38,25,17,0.97), rgba(17,13,12,0.97))",
  boxShadow: "0 24px 58px rgba(0,0,0,0.58), inset 0 0 34px rgba(255,198,86,0.08)",
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  right: 14,
  top: 14,
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.28)",
  background: "rgba(255,241,204,0.14)",
  color: "#fff1cc",
  fontWeight: 900,
  touchAction: "manipulation",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 12,
  flexWrap: "wrap",
  paddingRight: 76,
  marginBottom: 16,
};

const eyebrowStyle: CSSProperties = {
  color: "#f3c878",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: "0 0 2px",
  fontSize: 24,
  color: "#fff1ca",
};

const tabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 38,
    padding: "0 14px",
    borderRadius: 999,
    border: active ? "1px solid rgba(255,216,102,0.9)" : "1px solid rgba(255,232,180,0.24)",
    background: active ? "rgba(255,216,102,0.24)" : "rgba(255,241,204,0.1)",
    color: "#fff1cc",
    fontWeight: 900,
    touchAction: "manipulation",
  };
}

const contentStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: 18,
  alignItems: "start",
};

const listStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
  gap: 10,
  maxHeight: "min(58dvh, 560px)",
  overflowY: "auto",
  paddingRight: 4,
};

const cardButtonStyle: CSSProperties = {
  minWidth: 0,
  padding: 7,
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.22)",
  background: "rgba(0,0,0,0.2)",
  color: "#fff1cc",
  boxShadow: "0 8px 18px rgba(0,0,0,0.24)",
  fontWeight: 900,
  touchAction: "manipulation",
};

const cardImageWrapStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "63 / 88",
  borderRadius: 9,
  overflow: "hidden",
  border: "1px solid rgba(255,216,102,0.22)",
  background: "rgba(0,0,0,0.24)",
};

const cardImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
};

const cardNameStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  lineHeight: 1.25,
};

const detailStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  minWidth: 0,
};

const detailImageWrapStyle: CSSProperties = {
  width: "min(300px, 100%)",
  justifySelf: "center",
  aspectRatio: "63 / 88",
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid rgba(255,216,102,0.34)",
  background: "rgba(0,0,0,0.26)",
  boxShadow: "0 16px 34px rgba(0,0,0,0.36)",
};

const detailImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
};

const detailTextStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const detailNameStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
  color: "#ffd66d",
};

const statsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  color: "#fff6df",
  fontWeight: 900,
};

const skillsTitleStyle: CSSProperties = {
  marginTop: 4,
  color: "rgba(255,232,180,0.78)",
  fontSize: 13,
  fontWeight: 950,
};

const skillsListStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const skillRowStyle: CSSProperties = {
  padding: "9px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.2)",
};

const skillNameStyle: CSSProperties = {
  fontWeight: 950,
  color: "#fff1cc",
};

const skillDescStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 13,
  lineHeight: 1.45,
  color: "rgba(255,246,223,0.88)",
};

const emptySkillStyle: CSSProperties = {
  color: "rgba(255,246,223,0.68)",
  fontSize: 13,
};
