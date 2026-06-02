import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  addBlackNoiseBayEventFlag,
  addShipPart,
  hasAllShipParts,
  readShipProgress,
  SHIP_PART_IDS,
  SHIP_PART_LABELS,
  type ShipPartId,
} from "../game/blackNoiseBay/progress";

type NecroCitySceneProps = {
  onReturnBlackNoiseBay: () => void;
};

type NecroSpotId = "entrance" | "plaza" | "market" | "clocktower" | "warehouse" | "shipyardOld" | "dockyard";

type NecroSpot = {
  id: NecroSpotId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  partId?: ShipPartId;
};

const NECRO_SPOTS: NecroSpot[] = [
  { id: "entrance", label: "入口", subLabel: "ブラックノイズ湾へ戻る", x: 50, y: 88 },
  { id: "plaza", label: "中央広場", subLabel: "クロイツのヒント", x: 50, y: 52 },
  { id: "market", label: "廃市場", subLabel: "帆布を探す", x: 22, y: 42, partId: "sailcloth" },
  { id: "clocktower", label: "崩れた時計塔", subLabel: "舵輪を探す", x: 72, y: 30, partId: "helm" },
  { id: "warehouse", label: "水没倉庫", subLabel: "防水材を探す", x: 24, y: 68, partId: "waterproof_material" },
  { id: "shipyardOld", label: "旧造船区", subLabel: "補強材を探す", x: 76, y: 66, partId: "hull_reinforcement" },
  { id: "dockyard", label: "造船所", subLabel: "船を作る", x: 52, y: 20 },
];

export function NecroCityScene({ onReturnBlackNoiseBay }: NecroCitySceneProps) {
  const [progress, setProgress] = useState(() => readShipProgress());
  const [activeSpot, setActiveSpot] = useState<NecroSpotId>("plaza");
  const partsSet = useMemo(() => new Set(progress.parts), [progress.parts]);
  const allPartsReady = progress.parts.length === SHIP_PART_IDS.length || hasAllShipParts();
  const shipBuilt = progress.flags.includes("ship_built") || progress.flags.includes("black_noise_bay_ship_ready");

  useEffect(() => {
    const refresh = () => setProgress(readShipProgress());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const getKreutzHint = () => {
    if (!partsSet.has("wood")) return "木材は、でっかい斧の子が持ってくるって言ってたにゃ";
    if (!partsSet.has("sailcloth")) return "風を受ける布なら、廃市場に残ってるかもしれないにゃ";
    if (!partsSet.has("helm")) return "回るものは、高いところに残ってた気がするにゃ";
    if (!partsSet.has("waterproof_material")) return "沈まないためのものは、水に近い倉庫を探すにゃ";
    if (!partsSet.has("hull_reinforcement")) return "船の底を守るものは、古い造船区にあるにゃ";
    return "部材は揃ったにゃ。造船所へ行くにゃ";
  };

  const collectPart = (partId: ShipPartId) => {
    if (partsSet.has(partId)) return;
    setProgress(addShipPart(partId));
  };

  const buildShip = () => {
    if (!allPartsReady) return;
    addBlackNoiseBayEventFlag("ship_built");
    setProgress(addBlackNoiseBayEventFlag("black_noise_bay_ship_ready"));
  };

  const activeSpotConfig = NECRO_SPOTS.find((spot) => spot.id === activeSpot);

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>NECRO CITY</div>
            <h1 style={titleStyle}>廃都ネクロシティ</h1>
            <div style={subtitleStyle}>船の部材が眠る廃都</div>
          </div>
          <button type="button" onClick={onReturnBlackNoiseBay} style={returnButtonStyle}>
            ブラックノイズ湾へ戻る
          </button>
        </header>

        <div style={mapStyle}>
          <div style={fogLayerStyle} />
          {NECRO_SPOTS.map((spot) => {
            const collected = spot.partId ? partsSet.has(spot.partId) : false;
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => {
                  if (spot.id === "entrance") {
                    onReturnBlackNoiseBay();
                    return;
                  }
                  setActiveSpot(spot.id);
                  if (spot.partId) collectPart(spot.partId);
                }}
                style={{
                  ...spotButtonStyle,
                  ...(activeSpot === spot.id ? spotActiveStyle : null),
                  ...(collected ? spotCollectedStyle : null),
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                }}
              >
                <span style={spotBadgeStyle}>{collected ? "GET" : spot.id === "plaza" ? "HINT" : spot.id === "dockyard" ? "BUILD" : "CHECK"}</span>
                <span>{spot.label}</span>
              </button>
            );
          })}
        </div>

        <section style={infoPanelStyle}>
          <div style={infoTitleStyle}>{activeSpotConfig?.label ?? "中央広場"}</div>
          {activeSpot === "plaza" ? (
            <div style={messageStyle}>
              <strong>クロイツ：</strong>
              <span>「この街、まだ少しだけ覚えてるにゃ」</span>
              <span>「{getKreutzHint()}」</span>
            </div>
          ) : activeSpotConfig?.partId ? (
            <div style={messageStyle}>
              <span>
                {partsSet.has(activeSpotConfig.partId)
                  ? `${SHIP_PART_LABELS[activeSpotConfig.partId]}を入手しました。`
                  : `${SHIP_PART_LABELS[activeSpotConfig.partId]}を探しています。`}
              </span>
              <span>船の部材：{progress.parts.length} / {SHIP_PART_IDS.length}</span>
            </div>
          ) : activeSpot === "dockyard" ? (
            <div style={messageStyle}>
              <span>船の部材：{progress.parts.length} / {SHIP_PART_IDS.length}</span>
              {shipBuilt ? (
                <span>船は完成しています。ブラックノイズ湾へ戻りましょう。</span>
              ) : allPartsReady ? (
                <>
                  <span>船の部材が揃いました。造船を開始しますか？</span>
                  <button type="button" onClick={buildShip} style={buildButtonStyle}>船を作る</button>
                </>
              ) : (
                <span>まだ部材が足りません。クロイツのヒントを頼りに、廃都を探しましょう。</span>
              )}
            </div>
          ) : (
            <div style={messageStyle}>ブラックノイズ湾へ戻ります。</div>
          )}
        </section>
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  padding: "12px 10px 20px",
  boxSizing: "border-box",
  color: "#edf7ff",
  background:
    "radial-gradient(circle at 28% 18%, rgba(122, 198, 255, 0.14), transparent 28%), radial-gradient(circle at 72% 26%, rgba(178, 130, 255, 0.12), transparent 26%), linear-gradient(180deg, #151a23 0%, #12171c 48%, #080b10 100%)",
};

