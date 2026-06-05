import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  hasBlackNoiseBayEventFlag,
  readShipProgress,
  SHIP_PART_IDS,
} from "../game/blackNoiseBay/progress";
import type { ScenarioId } from "../game/scenario/scenarios";

type BlackNoiseBaySceneProps = {
  clearedScenarioIds: ScenarioId[];
  onReturnContinent: () => void;
  onStartScenario: (scenarioId: ScenarioId) => void;
};

type MissionDefinition = {
  id: ScenarioId;
  title: string;
  subLabel: string;
  requires?: ScenarioId;
};

type BackMissionDefinition = {
  id: "departure" | "hook" | "final";
  scenarioId: ScenarioId;
  title: string;
  subLabel: string;
};

type BayHotspotId = "shore" | "necro" | "shipStatus" | "dock" | "center";

type BayHotspot = {
  id: BayHotspotId;
  title: string;
  shortTitle: string;
  x: number;
  y: number;
  badge: string;
  visible: boolean;
};

const FRONT_MISSIONS: MissionDefinition[] = [
  { id: "scenario16", title: "第16話 黒い潮", subLabel: "湾岸の異変確認" },
  { id: "scenario17", title: "第17話 漂着する影", subLabel: "侵された魔物の調査", requires: "scenario16" },
  { id: "scenario18", title: "第18話 湾の中心へ", subLabel: "巨大な影の確認", requires: "scenario17" },
];

const BACK_MISSIONS: BackMissionDefinition[] = [
  { id: "departure", scenarioId: "scenario19", title: "第19話 船出", subLabel: "完成した船で出航" },
  { id: "hook", scenarioId: "scenario20", title: "第20話 リヴァイアサンを釣れ", subLabel: "湾中央の釣り場へ" },
  { id: "final", scenarioId: "scenario21", title: "第21話 黒潮の主", subLabel: "黒潮の主との決戦" },
];

