import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { cardCandidates, portraitThumbCandidates, type Form, type Skin } from "../../assets/imagePaths";
import { getSkinLabel } from "../../assets/skinLabels";
import type { UnitDef } from "../../game/types";
import { getAvailableSkillsForUnit, SKILLS } from "../../game/skills/registry";
import { useImgFallback } from "../imgFallback";

type CollectionDialogProps = {
  unitsById: Record<string, UnitDef>;
  onClose: () => void;
};

const SKINS: Skin[] = ["default", "dark", "travel", "comic"];
type CatalogTab = "members" | "enemies";

function getCollectionForms(unit: UnitDef | null): Form[] {
  if (!unit) return ["base"];
  if (unit.id === "YABUKO_FM") return ["fm"];
  return ["base", "g"];
}

function getFormLabel(form: Form) {
  if (form === "g") return "G";
  if (form === "fm") return "FM";
  return "Base";
}

function getAssetForm(unitId: string, form: Form): Form {
  if (unitId === "YABUKO_FM") return "base";
  return form;
}

function collectionCardCandidates(unitId: string, skin: Skin, form: Form) {
  const assetForm = getAssetForm(unitId, form);
  const id = unitId.trim().toLowerCase();
  const fullCardCandidates = cardCandidates(unitId, "south", assetForm, skin);
  if (assetForm !== "base") return fullCardCandidates;

  const handId = unitId.trim().toUpperCase();
  return Array.from(
    new Set([
      `/cards/hand/${skin}/south/${handId}.webp`,
      `/cards/south/${skin}/${assetForm}/${id}.png`,
      `/cards/hand/default/south/${handId}.webp`,
      ...fullCardCandidates,
    ])
  );
}

function enemyUnitImageCandidates(unitId: string) {
  const id = unitId.trim().toLowerCase();
  return [`/portraits/thumb/north/default/base/${id}.webp`, `/portraits/north/default/base/${id}.png`];
}

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
    () => collectionCardCandidates(unit.id, skin, "base"),
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

function EnemyThumb({
  unit,
  selected,
  onClick,
}: {
  unit: UnitDef;
  selected: boolean;
  onClick: () => void;
}) {
  const imageCandidates = useMemo(() => enemyUnitImageCandidates(unit.id), [unit.id]);
  const fb = useImgFallback(imageCandidates, { placeholder: "" });

  return (
    <button
      onClick={onClick}
      style={{
        ...enemyButtonStyle,
        border: selected ? "2px solid rgba(255, 120, 72, 0.96)" : enemyButtonStyle.border,
        boxShadow: selected ? "0 0 0 3px rgba(255, 120, 72, 0.16)" : enemyButtonStyle.boxShadow,
      }}
    >
      <div style={enemyImageWrapStyle}>
        {fb.src ? (
          <img
            src={fb.src}
            onError={fb.onError}
            alt={unit.name}
            loading="lazy"
            decoding="async"
            style={enemyImageStyle}
          />
        ) : null}
      </div>
      <div style={cardNameStyle}>{unit.name}</div>
      <div style={enemyStatsStyle}>
        <span>ATK {unit.base.atk}</span>
        <span>HP {unit.base.hp}</span>
      </div>
    </button>
  );
}

