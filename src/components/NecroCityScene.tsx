import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  addBlackNoiseBayEventFlag,
  addShipPart,
  readShipProgress,
  SHIP_PART_IDS,
  SHIP_PART_LABELS,
  type BlackNoiseBayEventFlag,
  type ShipPartId,
} from "../game/blackNoiseBay/progress";

type NecroCitySceneProps = {
  onReturnBlackNoiseBay: () => void;
};

type NecroSpotId =
  | "entrance"
  | "plaza"
  | "market"
  | "tavern"
  | "chapel"
  | "clocktower"
  | "watchtower"
  | "warehouse"
  | "oldPier"
  | "residential"
  | "lighthouse"
  | "shipyardOld"
  | "dockyard";

type KruitzExpression = "normal" | "think" | "idea" | "trouble" | "happy" | "satisfied";

type NecroSpot = {
  id: NecroSpotId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  kind: "exit" | "guide" | "clue" | "part" | "build";
  partId?: ShipPartId;
};

const KRUitz_IMAGES: Record<KruitzExpression, string> = {
  normal: "/ui/kruitz/normal.png",
  think: "/ui/kruitz/think.png",
  idea: "/ui/kruitz/idea.png",
  trouble: "/ui/kruitz/trouble.png",
  happy: "/ui/kruitz/happy.png",
  satisfied: "/ui/kruitz/satisfied.png",
};

const NECRO_SPOTS: NecroSpot[] = [
  { id: "dockyard", label: "造船所", subLabel: "船を組み上げる", x: 52, y: 16, kind: "build" },
  { id: "clocktower", label: "崩れた時計塔", subLabel: "舵輪と機構を調べる", x: 72, y: 27, kind: "part", partId: "helm" },
  { id: "lighthouse", label: "灯台跡", subLabel: "航海灯を探す", x: 86, y: 43, kind: "part", partId: "lantern" },
  { id: "watchtower", label: "見張り塔跡", subLabel: "羅針盤を探す", x: 70, y: 47, kind: "part", partId: "compass" },
  { id: "plaza", label: "中央広場", subLabel: "クロイツに相談", x: 50, y: 52, kind: "guide" },
  { id: "market", label: "廃市場", subLabel: "運搬記録を探す", x: 24, y: 39, kind: "clue" },
  { id: "tavern", label: "旧酒場", subLabel: "帆布の保管場所", x: 14, y: 54, kind: "part", partId: "sailcloth" },
  { id: "chapel", label: "崩れた礼拝堂", subLabel: "街の記録を読む", x: 36, y: 34, kind: "clue" },
  { id: "warehouse", label: "水没倉庫", subLabel: "防水材を探す", x: 25, y: 70, kind: "part", partId: "waterproof_material" },
  { id: "oldPier", label: "朽ちた船着き場", subLabel: "錨鎖を探す", x: 50, y: 73, kind: "part", partId: "anchor_chain" },
  { id: "shipyardOld", label: "旧造船区", subLabel: "船底補強材を探す", x: 78, y: 68, kind: "part", partId: "hull_reinforcement" },
  { id: "residential", label: "住民街跡", subLabel: "残された手記", x: 38, y: 83, kind: "clue" },
  { id: "entrance", label: "入口", subLabel: "ブラックノイズ湾へ戻る", x: 50, y: 91, kind: "exit" },
];

function hasFlag(flags: BlackNoiseBayEventFlag[], flag: BlackNoiseBayEventFlag) {
  return flags.includes(flag);
}

function getNextMissingPart(partsSet: Set<ShipPartId>) {
  return SHIP_PART_IDS.find((partId) => !partsSet.has(partId)) ?? null;
}