export function BlackNoiseBayScene({
  clearedScenarioIds,
  onReturnContinent,
  onStartScenario,
}: BlackNoiseBaySceneProps) {
  const [shipProgress, setShipProgress] = useState(() => readShipProgress());
  const [activeHotspotId, setActiveHotspotId] = useState<BayHotspotId | null>(null);
  const clearedSet = useMemo(() => new Set(clearedScenarioIds), [clearedScenarioIds]);
  const frontCleared =
    clearedSet.has("scenario18") || hasBlackNoiseBayEventFlag("black_noise_bay_front_cleared");
  const shipRequiredDiscovered =
    frontCleared || shipProgress.flags.includes("ship_required_discovered");
  const shipReady =
    shipProgress.flags.includes("ship_built") || shipProgress.flags.includes("black_noise_bay_ship_ready");
  const departed = shipProgress.flags.includes("black_noise_bay_departed");
  const leviathanHooked = shipProgress.flags.includes("black_noise_bay_leviathan_hooked");
  const chapterCleared = shipProgress.flags.includes("black_noise_bay_chapter_cleared");
  const collectedPartCount = shipProgress.parts.length;

  useEffect(() => {
    const refresh = () => setShipProgress(readShipProgress());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const statusText = chapterCleared
    ? "ブラックノイズ湾 調査完了。黒潮は静かに薄れている。"
    : leviathanHooked
      ? "リヴァイアサンを釣り上げた。黒潮の主との決戦が始まる。"
      : shipReady
        ? "船は完成した。湾中央への航路が開かれた。"
        : frontCleared
          ? "湾の中心へ向かうには船が必要だ。廃都ネクロシティで部材を探そう。"
          : "湾岸に黒い潮が流れ着いている。まずは海辺の魔物を調査する。";

  const hotspots: BayHotspot[] = [
    {
      id: "shore",
      title: "湾岸調査",
      shortTitle: "湾岸",
      x: 30,
      y: 58,
      badge: frontCleared ? "CLEAR" : "NEXT",
      visible: true,
    },
    {
      id: "necro",
      title: "ネクロシティ方面",
      shortTitle: "廃都方面",
      x: 20,
      y: 38,
      badge: shipReady ? "DONE" : "GO",
      visible: shipRequiredDiscovered,
    },
    {
      id: "shipStatus",
      title: "造船状況",
      shortTitle: "造船",
      x: 50,
      y: 72,
      badge: shipReady ? "READY" : "PARTS",
      visible: shipRequiredDiscovered,
    },
    {
      id: "dock",
      title: "船着き場",
      shortTitle: "船着き場",
      x: 62,
      y: 64,
      badge: leviathanHooked || chapterCleared ? "CLEAR" : "NEXT",
      visible: shipReady || departed || chapterCleared,
    },
    {
      id: "center",
      title: "湾中央",
      shortTitle: "湾中央",
      x: 72,
      y: 38,
      badge: chapterCleared ? "CLEAR" : "FINAL",
      visible: leviathanHooked || chapterCleared,
    },
  ];

  function getFrontMissionState(mission: MissionDefinition) {
    if (clearedSet.has(mission.id)) return "clear";
    if (mission.requires && !clearedSet.has(mission.requires)) return "locked";
    return "next";
  }

  function getBackMissionState(mission: BackMissionDefinition) {
    const cleared =
      (mission.id === "departure" && departed) ||
      (mission.id === "hook" && leviathanHooked) ||
      (mission.id === "final" && chapterCleared);
    const unlocked =
      (mission.id === "departure" && (shipReady || departed || chapterCleared)) ||
      (mission.id === "hook" && (departed || leviathanHooked || chapterCleared)) ||
      (mission.id === "final" && (leviathanHooked || chapterCleared));

    if (cleared) return "clear";
    if (!unlocked) return "locked";
    return "next";
  }

  function renderMissionButton(mission: MissionDefinition | BackMissionDefinition, state: "clear" | "locked" | "next") {
    const scenarioId = "scenarioId" in mission ? mission.scenarioId : mission.id;
    const badge = state === "clear" ? "CLEAR" : state === "locked" ? "LOCK" : "NEXT";

    return (
      <button
        key={scenarioId}
        type="button"
        disabled={state === "locked"}
        onClick={() => {
          if (state !== "locked") onStartScenario(scenarioId);
        }}
        style={{
          ...missionButtonStyle,
          ...(state === "locked" ? disabledMissionStyle : null),
          ...(state === "clear" ? clearedMissionStyle : null),
        }}
      >
        <span style={missionBadgeStyle(state)}>{badge}</span>
        <span style={missionTitleStyle}>{mission.title}</span>
        <span style={missionSubStyle}>{mission.subLabel}</span>
      </button>
    );
  }

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>BLACK NOISE BAY</div>
            <h1 style={titleStyle}>ブラックノイズ湾</h1>
            <div style={subtitleStyle}>黒い潮の調査地点</div>
          </div>
          <button type="button" onClick={onReturnContinent} style={secondaryButtonStyle}>
            大陸MAPへ戻る
          </button>
        </header>

        <div style={statusStripStyle}>
          <span>{statusText}</span>
          <span style={statusMetaStyle}>
            船の部材 {collectedPartCount} / {SHIP_PART_IDS.length}
            {shipReady ? " / 造船完了" : ""}
          </span>
        </div>

        <main style={mapFrameStyle}>
          <div aria-hidden="true" style={bayAtmosphereStyle} />
          <svg viewBox="0 0 100 100" aria-hidden="true" style={routeLayerStyle}>
            {shipRequiredDiscovered ? (
              <polyline
                points="30,58 50,72 62,64 72,38"
                fill="none"
                stroke="rgba(147, 220, 255, 0.26)"
                strokeWidth="1.7"
                strokeDasharray="3 3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {frontCleared ? (
              <polyline
                points="30,58 20,38 50,72"
                fill="none"
                stroke="rgba(255, 224, 163, 0.18)"
                strokeWidth="1.4"
                strokeDasharray="2.2 3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </svg>

          {hotspots
            .filter((hotspot) => hotspot.visible)
            .map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                onClick={() => setActiveHotspotId(hotspot.id)}
                style={{
                  ...hotspotStyle,
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                }}
                title={hotspot.title}
              >
                <span style={hotspotPinStyle(hotspot.id)} />
                <span style={hotspotTitleStyle}>{hotspot.shortTitle}</span>
                <span style={hotspotBadgeStyle(hotspot.badge)}>{hotspot.badge}</span>
              </button>
            ))}

          <div style={mapCaptionStyle}>
            背景の調査地点を選ぶと、ミッションや造船状況を確認できます。
          </div>
        </main>
      </div>

      {activeHotspotId ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bay-modal-title"
          style={modalOverlayStyle}
          onClick={() => setActiveHotspotId(null)}
        >
          <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
            {activeHotspotId === "shore" ? (
              <>
                <div style={modalEyebrowStyle}>SHORE INVESTIGATION</div>
                <h2 id="bay-modal-title" style={modalTitleStyle}>
                  湾岸調査
                </h2>
                <p style={modalLeadStyle}>湾岸に流れ着いた黒い潮と、活性化した海辺の魔物を調査します。</p>
                <div style={modalMissionGridStyle}>
                  {FRONT_MISSIONS.map((mission) => renderMissionButton(mission, getFrontMissionState(mission)))}
                </div>
              </>
            ) : null}

            {activeHotspotId === "necro" ? (
              <>
                <div style={modalEyebrowStyle}>ROUTE TO RUINS</div>
                <h2 id="bay-modal-title" style={modalTitleStyle}>
                  ネクロシティ方面
                </h2>
                <p style={modalLeadStyle}>
                  湾中央へ向かうには船が必要です。廃都ネクロシティには、船の部材と古い造船の記録が残っています。
                </p>
                <div style={infoBoxStyle}>
                  {shipReady
                    ? "船の準備は整っています。湾中央へ向かうなら、船着き場から後編ミッションを確認してください。"
                    : "大陸MAPに戻り、廃都ネクロシティで船の部材を探しましょう。"}
                </div>
                <button type="button" style={modalActionButtonStyle} onClick={onReturnContinent}>
                  大陸MAPへ戻る
                </button>
              </>
            ) : null}

            {activeHotspotId === "shipStatus" ? (
              <>
                <div style={modalEyebrowStyle}>SHIP STATUS</div>
                <h2 id="bay-modal-title" style={modalTitleStyle}>
                  造船状況
                </h2>
                <div style={shipPanelStyle}>
                  <span>船の部材</span>
                  <strong>
                    {collectedPartCount} / {SHIP_PART_IDS.length}
                  </strong>
                </div>
                <p style={modalLeadStyle}>
                  {shipReady
                    ? "造船完了。湾中央への航路が開かれました。"
                    : frontCleared
                      ? "まだ部材が足りません。廃都ネクロシティで残りの部材を探しましょう。"
                      : "湾中央へ向かうための船は、まだ必要性が確認されていません。"}
                </p>
              </>
            ) : null}

            {activeHotspotId === "dock" ? (
              <>
                <div style={modalEyebrowStyle}>DEPARTURE DOCK</div>
                <h2 id="bay-modal-title" style={modalTitleStyle}>
                  船着き場
                </h2>
                <p style={modalLeadStyle}>完成した船で湾中央へ向かいます。航路上の異変を突破してください。</p>
                <div style={modalMissionGridStyle}>
                  {BACK_MISSIONS.filter((mission) => mission.id !== "final").map((mission) =>
                    renderMissionButton(mission, getBackMissionState(mission))
                  )}
                </div>
              </>
            ) : null}

            {activeHotspotId === "center" ? (
              <>
                <div style={modalEyebrowStyle}>BAY CENTER</div>
                <h2 id="bay-modal-title" style={modalTitleStyle}>
                  湾中央
                </h2>
                <p style={modalLeadStyle}>黒潮の主との決戦地点です。クリア後も記録再生として再戦できます。</p>
                <div style={modalMissionGridStyle}>
                  {BACK_MISSIONS.filter((mission) => mission.id === "final").map((mission) =>
                    renderMissionButton(mission, getBackMissionState(mission))
                  )}
                </div>
              </>
            ) : null}

            <button type="button" style={modalCloseButtonStyle} onClick={() => setActiveHotspotId(null)}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  padding: "12px 10px 18px",
  boxSizing: "border-box",
  color: "#f3f7ff",
  background:
    "radial-gradient(circle at 50% 20%, rgba(39, 111, 140, 0.2), transparent 32%), linear-gradient(180deg, #07111d 0%, #101925 48%, #060910 100%)",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = {
  width: "min(860px, 100%)",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const eyebrowStyle: CSSProperties = {
  color: "#8fd7ff",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#e8f8ff",
  fontSize: 28,
  textShadow: "0 2px 14px rgba(0,0,0,0.58)",
};

const subtitleStyle: CSSProperties = {
  marginTop: 4,
  color: "rgba(214, 238, 255, 0.78)",
  fontSize: 13,
  fontWeight: 850,
};

const baseButtonStyle: CSSProperties = {
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 10,
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid rgba(214,238,255,0.24)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8f8ff",
};

const statusStripStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(143,215,255,0.2)",
  background: "rgba(5, 12, 20, 0.7)",
  color: "rgba(244,250,255,0.88)",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 850,
  backdropFilter: "blur(2px)",
};

const statusMetaStyle: CSSProperties = {
  color: "#ffe0a3",
  fontWeight: 950,
};

const mapFrameStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, 820px)",
  minHeight: "min(68dvh, 680px)",
  aspectRatio: "16 / 10",
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 18,
  border: "1px solid rgba(143,215,255,0.24)",
  background:
    "linear-gradient(180deg, rgba(5, 14, 22, 0.08), rgba(3, 8, 13, 0.36)), url('/backgrounds/black-noise-bay-map.png') center / cover no-repeat, linear-gradient(180deg, #143040 0%, #0b1723 100%)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.52), inset 0 0 70px rgba(9, 22, 32, 0.42)",
};

const bayAtmosphereStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 72% 38%, rgba(2, 8, 14, 0.42), transparent 20%), radial-gradient(circle at 30% 58%, rgba(94, 178, 220, 0.12), transparent 20%), linear-gradient(90deg, rgba(0,0,0,0.18), transparent 28%, transparent 72%, rgba(0,0,0,0.22))",
};

const routeLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: 2,
  pointerEvents: "none",
};

const hotspotStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  zIndex: 4,
  minWidth: 118,
  minHeight: 48,
  display: "grid",
  gridTemplateColumns: "18px 1fr",
  gridTemplateRows: "auto auto",
  columnGap: 8,
  rowGap: 3,
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(172, 228, 255, 0.45)",
  background: "linear-gradient(180deg, rgba(13, 41, 58, 0.86), rgba(6, 12, 20, 0.78))",
  color: "#f3f7ff",
  boxShadow: "0 14px 26px rgba(0,0,0,0.34), 0 0 18px rgba(82, 185, 240, 0.16)",
  cursor: "pointer",
  textAlign: "left",
};

function hotspotPinStyle(id: BayHotspotId): CSSProperties {
  const color =
    id === "center"
      ? ["#f8fbff", "#7b54ff", "rgba(42,24,94,0.95)"]
      : id === "dock" || id === "shipStatus"
        ? ["#fff4c6", "#ffb84d", "rgba(92,48,12,0.95)"]
        : ["#c9f4ff", "#47b8f2", "rgba(10,50,75,0.95)"];

  return {
    width: 18,
    height: 18,
    borderRadius: "50%",
    gridRow: "1 / 3",
    background: `radial-gradient(circle, ${color[0]} 0 28%, ${color[1]} 30% 64%, ${color[2]} 66%)`,
    boxShadow: `0 0 16px ${color[1]}`,
  };
}