export function CollectionDialog({ unitsById, onClose }: CollectionDialogProps) {
  const units = useMemo(
    () => Object.values(unitsById).filter((unit) => !unit.enemyOnly).sort((a, b) => a.name.localeCompare(b.name, "ja")),
    [unitsById]
  );
  const enemyUnits = useMemo(
    () => Object.values(unitsById).filter((unit) => unit.enemyOnly).sort((a, b) => a.name.localeCompare(b.name, "ja")),
    [unitsById]
  );
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("members");
  const [skin, setSkin] = useState<Skin>("default");
  const displayUnits = catalogTab === "enemies" ? enemyUnits : units;
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => displayUnits[0]?.id ?? "");
  const [selectedForm, setSelectedForm] = useState<Form>("base");

  useEffect(() => {
    if (!displayUnits.some((unit) => unit.id === selectedUnitId)) {
      setSelectedUnitId(displayUnits[0]?.id ?? "");
      setSelectedForm("base");
    }
  }, [displayUnits, selectedUnitId]);

  const selectedUnit = unitsById[selectedUnitId] ?? displayUnits[0] ?? null;
  const availableForms = useMemo(() => getCollectionForms(selectedUnit), [selectedUnit]);

  useEffect(() => {
    if (!availableForms.includes(selectedForm)) {
      setSelectedForm(availableForms[0] ?? "base");
    }
  }, [availableForms, selectedForm]);

  const detailImageCandidates = useMemo(
    () =>
      selectedUnit
        ? cardCandidates(selectedUnit.id, "south", getAssetForm(selectedUnit.id, selectedForm), skin)
        : [],
    [selectedUnit, selectedForm, skin]
  );
  const detailImage = useImgFallback(detailImageCandidates, { placeholder: "" });
  const detailPortraitCandidates = useMemo(
    () =>
      selectedUnit
        ? portraitThumbCandidates(
            selectedUnit.id,
            "south",
            getAssetForm(selectedUnit.id, selectedForm),
            skin
          )
        : [],
    [selectedUnit, selectedForm, skin]
  );
  const detailPortrait = useImgFallback(detailPortraitCandidates, { placeholder: "" });
  const enemyDetailImageCandidates = useMemo(
    () => (selectedUnit && catalogTab === "enemies" ? enemyUnitImageCandidates(selectedUnit.id) : []),
    [catalogTab, selectedUnit]
  );
  const enemyDetailImage = useImgFallback(enemyDetailImageCandidates, { placeholder: "" });
  const skills = selectedUnit ? getAvailableSkillsForUnit(selectedUnit.id) : [];

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          閉じる
        </button>

        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>CARD CATALOG</div>
            <h2 style={titleStyle}>カード図鑑</h2>
          </div>

          <div style={tabsStyle}>
            <button
              onClick={() => setCatalogTab("members")}
              style={tabButtonStyle(catalogTab === "members")}
            >
              MEMBERS
            </button>
            <button
              onClick={() => setCatalogTab("enemies")}
              style={tabButtonStyle(catalogTab === "enemies")}
            >
              エネミー
            </button>
            {catalogTab === "members" ? SKINS.map((nextSkin) => (
              <button
                key={nextSkin}
                onClick={() => setSkin(nextSkin)}
                style={tabButtonStyle(nextSkin === skin)}
              >
                {getSkinLabel(nextSkin)}
              </button>
            )) : null}
          </div>
        </div>

        <div style={contentStyle}>
          <div style={listStyle}>
            {displayUnits.map((unit) => (
              catalogTab === "enemies" ? (
                <EnemyThumb
                  key={unit.id}
                  unit={unit}
                  selected={unit.id === selectedUnit?.id}
                  onClick={() => {
                    setSelectedUnitId(unit.id);
                    setSelectedForm("base");
                  }}
                />
              ) : (
              <CardThumb
                key={unit.id}
                unit={unit}
                skin={skin}
                selected={unit.id === selectedUnit?.id}
                onClick={() => {
                  setSelectedUnitId(unit.id);
                  setSelectedForm(getCollectionForms(unit)[0] ?? "base");
                }}
              />
              )
            ))}
          </div>

          <div style={detailStyle}>
            {selectedUnit ? (
              <>
                {catalogTab === "enemies" ? (
                  <div style={enemyDetailVisualStyle}>
                    {enemyDetailImage.src ? (
                      <img
                        src={enemyDetailImage.src}
                        onError={enemyDetailImage.onError}
                        alt={selectedUnit.name}
                        loading="lazy"
                        decoding="async"
                        style={enemyDetailImageStyle}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div style={detailVisualsStyle}>
                    <div style={detailImageWrapStyle}>
                      {detailImage.src ? (
                        <img
                          src={detailImage.src}
                          onError={detailImage.onError}
                          alt={selectedUnit.name}
                          loading="lazy"
                          decoding="async"
                          style={detailImageStyle}
                        />
                      ) : null}
                    </div>

                    <div style={detailPortraitPanelStyle} aria-label={`${selectedUnit.name} 盤面ユニット`}>
                      {detailPortrait.src ? (
                        <img
                          src={detailPortrait.src}
                          onError={detailPortrait.onError}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={detailPortraitStyle}
                        />
                      ) : null}
                    </div>
                  </div>
                )}

                <div style={detailTextStyle}>
                  <div style={detailNameStyle}>{selectedUnit.name}</div>
                  {catalogTab === "members" ? (
                    <div style={formTabsStyle} aria-label="カードform選択">
                      {availableForms.map((form) => (
                        <button
                          key={form}
                          onClick={() => setSelectedForm(form)}
                          style={formButtonStyle(form === selectedForm)}
                        >
                          {getFormLabel(form)}
                        </button>
                      ))}
                    </div>
                  ) : null}
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

const enemyButtonStyle: CSSProperties = {
  ...cardButtonStyle,
  border: "1px solid rgba(255,138,92,0.28)",
  background: "linear-gradient(180deg, rgba(74,28,20,0.55), rgba(0,0,0,0.24))",
};

const enemyImageWrapStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: 10,
  overflow: "hidden",
  border: "1px solid rgba(255,138,92,0.24)",
  background:
    "radial-gradient(circle at 50% 56%, rgba(255,138,92,0.18), rgba(0,0,0,0.2) 62%), rgba(0,0,0,0.28)",
  display: "grid",
  placeItems: "center",
};

const enemyImageStyle: CSSProperties = {
  width: "86%",
  height: "86%",
  objectFit: "contain",
  display: "block",
  filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.52))",
};

const enemyStatsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 5,
  color: "rgba(255,232,180,0.82)",
  fontSize: 11,
  fontWeight: 950,
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

const detailVisualsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  flexWrap: "wrap",
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

const detailPortraitPanelStyle: CSSProperties = {
  width: "min(180px, 42vw)",
  aspectRatio: "1 / 1",
  borderRadius: 18,
  border: "1px solid rgba(142, 230, 255, 0.28)",
  background:
    "radial-gradient(circle at 50% 54%, rgba(105,213,255,0.24), rgba(105,213,255,0.08) 46%, rgba(0,0,0,0.28) 72%), linear-gradient(180deg, rgba(255,241,204,0.08), rgba(0,0,0,0.2))",
  boxShadow: "0 14px 30px rgba(0,0,0,0.32), inset 0 0 22px rgba(107,213,255,0.1)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
};

const detailPortraitStyle: CSSProperties = {
  width: "86%",
  height: "86%",
  objectFit: "contain",
  display: "block",
  filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.46))",
};