function getKruitzHint(partsSet: Set<ShipPartId>, flags: BlackNoiseBayEventFlag[]) {
  const collected = partsSet.size;

  if (!partsSet.has("wood")) {
    return "木材は、でっかい斧の子が持ってくるって言ってたにゃ。湾での調査を進めるにゃ。";
  }
  if (!hasFlag(flags, "necro_market_record_found")) {
    return "まず廃市場に行くにゃ。布の行き先を書いた運搬記録が残ってるかもしれないにゃ。";
  }
  if (!partsSet.has("sailcloth")) {
    return "記録にある保管先は旧酒場にゃ。風を受ける布は、そこに残ってるはずにゃ。";
  }
  if (!partsSet.has("helm")) {
    return "高いところに、回るものが残ってた気がするにゃ。崩れた時計塔を探すにゃ。";
  }
  if (!hasFlag(flags, "necro_clock_mechanism_found") || !partsSet.has("compass")) {
    return "時計塔の機構が分かれば、見張り塔跡の羅針盤も使えるかもしれないにゃ。";
  }
  if (!partsSet.has("waterproof_material")) {
    return "沈まないためのものは、水の近くを探すにゃ。水没倉庫が怪しいにゃ。";
  }
  if (!partsSet.has("anchor_chain")) {
    return "船を留める鎖は、朽ちた船着き場に残ってるかもしれないにゃ。";
  }
  if (!partsSet.has("lantern")) {
    return "霧の湾を進むなら光がいるにゃ。灯台跡を見てくるにゃ。";
  }
  if (!partsSet.has("hull_reinforcement")) {
    return "船の底を守るものは、古い造船区にあるにゃ。最後の仕上げにゃ。";
  }
  if (collected >= SHIP_PART_IDS.length) {
    return "部材は揃ったにゃ。造船所へ行くにゃ。";
  }
  return "この街、まだ少しだけ覚えてるにゃ。中央広場に戻ったら、また思い出すにゃ。";
}