const hotspotTitleStyle: CSSProperties = {
  color: "#f2fbff",
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 950,
};

function hotspotBadgeStyle(badge: string): CSSProperties {
  const isClear = badge === "CLEAR" || badge === "DONE" || badge === "READY";
  const isFinal = badge === "FINAL";
  return {
    justifySelf: "start",
    padding: "2px 7px",
    borderRadius: 999,
    background: isClear
      ? "rgba(37, 118, 90, 0.92)"
      : isFinal
        ? "rgba(92, 64, 170, 0.92)"
        : "rgba(255, 198, 92, 0.2)",
    color: isClear ? "#d7ffed" : isFinal ? "#eee6ff" : "#ffe0a3",
    fontSize: 9,
    fontWeight: 950,
    lineHeight: 1,
  };
}

const mapCaptionStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: 14,
  transform: "translateX(-50%)",
  zIndex: 4,
  width: "min(90%, 560px)",
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(214,238,255,0.18)",
  background: "rgba(4, 10, 18, 0.62)",
  color: "rgba(244,250,255,0.82)",
  fontSize: 12,
  fontWeight: 850,
  textAlign: "center",
  backdropFilter: "blur(2px)",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  display: "grid",
  placeItems: "center",
  padding: 16,
  boxSizing: "border-box",
  background: "rgba(2, 6, 11, 0.66)",
  backdropFilter: "blur(3px)",
};

