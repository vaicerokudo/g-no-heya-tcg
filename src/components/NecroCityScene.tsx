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
  onReturnContinent: () => void;
};

type DistrictId = "entrance" | "plaza" | "market" | "clock" | "waterfront" | "residential" | "shipyard";
type ActionId =
  | "consultKruitz"
  | "inspectMarket"
  | "inspectTavern"
  | "inspectClocktower"
  | "inspectWatchtower"
  | "inspectWarehouse"
  | "inspectOldPier"
  | "inspectLighthouse"
  | "inspectChapel"
  | "inspectResidential"
  | "inspectOldShipyard"
  | "buildShip";
type KruitzExpression = "normal" | "think" | "idea" | "trouble" | "happy" | "satisfied";

type District = {
  id: DistrictId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
};

type DistrictAction = {
  id: ActionId;
  label: string;
  subLabel: string;
  partId?: ShipPartId;
};

type DetailMessage = {
  title: string;
  lines: string[];
  tone?: "normal" | "hint" | "blocked" | "success" | "complete";
};

const KRUitz_IMAGES: Record<KruitzExpression, string> = {
  normal: "/ui/kruitz/normal.png",
  think: "/ui/kruitz/think.png",
  idea: "/ui/kruitz/idea.png",
  trouble: "/ui/kruitz/trouble.png",
  happy: "/ui/kruitz/happy.png",
  satisfied: "/ui/kruitz/satisfied.png",
};

const DISTRICTS: District[] = [
  { id: "entrance", label: "入口", subLabel: "大陸MAPへ戻る", x: 50, y: 88 },
  { id: "plaza", label: "中央広場", subLabel: "クロイツに相談", x: 50, y: 52 },
  { id: "market", label: "港湾市場区", subLabel: "帆布の手がかり", x: 23, y: 44 },
  { id: "clock", label: "時計塔周辺", subLabel: "舵輪と羅針盤", x: 72, y: 31 },
  { id: "waterfront", label: "水辺区画", subLabel: "倉庫と灯台", x: 73, y: 68 },
  { id: "residential", label: "市街跡", subLabel: "記録と手記", x: 33, y: 73 },
  { id: "shipyard", label: "造船区", subLabel: "補強材と造船", x: 52, y: 17 },
];

const DISTRICT_ACTIONS: Record<Exclude<DistrictId, "entrance">, DistrictAction[]> = {
  plaza: [{ id: "consultKruitz", label: "クロイツに相談する", subLabel: "次の探索先を聞く" }],
  market: [
    { id: "inspectMarket", label: "廃市場を調べる", subLabel: "運搬記録を探す" },
    { id: "inspectTavern", label: "旧酒場を調べる", subLabel: "帆布の保管先", partId: "sailcloth" },
  ],
  clock: [
    { id: "inspectClocktower", label: "崩れた時計塔を調べる", subLabel: "舵輪と機構を探す", partId: "helm" },
    { id: "inspectWatchtower", label: "見張り塔跡を調べる", subLabel: "羅針盤を起動する", partId: "compass" },
  ],
  waterfront: [
    { id: "inspectWarehouse", label: "水没倉庫を調べる", subLabel: "防水材を探す", partId: "waterproof_material" },
    { id: "inspectOldPier", label: "朽ちた船着き場を調べる", subLabel: "錨鎖を探す", partId: "anchor_chain" },
    { id: "inspectLighthouse", label: "灯台跡を調べる", subLabel: "航海灯を探す", partId: "lantern" },
  ],
  residential: [
    { id: "inspectChapel", label: "崩れた礼拝堂を調べる", subLabel: "航海記録を読む" },
    { id: "inspectResidential", label: "住民街跡を調べる", subLabel: "残された手記を読む" },
  ],
  shipyard: [
    { id: "inspectOldShipyard", label: "旧造船区を調べる", subLabel: "船底補強材を探す", partId: "hull_reinforcement" },
    { id: "buildShip", label: "造船所へ入る", subLabel: "部材確認と造船" },
  ],
};