export function NecroCityScene({ onReturnBlackNoiseBay }: NecroCitySceneProps) {
  const [progress, setProgress] = useState(() => readShipProgress());
  const [activeSpot, setActiveSpot] = useState<NecroSpotId>("plaza");
  const partsSet = useMemo(() => new Set(progress.parts), [progress.parts]);
  const flags = progress.flags;
  const allPartsReady = SHIP_PART_IDS.every((partId) => partsSet.has(partId));
  const shipBuilt = flags.includes("ship_built") || flags.includes("black_noise_bay_ship_ready");
  const activeSpotConfig = NECRO_SPOTS.find((spot) => spot.id === activeSpot) ?? NECRO_SPOTS[0];

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

  const refreshProgress = () => setProgress(readShipProgress());

  const collectPart = (partId: ShipPartId) => {
    if (partsSet.has(partId)) return;
    setProgress(addShipPart(partId));
  };

  const markFlag = (flag: BlackNoiseBayEventFlag) => {
    if (flags.includes(flag)) return;
    setProgress(addBlackNoiseBayEventFlag(flag));
  };

  const buildShip = () => {
    if (!allPartsReady) return;
    addBlackNoiseBayEventFlag("ship_built");
    setProgress(addBlackNoiseBayEventFlag("black_noise_bay_ship_ready"));
  };

  const handleSpotClick = (spot: NecroSpot) => {
    if (spot.id === "entrance") {
      onReturnBlackNoiseBay();
      return;
    }

    setActiveSpot(spot.id);

    if (spot.id === "market") {
      markFlag("necro_market_record_found");
      return;
    }

    if (spot.id === "clocktower") {
      if (!partsSet.has("helm")) {
        addShipPart("helm");
      }
      if (!flags.includes("necro_clock_mechanism_found")) {
        addBlackNoiseBayEventFlag("necro_clock_mechanism_found");
      }
      refreshProgress();
      return;
    }

    if (spot.id === "tavern") {
      if (flags.includes("necro_market_record_found")) {
        addBlackNoiseBayEventFlag("necro_tavern_route_found");
        if (!partsSet.has("sailcloth")) addShipPart("sailcloth");
        refreshProgress();
      }
      return;
    }

    if (spot.id === "watchtower") {
      if (flags.includes("necro_clock_mechanism_found")) {
        collectPart("compass");
      }
      return;
    }

    if (spot.partId) {
      collectPart(spot.partId);
    }
  };

  const getSpotBadge = (spot: NecroSpot) => {
    if (spot.kind === "exit") return "BACK";
    if (spot.kind === "guide") return "HINT";
    if (spot.kind === "build") return shipBuilt ? "DONE" : allPartsReady ? "BUILD" : "CHECK";
    if (spot.id === "market") return flags.includes("necro_market_record_found") ? "CLUE" : "SEARCH";
    if (spot.id === "chapel" || spot.id === "residential") return "LOG";
    if (spot.partId && partsSet.has(spot.partId)) return "GET";
    return spot.partId ? "SEARCH" : "CHECK";
  };

  const getExpression = (): KruitzExpression => {
    if (shipBuilt) return "satisfied";
    if (allPartsReady) return "happy";
    if (activeSpot === "dockyard" && !allPartsReady) return "trouble";
    if (activeSpot === "plaza") return partsSet.size >= 4 ? "idea" : "think";
    if (activeSpot === "market" || activeSpot === "clocktower") return "idea";
    if (activeSpot === "tavern" && !flags.includes("necro_market_record_found")) return "trouble";
    if (activeSpot === "watchtower" && !flags.includes("necro_clock_mechanism_found")) return "think";
    if (activeSpotConfig.partId && partsSet.has(activeSpotConfig.partId)) return "happy";
    return "normal";
  };

  const getSpotMessage = () => {
    if (activeSpot === "plaza") {
      return {
        title: "クロイツ",
        lines: ["この街、まだ少しだけ覚えてるにゃ。", getKruitzHint(partsSet, flags)],
      };
    }

    if (activeSpot === "market") {
      return flags.includes("necro_market_record_found")
        ? {
            title: "廃市場",
            lines: [
              "裂けた帳簿に、帆布の運搬記録が残っていた。",
              "クロイツ：保管先は旧酒場にゃ。布の本体はそっちにありそうにゃ。",
            ],
          }
        : { title: "廃市場", lines: ["倒れた露店を調べている。帆布の手がかりがありそうだ。"] };
    }

    if (activeSpot === "tavern") {
      if (!flags.includes("necro_market_record_found")) {
        return {
          title: "旧酒場",
          lines: ["棚は崩れていて、どの箱を探せばいいか分からない。", "クロイツ：先に廃市場の記録を見るにゃ。"],
        };
      }
      return {
        title: "旧酒場",
        lines: [`${SHIP_PART_LABELS.sailcloth}を入手した。`, "古い樽の奥に、潮を避けた帆布が残っていた。"],
      };
    }

    if (activeSpot === "clocktower") {
      return {
        title: "崩れた時計塔",
        lines: [
          `${SHIP_PART_LABELS.helm}を入手した。`,
          "壊れた時計機構から、羅針盤の台座に使えそうな歯車の記録も見つかった。",
        ],
      };
    }

    if (activeSpot === "watchtower") {
      if (!flags.includes("necro_clock_mechanism_found")) {
        return {
          title: "見張り塔跡",
          lines: ["方位盤はあるが、針が動かない。", "クロイツ：時計塔の機構を先に見るにゃ。"],
        };
      }
      return {
        title: "見張り塔跡",
        lines: [`${SHIP_PART_LABELS.compass}を入手した。`, "時計塔の部品で、古い羅針盤が息を吹き返した。"],
      };
    }

    if (activeSpot === "chapel") {
      return {
        title: "崩れた礼拝堂",
        lines: [
          "壁に刻まれた航海祈願の文字が、霧の湾へ向かった船の記録を残している。",
          "クロイツ：霧の中では、灯りを絶やしちゃだめにゃ。",
        ],
      };
    }

    if (activeSpot === "residential") {
      return {
        title: "住民街跡",
        lines: [
          "住民の手記には、黒い潮が来た夜のことが書かれている。",
          "クロイツ：この街は沈んでないにゃ。まだ、覚えてるにゃ。",
        ],
      };
    }

    if (activeSpot === "dockyard") {
      if (shipBuilt) {
        return {
          title: "造船所",
          lines: ["船が組み上がった。", "これでブラックノイズ湾の中心へ向かえる。"],
        };
      }
      if (allPartsReady) {
        return {
          title: "造船所",
          lines: ["必要な部材が揃いました。", "造船を開始できます。"],
        };
      }
      const missing = getNextMissingPart(partsSet);
      return {
        title: "造船所",
        lines: [
          `船の部材：${progress.parts.length} / ${SHIP_PART_IDS.length}`,
          "まだ部材が足りません。クロイツのヒントを頼りに、街を探しましょう。",
          missing ? `次に必要そうな部材：${SHIP_PART_LABELS[missing]}` : "",
        ].filter(Boolean),
      };
    }

    if (activeSpotConfig.partId) {
      return {
        title: activeSpotConfig.label,
        lines: [
          `${SHIP_PART_LABELS[activeSpotConfig.partId]}を入手した。`,
          `船の部材：${progress.parts.length} / ${SHIP_PART_IDS.length}`,
        ],
      };
    }

    return { title: activeSpotConfig.label, lines: [activeSpotConfig.subLabel] };
  };

  const message = getSpotMessage();
  const expression = getExpression();

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

        <div style={progressStripStyle}>
          <span>船の部材：{progress.parts.length} / {SHIP_PART_IDS.length}</span>
          <span>{shipBuilt ? "船 完成" : allPartsReady ? "造船可能" : "探索中"}</span>
        </div>

        <div style={mapStyle}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={routeSvgStyle} aria-hidden="true">
            <polyline points="50,91 50,73 25,70 14,54 24,39 50,52 72,27 70,47 86,43 78,68 52,16" style={routeLineStyle} />
          </svg>
          <div style={fogLayerStyle} />
          {NECRO_SPOTS.map((spot) => {
            const badge = getSpotBadge(spot);
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => handleSpotClick(spot)}
                style={{
                  ...spotButtonStyle,
                  ...(activeSpot === spot.id ? spotActiveStyle : null),
                  ...(badge === "GET" || badge === "DONE" ? spotCollectedStyle : null),
                  ...(spot.id === "plaza" ? plazaSpotStyle : null),
                  ...(spot.id === "dockyard" ? dockyardSpotStyle : null),
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                }}
              >
                <span style={spotBadgeStyle}>{badge}</span>
                <span>{spot.label}</span>
                <small style={spotSubLabelStyle}>{spot.subLabel}</small>
              </button>
            );
          })}
        </div>

        <section style={infoPanelStyle}>
          <div style={kruitzFrameStyle}>
            <img src={KRUitz_IMAGES[expression]} alt="クロイツ" style={kruitzImageStyle} />
          </div>
          <div style={messageStyle}>
            <div style={infoTitleStyle}>{message.title}</div>
            {message.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            {activeSpot === "dockyard" && allPartsReady && !shipBuilt ? (
              <button type="button" onClick={buildShip} style={buildButtonStyle}>
                船を作る
              </button>
            ) : null}
          </div>
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
    "linear-gradient(180deg, rgba(8, 12, 18, 0.28), rgba(4, 7, 11, 0.88)), radial-gradient(circle at 28% 18%, rgba(122, 198, 255, 0.14), transparent 28%), url('/backgrounds/necro-city-map.png') center top / cover no-repeat, linear-gradient(180deg, #151a23 0%, #12171c 48%, #080b10 100%)",
};