const modalStyle: CSSProperties = {
  width: "min(620px, 100%)",
  maxHeight: "min(84dvh, 680px)",
  overflowY: "auto",
  padding: 18,
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(143,215,255,0.32)",
  background:
    "radial-gradient(circle at 78% 0%, rgba(71, 184, 242, 0.16), transparent 34%), linear-gradient(180deg, rgba(14, 38, 54, 0.98), rgba(6, 11, 18, 0.98))",
  boxShadow: "0 28px 70px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.06)",
  color: "#f3f7ff",
};

const modalEyebrowStyle: CSSProperties = {
  color: "#8fd7ff",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const modalTitleStyle: CSSProperties = {
  margin: "4px 0 8px",
  color: "#e8f8ff",
  fontSize: 22,
  lineHeight: 1.25,
};

const modalLeadStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "rgba(244,250,255,0.82)",
  fontSize: 13,
  lineHeight: 1.65,
  fontWeight: 800,
};

const modalMissionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 10,
};

const missionButtonStyle: CSSProperties = {
  minHeight: 92,
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(143,215,255,0.28)",
  background: "linear-gradient(180deg, rgba(22, 52, 70, 0.88), rgba(10, 16, 24, 0.84))",
  color: "#f3f7ff",
  textAlign: "left",
  cursor: "pointer",
};

const disabledMissionStyle: CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
  filter: "saturate(0.55)",
};

const clearedMissionStyle: CSSProperties = {
  borderColor: "rgba(126, 240, 200, 0.62)",
  boxShadow: "0 0 18px rgba(126, 240, 200, 0.12)",
};

function missionBadgeStyle(state: "clear" | "locked" | "next"): CSSProperties {
  return {
    display: "inline-flex",
    padding: "3px 8px",
    borderRadius: 999,
    background:
      state === "clear"
        ? "rgba(37, 118, 90, 0.9)"
        : state === "locked"
          ? "rgba(86, 88, 94, 0.38)"
          : "rgba(255, 212, 122, 0.18)",
    color: state === "clear" ? "#d7ffed" : state === "locked" ? "#c8ced6" : "#ffe0a3",
    fontSize: 10,
    fontWeight: 950,
    marginBottom: 8,
  };
}

const missionTitleStyle: CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 950,
};

const missionSubStyle: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "rgba(244,250,255,0.72)",
  fontSize: 12,
  fontWeight: 800,
};

const infoBoxStyle: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,224,163,0.18)",
  background: "rgba(0,0,0,0.24)",
  color: "rgba(244,250,255,0.86)",
  fontSize: 13,
  lineHeight: 1.6,
  fontWeight: 850,
};

const shipPanelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 14,
  marginBottom: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,224,163,0.18)",
  background: "rgba(0,0,0,0.24)",
  color: "#ffe0a3",
  fontSize: 15,
  fontWeight: 950,
};

const modalActionButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  marginTop: 12,
  borderRadius: 12,
  border: "1px solid rgba(214,238,255,0.24)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8f8ff",
  fontWeight: 950,
  cursor: "pointer",
};

const modalCloseButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  marginTop: 14,
  borderRadius: 12,
  border: "1px solid rgba(214,238,255,0.24)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8f8ff",
  fontWeight: 950,
  cursor: "pointer",
};