const shellStyle: CSSProperties = { width: "min(720px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 12 };
const eyebrowStyle: CSSProperties = { color: "#a9d7ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", color: "#f0f6ff", fontSize: 28, textShadow: "0 2px 14px rgba(0,0,0,0.58)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(237,247,255,0.72)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#edf7ff", fontWeight: 950, cursor: "pointer" };
const mapStyle: CSSProperties = { position: "relative", height: "min(68vh, 560px)", minHeight: 420, overflow: "hidden", borderRadius: 16, border: "1px solid rgba(210,232,255,0.18)", background: "radial-gradient(circle at 50% 38%, rgba(121,135,144,0.24), transparent 30%), linear-gradient(145deg, #28313a 0%, #161a20 52%, #0d1016 100%)", boxShadow: "0 20px 56px rgba(0,0,0,0.46), inset 0 0 80px rgba(0,0,0,0.38)" };
const fogLayerStyle: CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 0%, rgba(190,210,230,0.08) 36%, transparent 62%), radial-gradient(circle at 22% 74%, rgba(99,122,142,0.22), transparent 24%)", pointerEvents: "none" };
const spotButtonStyle: CSSProperties = { position: "absolute", transform: "translate(-50%, -50%)", width: "min(34%, 180px)", minHeight: 58, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.26)", background: "linear-gradient(180deg, rgba(35, 47, 58, 0.9), rgba(12, 16, 22, 0.84))", color: "#edf7ff", fontWeight: 950, cursor: "pointer", boxShadow: "0 12px 26px rgba(0,0,0,0.34)" };
const spotActiveStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.62)", boxShadow: "0 0 18px rgba(255,224,163,0.15), 0 12px 26px rgba(0,0,0,0.34)" };
const spotCollectedStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.6)" };
const spotBadgeStyle: CSSProperties = { display: "inline-flex", marginRight: 6, padding: "2px 6px", borderRadius: 999, background: "rgba(169,215,255,0.16)", color: "#cfeaff", fontSize: 10 };
const infoPanelStyle: CSSProperties = { marginTop: 12, padding: 14, borderRadius: 14, border: "1px solid rgba(210,232,255,0.16)", background: "rgba(7, 10, 15, 0.72)", boxShadow: "0 18px 42px rgba(0,0,0,0.34)" };
const infoTitleStyle: CSSProperties = { color: "#ffe0a3", fontSize: 14, fontWeight: 950, marginBottom: 8 };
const messageStyle: CSSProperties = { display: "grid", gap: 7, color: "rgba(237,247,255,0.88)", fontSize: 13, lineHeight: 1.6, fontWeight: 850 };
const buildButtonStyle: CSSProperties = { justifySelf: "start", minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(255,220,136,0.66)", background: "linear-gradient(180deg, #ffd979, #b87624)", color: "#22160a", fontWeight: 950, cursor: "pointer" };