const shellStyle: CSSProperties = { width: "min(860px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 12 };
const eyebrowStyle: CSSProperties = { color: "#a9d7ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", color: "#f0f6ff", fontSize: 28, textShadow: "0 2px 14px rgba(0,0,0,0.58)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(237,247,255,0.72)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#edf7ff", fontWeight: 950, cursor: "pointer" };
const progressStripStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(210,232,255,0.18)", background: "rgba(7, 10, 15, 0.74)", color: "#dff2ff", fontSize: 13, fontWeight: 950 };
const mapStyle: CSSProperties = { position: "relative", height: "min(70vh, 620px)", minHeight: 500, overflow: "hidden", borderRadius: 16, border: "1px solid rgba(210,232,255,0.24)", background: "linear-gradient(180deg, rgba(8, 12, 18, 0.22), rgba(4, 7, 11, 0.5)), url('/backgrounds/necro-city-map.png') center / cover no-repeat, linear-gradient(145deg, #28313a 0%, #161a20 52%, #0d1016 100%)", boxShadow: "0 20px 56px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.42)" };
const routeSvgStyle: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.72 };
const routeLineStyle: CSSProperties = { fill: "none", stroke: "rgba(255,224,163,0.34)", strokeWidth: 0.75, strokeDasharray: "2 2", filter: "drop-shadow(0 0 3px rgba(255,224,163,0.35))" };
const fogLayerStyle: CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 0%, rgba(190,210,230,0.1) 36%, transparent 62%), radial-gradient(circle at 22% 74%, rgba(99,122,142,0.26), transparent 24%), linear-gradient(180deg, rgba(4,7,11,0.08), rgba(4,7,11,0.34))", pointerEvents: "none" };
const spotButtonStyle: CSSProperties = { position: "absolute", transform: "translate(-50%, -50%)", width: "min(30%, 172px)", minHeight: 62, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.32)", background: "linear-gradient(180deg, rgba(35, 47, 58, 0.94), rgba(12, 16, 22, 0.9))", color: "#edf7ff", fontWeight: 950, cursor: "pointer", boxShadow: "0 12px 26px rgba(0,0,0,0.44)", display: "grid", gap: 2, textAlign: "left" };
const spotActiveStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.72)", boxShadow: "0 0 18px rgba(255,224,163,0.18), 0 12px 26px rgba(0,0,0,0.44)" };
const spotCollectedStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.65)" };
const plazaSpotStyle: CSSProperties = { borderColor: "rgba(185,160,255,0.64)", background: "linear-gradient(180deg, rgba(48, 38, 78, 0.95), rgba(16, 14, 28, 0.9))" };
const dockyardSpotStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.62)", background: "linear-gradient(180deg, rgba(72, 50, 24, 0.95), rgba(22, 16, 12, 0.9))" };
const spotBadgeStyle: CSSProperties = { justifySelf: "start", padding: "2px 6px", borderRadius: 999, background: "rgba(169,215,255,0.16)", color: "#cfeaff", fontSize: 10 };
const spotSubLabelStyle: CSSProperties = { color: "rgba(237,247,255,0.68)", fontSize: 10, lineHeight: 1.25 };
const infoPanelStyle: CSSProperties = { display: "grid", gridTemplateColumns: "112px 1fr", gap: 12, alignItems: "center", marginTop: 12, padding: 14, borderRadius: 14, border: "1px solid rgba(210,232,255,0.2)", background: "rgba(7, 10, 15, 0.82)", boxShadow: "0 18px 42px rgba(0,0,0,0.42)", backdropFilter: "blur(2px)" };
const kruitzFrameStyle: CSSProperties = { width: 104, height: 104, borderRadius: 14, display: "grid", placeItems: "center", background: "radial-gradient(circle, rgba(137,95,255,0.18), rgba(0,0,0,0.14))", border: "1px solid rgba(185,160,255,0.28)", overflow: "hidden" };
const kruitzImageStyle: CSSProperties = { width: "118%", height: "118%", objectFit: "contain" };
const infoTitleStyle: CSSProperties = { color: "#ffe0a3", fontSize: 14, fontWeight: 950, marginBottom: 2 };
const messageStyle: CSSProperties = { display: "grid", gap: 7, color: "rgba(237,247,255,0.9)", fontSize: 13, lineHeight: 1.6, fontWeight: 850 };
const buildButtonStyle: CSSProperties = { justifySelf: "start", minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(255,220,136,0.66)", background: "linear-gradient(180deg, #ffd979, #b87624)", color: "#22160a", fontWeight: 950, cursor: "pointer" };
