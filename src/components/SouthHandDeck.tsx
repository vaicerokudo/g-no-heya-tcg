import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Skin } from "../assets/imagePaths";
import type { Side, UnitDef } from "../game/types";

type Phase = "setup_draw" | "setup_deploy" | "battle";

type SouthDeckProps = {
  deckSouth: string[];
  skin: Skin;
  getDeckBackPath: (skin: Skin) => string;
};

type SouthHandProps = {
  phase: Phase;
  handSouth: string[];
  selectedHandKey: string | null;
  setSelectedHandKey: Dispatch<SetStateAction<string | null>>;
  selectedHandUnitId: string | null;
  deployPlaced: number;
  initialDeployCount: number;
  battleDeployUsed: boolean;
  unitsById: Record<string, UnitDef>;
  skin: Skin;
  getHandCardSrc: (unitId: string, side: Side, skin: Skin) => string;
  getHandFallbackSrc: (unitId: string, side: Side, skin: Skin) => string;
};

export function SouthDeck({ deckSouth, skin, getDeckBackPath }: SouthDeckProps) {
  return (
    <div
      className="southDeckPanel"
      style={{ width: "var(--south-deck-width, 180px)", flex: "var(--south-deck-flex, 0 0 auto)" }}
    >
      <div style={{ padding: "var(--south-panel-padding, 10px)", border: "1px solid #444", borderRadius: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>山札（South）</div>

        <button
          disabled
          style={{
            width: "100%",
            aspectRatio: "63 / 88",
            borderRadius: 12,
            border: "1px solid #6a5a00",
            background: "rgba(0,0,0,0.35)",
            padding: "var(--south-card-padding, 6px)",
            cursor: "default",
          }}
          title="初回は自動ドロー済み"
        >
          <div style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden", position: "relative" }}>
            <img
              src={getDeckBackPath(skin)}
              alt="deck back"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />

            <div
              style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,215,0,0.6)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 12,
                lineHeight: 1,
              }}
            >
              {deckSouth.length}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export function SouthHand({
  phase,
  handSouth,
  selectedHandKey,
  setSelectedHandKey,
  selectedHandUnitId,
  deployPlaced,
  initialDeployCount,
  battleDeployUsed,
  unitsById,
  skin,
  getHandCardSrc,
  getHandFallbackSrc,
}: SouthHandProps) {
  return (
    <div
      className="southHandPanel"
      style={{ width: "var(--south-hand-width, 260px)", flex: "var(--south-hand-flex, 0 0 auto)" }}
    >
      <div style={{ padding: "var(--south-panel-padding, 10px)", border: "1px solid #444", borderRadius: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>手札（South）: {handSouth.length}枚</div>

        {phase === "setup_deploy" ? (
          <div className="southHandNote" style={{ fontSize: "var(--south-note-font-size, 12px)", opacity: 0.85, marginBottom: 8 }}>
            出撃: {deployPlaced}/{initialDeployCount}（下段クリックで配置）
          </div>
        ) : (
          <div className="southHandNote" style={{ fontSize: "var(--south-note-font-size, 12px)", opacity: 0.85, marginBottom: 8 }}>
            増援: {battleDeployUsed ? "済（このターンは終了）" : "未"}（手札を選んで下段をクリック / 1ターン1回）
          </div>
        )}

        <div
          className="southHandGrid"
          style={{
            display: "var(--south-hand-grid-display, grid)",
            gridTemplateColumns: "var(--south-hand-grid-template-columns, 1fr 1fr)",
            flexWrap: "var(--south-hand-grid-flex-wrap, initial)" as CSSProperties["flexWrap"],
            gap: "var(--south-hand-grid-gap, 10px)",
            maxHeight: "var(--south-hand-max-height, calc(100vh - 220px))",
            overflowX: "var(--south-hand-grid-overflow-x, visible)" as CSSProperties["overflowX"],
            overflowY: "var(--south-hand-grid-overflow-y, auto)" as CSSProperties["overflowY"],
            paddingRight: "var(--south-hand-grid-padding-right, 6px)",
          }}
        >
          {handSouth.map((uid, i) => {
            const key = `${uid}-${i}`;
            const isSelected = selectedHandKey === key;
            const name = unitsById[uid]?.name ?? uid;
            const src = getHandCardSrc(uid, "south", skin);

            return (
              <button
                key={key}
                className="southHandCardButton"
                onClick={() => setSelectedHandKey(key)}
                style={{
                  textAlign: "left",
                  padding: "var(--south-card-button-padding, 8px)",
                  borderRadius: 12,
                  border: isSelected ? "2px solid gold" : "1px solid #444",
                  background: "rgba(0,0,0,0.20)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                  flex: "var(--south-hand-card-flex, initial)",
                  width: "var(--south-hand-card-width, auto)",
                }}
              >
                <div
                  className="southHandCardImage"
                  style={{
                    width: "100%",
                    maxWidth: "var(--south-hand-card-max-width, 180px)",
                    margin: "0 auto",
                    aspectRatio: "63 / 88",
                    borderRadius: 10,
                    overflow: "hidden",
                    position: "relative",
                    border: "1px solid rgba(255,215,0,0.35)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <img
                    src={src}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    onError={(e) => {
                      e.currentTarget.src = getHandFallbackSrc(uid, "south", skin);
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {!selectedHandUnitId && (
          <div className="southHandNote" style={{ marginTop: 10, fontSize: "var(--south-note-font-size, 12px)", opacity: 0.75 }}>
            まず手札からカードを1枚選んでください
          </div>
        )}
      </div>
    </div>
  );
}