const enemyDetailVisualStyle: CSSProperties = {
  width: "min(360px, 100%)",
  justifySelf: "center",
  aspectRatio: "1 / 1",
  borderRadius: 18,
  border: "1px solid rgba(255,138,92,0.34)",
  background:
    "radial-gradient(circle at 50% 55%, rgba(255,138,92,0.24), rgba(255,138,92,0.08) 46%, rgba(0,0,0,0.34) 74%), linear-gradient(180deg, rgba(255,232,180,0.08), rgba(0,0,0,0.24))",
  boxShadow: "0 16px 34px rgba(0,0,0,0.36), inset 0 0 28px rgba(255,138,92,0.12)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
};

const enemyDetailImageStyle: CSSProperties = {
  width: "88%",
  height: "88%",
  objectFit: "contain",
  display: "block",
  filter: "drop-shadow(0 14px 16px rgba(0,0,0,0.58))",
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

const formTabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

function formButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    border: active ? "1px solid rgba(142,230,255,0.82)" : "1px solid rgba(255,232,180,0.22)",
    background: active ? "rgba(105,213,255,0.2)" : "rgba(255,241,204,0.08)",
    color: "#fff1cc",
    fontSize: 12,
    fontWeight: 950,
    touchAction: "manipulation",
  };
}

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