function hasFlag(flags: BlackNoiseBayEventFlag[], flag: BlackNoiseBayEventFlag) {
  return flags.includes(flag);
}

function getNextMissingPart(partsSet: Set<ShipPartId>) {
  return SHIP_PART_IDS.find((partId) => !partsSet.has(partId)) ?? null;
}

function getKruitzHint(partsSet: Set<ShipPartId>, flags: BlackNoiseBayEventFlag[]) {
  if (!partsSet.has("wood")) {
    return "木材は、でっかい斧の子が持ってくるって言ってたにゃ。湾での調査を進めるにゃ。";
  }
  if (!hasFlag(flags, "necro_market_record_found")) {
    return "まず港湾市場区に行くにゃ。廃市場に、帆布の行き先を書いた記録が残ってるかもしれないにゃ。";
  }
  if (!partsSet.has("sailcloth")) {
    return "帆布の本体は旧酒場にゃ。市場で見つけた記録が、そこを指してるにゃ。";
  }
  if (!partsSet.has("helm")) {
    return "高いところに、回るものが残ってた気がするにゃ。時計塔周辺を探すにゃ。";
  }
  if (!hasFlag(flags, "necro_clock_mechanism_found") || !partsSet.has("compass")) {
    return "時計塔の機構が分かれば、見張り塔跡の羅針盤も使えるかもしれないにゃ。";
  }
  if (!partsSet.has("waterproof_material")) {
    return "沈まないためのものは、水の近くを探すにゃ。水辺区画に向かうにゃ。";
  }
  if (!partsSet.has("anchor_chain")) {
    return "船を留める鎖は、朽ちた船着き場に残ってるかもしれないにゃ。";
  }
  if (!partsSet.has("lantern")) {
    return "霧の湾を進むなら光がいるにゃ。灯台跡を見てくるにゃ。";
  }
  if (!partsSet.has("hull_reinforcement")) {
    return "最後は造船区にゃ。船の底を守るものを探すにゃ。";
  }
  return "部材は揃ったにゃ。造船区の造船所へ行くにゃ。";
}

export function NecroCityScene({ onReturnContinent }: NecroCitySceneProps) {
  const [progress, setProgress] = useState(() => readShipProgress());
  const [activeDistrict, setActiveDistrict] = useState<DistrictId>("plaza");
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isKruitzModalOpen, setIsKruitzModalOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => (typeof window === "undefined" ? false : window.innerWidth < 820));
  const [message, setMessage] = useState<DetailMessage>({
    title: "中央広場",
    lines: ["廃都の中心に残された広場。", "クロイツがこの街の記憶をたどり、船の部材の手がかりを教えてくれる。"],
  });

  const partsSet = useMemo(() => new Set(progress.parts), [progress.parts]);
  const flags = progress.flags;
  const allPartsReady = SHIP_PART_IDS.every((partId) => partsSet.has(partId));
  const shipBuilt = flags.includes("ship_built") || flags.includes("black_noise_bay_ship_ready");
  const activeDistrictConfig = DISTRICTS.find((district) => district.id === activeDistrict) ?? DISTRICTS[1];

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

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 820);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isAreaModalOpen && !isKruitzModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isKruitzModalOpen) {
        setIsKruitzModalOpen(false);
        return;
      }
      setIsAreaModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAreaModalOpen, isKruitzModalOpen]);

  const refreshProgress = () => setProgress(readShipProgress());

  const collectPart = (partId: ShipPartId) => {
    if (partsSet.has(partId)) return false;
    setProgress(addShipPart(partId));
    return true;
  };

  const markFlag = (flag: BlackNoiseBayEventFlag) => {
    if (flags.includes(flag)) return false;
    setProgress(addBlackNoiseBayEventFlag(flag));
    return true;
  };

  const selectDistrict = (district: District) => {
    if (district.id === "entrance") {
      onReturnContinent();
      return;
    }

    setActiveDistrict(district.id);
    setIsAreaModalOpen(true);
    setIsKruitzModalOpen(false);
    if (district.id === "plaza") {
      setMessage({
        title: "中央広場",
        lines: ["廃都の中心に残された広場。", "クロイツに相談すると、次に探すべき地区を思い出してくれる。"],
      });
      return;
    }

    setMessage({
      title: district.label,
      lines: [`${district.label}の中に入って探索します。`, district.subLabel],
    });
  };

  const buildShip = () => {
    if (!allPartsReady) {
      const missing = getNextMissingPart(partsSet);
      setMessage({
        title: "造船所",
        lines: [
          `船の部材：${progress.parts.length} / ${SHIP_PART_IDS.length}`,
          "まだ部材が足りません。クロイツのヒントを頼りに、街を探しましょう。",
          missing ? `次に必要そうな部材：${SHIP_PART_LABELS[missing]}` : "",
        ].filter(Boolean),
        tone: "blocked",
      });
      return;
    }

    addBlackNoiseBayEventFlag("ship_built");
    setProgress(addBlackNoiseBayEventFlag("black_noise_bay_ship_ready"));
    setMessage({
      title: "造船所",
      lines: ["船が組み上がった。", "これでブラックノイズ湾の中心へ向かえる。"],
      tone: "complete",
    });
  };

  const runAction = (action: DistrictAction) => {
    if (action.id === "consultKruitz") {
      setIsKruitzModalOpen(true);
      return;
    }

    if (action.id === "inspectMarket") {
      markFlag("necro_market_record_found");
      setMessage({
        title: "廃市場",
        lines: [
          "裂けた帳簿に、帆布の運搬記録が残っていた。",
          "保管先は旧酒場。港湾市場区の奥に、まだ入れそうな建物がある。",
        ],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectTavern") {
      if (!flags.includes("necro_market_record_found")) {
        setMessage({
          title: "旧酒場",
          lines: ["棚は崩れていて、どの箱を探せばいいか分からない。", "先に廃市場の運搬記録を探しましょう。"],
          tone: "blocked",
        });
        return;
      }
      if (!partsSet.has("sailcloth")) addShipPart("sailcloth");
      addBlackNoiseBayEventFlag("necro_tavern_route_found");
      refreshProgress();
      setMessage({
        title: "旧酒場",
        lines: [`${SHIP_PART_LABELS.sailcloth}を入手した。`, "古い樽の奥に、潮を避けた帆布が残っていた。"],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectClocktower") {
      if (!partsSet.has("helm")) addShipPart("helm");
      addBlackNoiseBayEventFlag("necro_clock_mechanism_found");
      refreshProgress();
      setMessage({
        title: "崩れた時計塔",
        lines: [
          `${SHIP_PART_LABELS.helm}を入手した。`,
          "壊れた時計機構から、羅針盤の台座に使えそうな歯車の記録も見つかった。",
        ],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectWatchtower") {
      if (!flags.includes("necro_clock_mechanism_found")) {
        setMessage({
          title: "見張り塔跡",
          lines: ["方位盤はあるが、針が動かない。", "先に崩れた時計塔の機構を調べましょう。"],
          tone: "blocked",
        });
        return;
      }
      collectPart("compass");
      setMessage({
        title: "見張り塔跡",
        lines: [`${SHIP_PART_LABELS.compass}を入手した。`, "時計塔の部品で、古い羅針盤が息を吹き返した。"],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectWarehouse") {
      collectPart("waterproof_material");
      setMessage({
        title: "水没倉庫",
        lines: [`${SHIP_PART_LABELS.waterproof_material}を入手した。`, "水に浸かった棚の上で、密封された樹脂材が残っていた。"],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectOldPier") {
      collectPart("anchor_chain");
      setMessage({
        title: "朽ちた船着き場",
        lines: [`${SHIP_PART_LABELS.anchor_chain}を入手した。`, "桟橋の下に、黒潮にも錆び切っていない鎖が沈んでいた。"],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectLighthouse") {
      collectPart("lantern");
      setMessage({
        title: "灯台跡",
        lines: [`${SHIP_PART_LABELS.lantern}を入手した。`, "割れた灯台の奥で、まだ淡く光る航海灯を見つけた。"],
        tone: "success",
      });
      return;
    }

    if (action.id === "inspectChapel") {
      setMessage({
        title: "崩れた礼拝堂",
        lines: [
          "壁に刻まれた航海祈願の文字が、霧の湾へ向かった船の記録を残している。",
          "霧の中では、灯りを絶やしてはいけないらしい。",
        ],
        tone: "hint",
      });
      return;
    }

    if (action.id === "inspectResidential") {
      setMessage({
        title: "住民街跡",
        lines: [
          "住民の手記には、黒い潮が来た夜のことが書かれている。",
          "この街は沈んでいない。まだ、少しだけ覚えている。",
        ],
        tone: "hint",
      });
      return;
    }

    if (action.id === "inspectOldShipyard") {
      collectPart("hull_reinforcement");
      setMessage({
        title: "旧造船区",
        lines: [`${SHIP_PART_LABELS.hull_reinforcement}を入手した。`, "古い船台の横に、船底を守る補強材が残されていた。"],
        tone: "success",
      });
      return;
    }

    if (action.id === "buildShip") {
      buildShip();
    }
  };

  const getKruitzExpression = (isConsulting = false): KruitzExpression => {
    if (shipBuilt) return "satisfied";
    if (allPartsReady) return "happy";
    if (message.tone === "blocked") return "trouble";
    if (message.tone === "success") return "idea";
    if (partsSet.size >= 4) return "idea";
    if (isConsulting || message.tone === "hint") return "think";
    return "normal";
  };

  const districtActions =
    activeDistrict === "entrance" ? [] : DISTRICT_ACTIONS[activeDistrict as Exclude<DistrictId, "entrance">];
  const kruitzExpression = getKruitzExpression(isKruitzModalOpen);
  const kruitzHint = getKruitzHint(partsSet, flags);

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>NECRO CITY</div>
            <h1 style={titleStyle}>廃都ネクロシティ</h1>
            <div style={subtitleStyle}>船の部材が眠る廃都</div>
          </div>
          <button type="button" onClick={onReturnContinent} style={returnButtonStyle}>
            大陸MAPへ戻る
          </button>
        </header>

        <div style={progressStripStyle}>
          <span>船の部材 {progress.parts.length} / {SHIP_PART_IDS.length}</span>
          <span>{shipBuilt ? "船 完成" : allPartsReady ? "造船可能" : "地区探索中"}</span>
        </div>

        <main style={layoutStyle}>
          <section style={{ ...mapStyle, ...(isNarrow ? mapNarrowStyle : null) }} aria-label="廃都ネクロシティ地区MAP">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={routeSvgStyle} aria-hidden="true">
              <polyline points="50,88 33,73 23,44 50,52 72,31 73,68 52,17" style={routeLineStyle} />
            </svg>
            <div style={fogLayerStyle} />
            {DISTRICTS.map((district) => (
              <button
                key={district.id}
                type="button"
                onClick={() => selectDistrict(district)}
                style={{
                  ...districtButtonStyle,
                  ...(isNarrow ? districtButtonNarrowStyle : null),
                  ...(activeDistrict === district.id ? districtActiveStyle : null),
                  ...(district.id === "plaza" ? plazaDistrictStyle : null),
                  ...(district.id === "shipyard" ? shipyardDistrictStyle : null),
                  left: `${district.x}%`,
                  top: `${district.y}%`,
                }}
              >
                <span style={districtBadgeStyle}>
                  {district.id === "entrance" ? "BACK" : district.id === "plaza" ? "GUIDE" : "AREA"}
                </span>
                <span>{district.label}</span>
              </button>
            ))}
          </section>
        </main>
      </div>

      {isAreaModalOpen ? (
        <div style={areaModalOverlayStyle} role="dialog" aria-modal="true" aria-label={`${activeDistrictConfig.label} 詳細`} onClick={() => setIsAreaModalOpen(false)}>
          <section
            style={{ ...detailPanelStyle, ...(isNarrow ? detailPanelNarrowStyle : null) }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={detailHeaderStyle}>
              <div>
                <div style={detailEyebrowStyle}>AREA DETAIL</div>
                <h2 style={detailTitleStyle}>{activeDistrictConfig.label}</h2>
                <div style={detailSubStyle}>{activeDistrictConfig.subLabel}</div>
              </div>
              <button type="button" onClick={() => setIsAreaModalOpen(false)} style={modalCloseButtonStyle}>
                閉じる
              </button>
            </div>

            {districtActions.length ? (
              <div style={actionListStyle}>
                {districtActions.map((action) => {
                  const partCollected = action.partId ? partsSet.has(action.partId) : false;
                  const locked =
                    (action.id === "inspectTavern" && !flags.includes("necro_market_record_found")) ||
                    (action.id === "inspectWatchtower" && !flags.includes("necro_clock_mechanism_found"));
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => runAction(action)}
                      style={{
                        ...actionButtonStyle,
                        ...(partCollected ? actionDoneStyle : null),
                        ...(locked ? actionLockedStyle : null),
                      }}
                    >
                      <span style={actionBadgeStyle}>{partCollected ? "GET" : locked ? "LOCK" : "調べる"}</span>
                      <span style={actionTitleStyle}>{action.label}</span>
                      <span style={actionSubStyle}>{action.subLabel}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div style={messageBoxStyle}>
              <div style={messageTitleStyle}>{message.title}</div>
              {message.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
              {activeDistrict === "plaza" ? <span>船の部材：{progress.parts.length} / {SHIP_PART_IDS.length}</span> : null}
            </div>
          </section>
        </div>
      ) : null}

      {isKruitzModalOpen ? (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true" aria-label="クロイツ相談" onClick={() => setIsKruitzModalOpen(false)}>
          <div style={{ ...kruitzModalStyle, ...(isNarrow ? kruitzModalNarrowStyle : null) }} onClick={(event) => event.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={detailEyebrowStyle}>CENTRAL PLAZA GUIDE</div>
                <h2 style={detailTitleStyle}>クロイツに相談</h2>
              </div>
              <button type="button" onClick={() => setIsKruitzModalOpen(false)} style={modalCloseButtonStyle}>
                閉じる
              </button>
            </div>

            <div style={{ ...kruitzPanelStyle, ...(isNarrow ? kruitzPanelNarrowStyle : null) }}>
              <div style={{ ...kruitzFrameStyle, ...(isNarrow ? kruitzFrameNarrowStyle : null) }}>
                <img src={KRUitz_IMAGES[kruitzExpression]} alt="クロイツ" style={kruitzImageStyle} />
              </div>
              <div style={kruitzTextStyle}>
                <strong>クロイツ</strong>
                <span>この街、まだ少しだけ覚えてるにゃ。</span>
                <span>{kruitzHint}</span>
              </div>
            </div>

            <div style={messageBoxStyle}>
              <div style={messageTitleStyle}>探索状況</div>
              <span>船の部材：{progress.parts.length} / {SHIP_PART_IDS.length}</span>
              <span>{shipBuilt ? "船は完成しているにゃ。湾へ戻るにゃ。" : allPartsReady ? "部材は揃ったにゃ。造船区へ行くにゃ。" : "まだ街のどこかに部材が残っているにゃ。"}</span>
            </div>
          </div>
        </div>
      ) : null}
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

const shellStyle: CSSProperties = { width: "min(1040px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 12 };
const eyebrowStyle: CSSProperties = { color: "#a9d7ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", color: "#f0f6ff", fontSize: 28, textShadow: "0 2px 14px rgba(0,0,0,0.58)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(237,247,255,0.72)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#edf7ff", fontWeight: 950, cursor: "pointer" };
const progressStripStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(210,232,255,0.18)", background: "rgba(7, 10, 15, 0.74)", color: "#dff2ff", fontSize: 13, fontWeight: 950 };
const layoutStyle: CSSProperties = { display: "block" };
const mapStyle: CSSProperties = { position: "relative", minHeight: 640, overflow: "hidden", borderRadius: 16, border: "1px solid rgba(210,232,255,0.24)", background: "linear-gradient(180deg, rgba(8, 12, 18, 0.22), rgba(4, 7, 11, 0.5)), url('/backgrounds/necro-city-map.png') center / cover no-repeat, linear-gradient(145deg, #28313a 0%, #161a20 52%, #0d1016 100%)", boxShadow: "0 20px 56px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.42)" };
const mapNarrowStyle: CSSProperties = { minHeight: 500 };
const routeSvgStyle: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.78 };
const routeLineStyle: CSSProperties = { fill: "none", stroke: "rgba(255,224,163,0.34)", strokeWidth: 0.75, strokeDasharray: "2 2", filter: "drop-shadow(0 0 3px rgba(255,224,163,0.35))" };
const fogLayerStyle: CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 0%, rgba(190,210,230,0.1) 36%, transparent 62%), radial-gradient(circle at 22% 74%, rgba(99,122,142,0.26), transparent 24%), linear-gradient(180deg, rgba(4,7,11,0.08), rgba(4,7,11,0.34))", pointerEvents: "none" };
const districtButtonStyle: CSSProperties = { position: "absolute", transform: "translate(-50%, -50%)", width: 154, minHeight: 70, padding: "9px 10px", boxSizing: "border-box", borderRadius: 10, border: "1px solid rgba(210,232,255,0.32)", background: "linear-gradient(180deg, rgba(35, 47, 58, 0.94), rgba(12, 16, 22, 0.9))", color: "#edf7ff", fontWeight: 950, cursor: "pointer", boxShadow: "0 12px 26px rgba(0,0,0,0.44)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 4, textAlign: "left", lineHeight: 1.15, overflowWrap: "anywhere" };
const districtButtonNarrowStyle: CSSProperties = { width: "clamp(112px, 32vw, 142px)", minHeight: 64, padding: "8px 9px", fontSize: 12 };
const districtActiveStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.78)", boxShadow: "0 0 20px rgba(255,224,163,0.22), 0 12px 26px rgba(0,0,0,0.44)" };
const plazaDistrictStyle: CSSProperties = { borderColor: "rgba(185,160,255,0.64)", background: "linear-gradient(180deg, rgba(48, 38, 78, 0.95), rgba(16, 14, 28, 0.9))" };
const shipyardDistrictStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.62)", background: "linear-gradient(180deg, rgba(72, 50, 24, 0.95), rgba(22, 16, 12, 0.9))" };
const districtBadgeStyle: CSSProperties = { justifySelf: "start", padding: "2px 6px", borderRadius: 999, background: "rgba(169,215,255,0.16)", color: "#cfeaff", fontSize: 10 };
const detailPanelStyle: CSSProperties = { width: "min(560px, 100%)", minHeight: 430, maxHeight: "min(82dvh, 580px)", padding: 14, boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(210,232,255,0.2)", background: "rgba(7, 10, 15, 0.9)", boxShadow: "0 18px 42px rgba(0,0,0,0.42)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", gap: 12, overflowX: "hidden", overflowY: "auto" };
const detailPanelNarrowStyle: CSSProperties = { minHeight: 340, maxHeight: "84dvh" };
const detailHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10 };
const detailEyebrowStyle: CSSProperties = { color: "#a9d7ff", fontSize: 10, fontWeight: 950 };
const detailTitleStyle: CSSProperties = { margin: "3px 0 0", color: "#ffe0a3", fontSize: 20 };
const detailSubStyle: CSSProperties = { marginTop: 4, color: "rgba(237,247,255,0.7)", fontSize: 12, fontWeight: 850 };
const kruitzPanelStyle: CSSProperties = { display: "grid", gridTemplateColumns: "88px 1fr", gap: 12, alignItems: "center", minHeight: 126, padding: 12, boxSizing: "border-box", borderRadius: 12, border: "1px solid rgba(185,160,255,0.26)", background: "rgba(30, 20, 52, 0.56)" };
const kruitzPanelNarrowStyle: CSSProperties = { gridTemplateColumns: "1fr", justifyItems: "center" };
const kruitzFrameStyle: CSSProperties = { width: 82, height: 82, borderRadius: 14, display: "grid", placeItems: "center", background: "radial-gradient(circle, rgba(137,95,255,0.18), rgba(0,0,0,0.14))", border: "1px solid rgba(185,160,255,0.28)", overflow: "hidden" };
const kruitzFrameNarrowStyle: CSSProperties = { width: 72, height: 72 };
const kruitzImageStyle: CSSProperties = { width: "118%", height: "118%", objectFit: "contain" };
const kruitzTextStyle: CSSProperties = { display: "grid", gap: 5, color: "rgba(237,247,255,0.9)", fontSize: 13, lineHeight: 1.55, fontWeight: 850 };
const actionListStyle: CSSProperties = { display: "grid", gap: 8, gridAutoRows: "minmax(76px, auto)" };
const actionButtonStyle: CSSProperties = { width: "100%", minHeight: 76, padding: 11, boxSizing: "border-box", borderRadius: 10, border: "1px solid rgba(210,232,255,0.22)", background: "linear-gradient(180deg, rgba(31, 44, 54, 0.92), rgba(10, 14, 20, 0.88))", color: "#edf7ff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 4, textAlign: "left", cursor: "pointer", lineHeight: 1.25 };
const actionDoneStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.64)" };
const actionLockedStyle: CSSProperties = { opacity: 0.74 };
const actionBadgeStyle: CSSProperties = { justifySelf: "start", padding: "2px 7px", borderRadius: 999, background: "rgba(255,224,163,0.15)", color: "#ffe0a3", fontSize: 10, fontWeight: 950 };
const actionTitleStyle: CSSProperties = { fontWeight: 950, fontSize: 13 };
const actionSubStyle: CSSProperties = { color: "rgba(237,247,255,0.67)", fontSize: 12 };
const messageBoxStyle: CSSProperties = { display: "grid", gap: 7, minHeight: 128, padding: 12, boxSizing: "border-box", borderRadius: 12, border: "1px solid rgba(210,232,255,0.16)", background: "rgba(0,0,0,0.22)", color: "rgba(237,247,255,0.9)", fontSize: 13, lineHeight: 1.6, fontWeight: 850, alignContent: "start" };
const messageTitleStyle: CSSProperties = { color: "#ffe0a3", fontWeight: 950, fontSize: 14 };
const areaModalOverlayStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 40, display: "grid", placeItems: "center", padding: 12, boxSizing: "border-box", background: "rgba(3, 5, 9, 0.58)", backdropFilter: "blur(2px)" };
const modalOverlayStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 12, boxSizing: "border-box", background: "rgba(3, 5, 9, 0.72)", backdropFilter: "blur(3px)" };
const kruitzModalStyle: CSSProperties = { width: "min(560px, 100%)", maxHeight: "min(82dvh, 560px)", overflowX: "hidden", overflowY: "auto", padding: 14, boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(210,232,255,0.26)", background: "linear-gradient(180deg, rgba(13, 16, 24, 0.96), rgba(6, 8, 13, 0.96))", boxShadow: "0 24px 72px rgba(0,0,0,0.62)", display: "grid", gap: 12 };
const kruitzModalNarrowStyle: CSSProperties = { maxHeight: "86dvh", padding: 12 };
const modalHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 };
const modalCloseButtonStyle: CSSProperties = { minHeight: 36, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#edf7ff", fontWeight: 950, cursor: "pointer" };
