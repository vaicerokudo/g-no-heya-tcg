import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ScenarioId } from "../game/scenario/scenarios";
import {
  markWastelandExplorationSpotVisited,
  readWastelandProgress,
  type WastelandExplorationSpotId,
} from "../game/wasteland/progress";

type DustWastelandSceneProps = {
  onReturnContinent: () => void;
  onStartScenario: (scenarioId: ScenarioId) => void;
};

type WastelandNode = {
  id: ScenarioId;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  requires?: ScenarioId;
};

type WastelandExplorationSpot = {
  id: WastelandExplorationSpotId;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  unlockAfter: ScenarioId;
  description: string;
  dialogue: { speaker: string; text: string }[];
};

const DUST_WASTELAND_ROUTE_BACKGROUND_URL = "/backgrounds/dust-wasteland-route-map.png";

const WASTELAND_NODES: WastelandNode[] = [
  { id: "scenario12", title: "第12話 荒野の入口", subtitle: "つつとやぶこの荒野調査開始", x: 24, y: 78 },
  { id: "scenario13", title: "第13話 流砂地帯", subtitle: "停止でスタンする危険地帯", x: 72, y: 56, requires: "scenario12" },
  { id: "scenario14", title: "第14話 砂嵐の抜け道", subtitle: "視界の悪い中盤ルート", x: 28, y: 34, requires: "scenario13" },
  { id: "scenario15", title: "第15話 荒野の奥地", subtitle: "助っ人7171参加予定", x: 74, y: 18, requires: "scenario14" },
];

const EXPLORATION_SPOTS: WastelandExplorationSpot[] = [
  {
    id: "camp",
    title: "砂除けの野営地",
    subtitle: "砂風を避ける小さな休憩地点",
    x: 47,
    y: 68,
    unlockAfter: "scenario12",
    description: "砂を避ける布と、半分埋もれた焚き跡が残っている。荒野を渡る者が息を整えた場所だ。",
    dialogue: [
      { speaker: "やぶこ", text: "砂って、どこまで砂なの？" },
      { speaker: "つつ", text: "哲学みたいに言うな。歩け。" },
      { speaker: "やぶこ", text: "でも、休憩は大事なの？" },
      { speaker: "つつ", text: "それはそうだ。倒れたら元も子もねぇからな。" },
    ],
  },
  {
    id: "stone_monument",
    title: "風化した石碑",
    subtitle: "流砂の道を示す古い警告",
    x: 54,
    y: 44,
    unlockAfter: "scenario13",
    description: "欠けた石碑に、砂に沈む道を避けろという古い警句が刻まれている。",
    dialogue: [
      { speaker: "やぶこ", text: "なんか古い文字があるの。" },
      { speaker: "つつ", text: "砂に沈む者は、進む道を見失う……ってところか。" },
      { speaker: "やぶこ", text: "つまり、砂に気をつけるの？" },
      { speaker: "つつ", text: "そういうことだ。足元を見ろ。" },
    ],
  },
  {
    id: "broken_cart",
    title: "壊れた荷車",
    subtitle: "古い旅人の痕跡",
    x: 45,
    y: 24,
    unlockAfter: "scenario14",
    description: "砂に呑まれかけた荷車が、かつてこの道を越えようとした旅人の存在を物語っている。",
    dialogue: [
      { speaker: "やぶこ", text: "これ、誰かの荷車なの？" },
      { speaker: "つつ", text: "だいぶ前のもんだな。砂に呑まれかけてる。" },
      { speaker: "やぶこ", text: "ここを通った人がいたの？" },
      { speaker: "つつ", text: "ああ。俺たちも、その道の続きを進んでるってことだ。" },
      { speaker: "つつ", text: "荒野を越えるには、装備も歩き方も変えねぇとな。" },
      { speaker: "やぶこ", text: "じゃあ、旅の服が必要なの？" },
    ],
  },
  {
    id: "quicksand_watch",
    title: "流砂観測地点",
    subtitle: "止まると次の動きが潰れる砂場",
    x: 61,
    y: 34,
    unlockAfter: "scenario14",
    description: "乾いた砂の中に、色の違う流れが混じっている。見分けを誤ると足を取られる。",
    dialogue: [
      { speaker: "つつ", text: "見ろ。あの砂、色が少し違うだろ。" },
      { speaker: "やぶこ", text: "ほんとだ。おいしそうな色なの？" },
      { speaker: "つつ", text: "食うな。あれが流砂だ。足を取られるぞ。" },
      { speaker: "やぶこ", text: "足を取られたら、動けなくなるの？" },
      { speaker: "つつ", text: "そうだ。次の動きが潰れる。覚えとけ。" },
    ],
  },
];

export function DustWastelandScene({ onReturnContinent, onStartScenario }: DustWastelandSceneProps) {
  const [progress, setProgress] = useState(() => readWastelandProgress());
  const [activeSpot, setActiveSpot] = useState<WastelandExplorationSpot | null>(null);
  const clearedSet = useMemo(() => new Set(progress.clearedScenarios), [progress.clearedScenarios]);
  const visitedSpotSet = useMemo(() => new Set(progress.visitedSpots), [progress.visitedSpots]);
  const chapterCleared = progress.flags.includes("wasteland_chapter_cleared");

  useEffect(() => {
    const refreshProgress = () => setProgress(readWastelandProgress());

    refreshProgress();
    window.addEventListener("storage", refreshProgress);
    window.addEventListener("focus", refreshProgress);
    return () => {
      window.removeEventListener("storage", refreshProgress);
      window.removeEventListener("focus", refreshProgress);
    };
  }, []);

  function getNodeState(node: WastelandNode) {
    if (clearedSet.has(node.id)) return "clear";
    if (node.requires && !clearedSet.has(node.requires)) return "locked";
    return "next";
  }

  function getExplorationSpotState(spot: WastelandExplorationSpot) {
    if (chapterCleared || visitedSpotSet.has(spot.id)) return "visited";
    if (!clearedSet.has(spot.unlockAfter)) return "locked";
    return "new";
  }

  function openExplorationSpot(spot: WastelandExplorationSpot) {
    const spotState = getExplorationSpotState(spot);
    if (spotState === "locked") return;

    if (!visitedSpotSet.has(spot.id)) {
      setProgress(markWastelandExplorationSpotVisited(spot.id));
    }
    setActiveSpot(spot);
  }

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>DUST WASTELAND</div>
            <h1 style={titleStyle}>砂塵の荒野</h1>
            <div style={subtitleStyle}>
              {chapterCleared ? "荒野編クリア済み" : "ジグザグ進行MAP / 調査準備中"}
            </div>
          </div>
          <button type="button" onClick={onReturnContinent} style={returnButtonStyle}>
            大陸MAPへ戻る
          </button>
        </header>

        <div style={mapStyle}>
          <div aria-hidden="true" style={routeAtmosphereStyle} />
          <svg viewBox="0 0 100 100" aria-hidden="true" style={routeLineStyle}>
            <polyline points="24,78 72,56 28,34 74,18" fill="none" stroke="rgba(118,70,30,0.45)" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="24,78 72,56 28,34 74,18" fill="none" stroke="rgba(255,226,156,0.5)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="24,78 47,68 72,56 54,44 28,34 45,24 61,34 74,18" fill="none" stroke="rgba(255,245,195,0.22)" strokeWidth="1.4" strokeDasharray="2.4 3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {WASTELAND_NODES.map((node) => {
            const nodeState = getNodeState(node);
            const unlocked = nodeState !== "locked";
            const badge = nodeState === "clear" ? "CLEAR" : nodeState === "next" ? "NEXT" : "LOCK";

            return (
              <button
                key={node.id}
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  if (unlocked) onStartScenario(node.id);
                }}
                title={`${node.title}: ${nodeState === "locked" ? "LOCK" : nodeState === "clear" ? "CLEAR" : "調査可能"}`}
                style={{
                  ...nodeStyle,
                  ...(nodeState === "locked" ? nodeLockedStyle : null),
                  ...(nodeState === "clear" ? nodeClearStyle : null),
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                }}
              >
                <span style={nodeBadgeStyle(nodeState)}>{badge}</span>
                <span style={nodeTitleStyle}>{node.title}</span>
                <span style={nodeSubtitleStyle}>{node.subtitle}</span>
              </button>
            );
          })}

          {EXPLORATION_SPOTS.map((spot) => {
            const spotState = getExplorationSpotState(spot);
            const badge = spotState === "visited" ? "CHECK" : spotState === "new" ? "調査" : "LOCK";

            return (
              <button
                key={spot.id}
                type="button"
                disabled={spotState === "locked"}
                onClick={() => openExplorationSpot(spot)}
                title={`${spot.title}: ${spotState === "locked" ? "LOCK" : spotState === "visited" ? "調査済み" : "調査可能"}`}
                style={{
                  ...explorationSpotStyle,
                  ...(spotState === "locked" ? explorationSpotLockedStyle : null),
                  ...(spotState === "visited" ? explorationSpotVisitedStyle : null),
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                }}
              >
                <span style={explorationPinStyle(spotState)} />
                <span style={explorationLabelStyle}>{spot.title}</span>
                <span style={explorationBadgeStyle(spotState)}>{badge}</span>
              </button>
            );
          })}

          <div style={dialogPanelStyle}>
            <div style={dialogSpeakerStyle}>つつ</div>
            <div style={dialogTextStyle}>しょうがねぇなぁ……そっちは危ねぇって言ってんだろ</div>
            <div style={dialogSpeakerStyle}>やぶこ</div>
            <div style={dialogTextStyle}>えー？でも、こっちのほうが近そうなの？</div>
          </div>
        </div>
      </div>

      {activeSpot ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wasteland-exploration-title"
          style={explorationModalOverlayStyle}
          onClick={() => setActiveSpot(null)}
        >
          <div style={explorationModalStyle} onClick={(event) => event.stopPropagation()}>
            <div style={modalEyebrowStyle}>WASTELAND FIELD NOTE</div>
            <h2 id="wasteland-exploration-title" style={modalTitleStyle}>
              {activeSpot.title}
            </h2>
            <p style={modalDescriptionStyle}>{activeSpot.description}</p>
            <div style={modalDialogueListStyle}>
              {activeSpot.dialogue.map((line, index) => (
                <div key={`${line.speaker}-${index}`} style={modalDialogueLineStyle}>
                  <span style={modalSpeakerStyle}>{line.speaker}</span>
                  <span style={modalTextStyle}>{line.text}</span>
                </div>
              ))}
            </div>
            <button type="button" style={modalCloseButtonStyle} onClick={() => setActiveSpot(null)}>
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
  boxSizing: "border-box",
  padding: "10px 8px 18px",
  color: "#fff3d4",
  background:
    "radial-gradient(circle at 20% 12%, rgba(255, 213, 128, 0.26), transparent 30%), radial-gradient(circle at 78% 18%, rgba(255, 146, 74, 0.14), transparent 28%), linear-gradient(180deg, #2a241d 0%, #211816 48%, #111217 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = {
  width: "min(680px, 100%)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const eyebrowStyle: CSSProperties = {
  color: "#ffd27b",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#fff0c2",
  fontSize: 28,
  textShadow: "0 2px 14px rgba(0,0,0,0.5)",
};

const subtitleStyle: CSSProperties = {
  marginTop: 4,
  color: "#f2c487",
  fontSize: 13,
  fontWeight: 900,
};

const returnButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.34)",
  background: "rgba(255,241,204,0.12)",
  color: "#fff1cc",
  fontWeight: 900,
  cursor: "pointer",
};

const mapStyle: CSSProperties = {
  position: "relative",
  width: "clamp(320px, 96vw, 640px)",
  maxWidth: "100%",
  aspectRatio: "941 / 1672",
  minHeight: 0,
  margin: "0 auto",
  overflow: "hidden",
  borderRadius: 18,
  border: "1px solid rgba(255,220,150,0.26)",
  background:
    `linear-gradient(180deg, rgba(30, 22, 15, 0.12), rgba(24, 15, 10, 0.46)), url(${DUST_WASTELAND_ROUTE_BACKGROUND_URL}), linear-gradient(180deg, #9c7449 0%, #6d4a2d 45%, #2a201c 100%)`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  boxShadow: "0 22px 60px rgba(0,0,0,0.5), inset 0 0 70px rgba(55,30,12,0.34)",
};

const routeAtmosphereStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 1,
  background:
    "radial-gradient(circle at 72% 56%, rgba(255, 216, 122, 0.14), transparent 17%), radial-gradient(circle at 28% 34%, rgba(255, 236, 190, 0.10), transparent 18%), radial-gradient(circle at 74% 18%, rgba(66, 38, 24, 0.34), transparent 24%), linear-gradient(90deg, rgba(0,0,0,0.16), transparent 28%, transparent 72%, rgba(0,0,0,0.18))",
  mixBlendMode: "multiply",
};

const routeLineStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: 2,
};

const nodeStyle: CSSProperties = {
  position: "absolute",
  width: "min(46%, 236px)",
  minHeight: 78,
  transform: "translate(-50%, -50%)",
  padding: "10px 12px",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255, 226, 156, 0.7)",
  background: "linear-gradient(180deg, rgba(70, 45, 25, 0.92), rgba(28, 22, 18, 0.86))",
  color: "#fff2cf",
  boxShadow: "0 16px 30px rgba(0,0,0,0.36), 0 0 18px rgba(255, 194, 90, 0.16)",
  cursor: "pointer",
  textAlign: "left",
  zIndex: 3,
};

const nodeLockedStyle: CSSProperties = {
  opacity: 0.52,
  cursor: "not-allowed",
  filter: "saturate(0.55)",
};

const nodeClearStyle: CSSProperties = {
  borderColor: "rgba(126, 240, 200, 0.72)",
  boxShadow: "0 16px 30px rgba(0,0,0,0.36), 0 0 18px rgba(108, 255, 205, 0.16)",
};

function nodeBadgeStyle(state: "clear" | "locked" | "next"): CSSProperties {
  const color =
    state === "clear"
      ? ["rgba(37, 118, 90, 0.95)", "#c8ffe9"]
      : state === "next"
        ? ["rgba(186, 92, 18, 0.98)", "#fff6d6"]
        : ["rgba(72, 61, 54, 0.94)", "#d6c8b8"];

  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 18,
    padding: "2px 7px",
    borderRadius: 999,
    background: color[0],
    color: color[1],
    fontSize: 10,
    fontWeight: 950,
    lineHeight: 1,
    marginBottom: 7,
  };
}

const nodeTitleStyle: CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 950,
  lineHeight: 1.25,
};

const nodeSubtitleStyle: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "rgba(255, 239, 207, 0.74)",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.35,
};

const explorationSpotStyle: CSSProperties = {
  position: "absolute",
  minWidth: 126,
  maxWidth: 150,
  minHeight: 46,
  transform: "translate(-50%, -50%)",
  display: "grid",
  gridTemplateColumns: "16px 1fr",
  gridTemplateRows: "auto auto",
  columnGap: 7,
  rowGap: 3,
  alignItems: "center",
  padding: "7px 9px",
  boxSizing: "border-box",
  borderRadius: 999,
  border: "1px solid rgba(255, 233, 178, 0.5)",
  background: "linear-gradient(180deg, rgba(67, 43, 24, 0.86), rgba(32, 24, 18, 0.76))",
  color: "#fff2cf",
  boxShadow: "0 10px 22px rgba(0,0,0,0.3), 0 0 16px rgba(255, 204, 104, 0.16)",
  cursor: "pointer",
  textAlign: "left",
  zIndex: 5,
};

const explorationSpotLockedStyle: CSSProperties = {
  opacity: 0.36,
  cursor: "not-allowed",
  filter: "saturate(0.45)",
};

const explorationSpotVisitedStyle: CSSProperties = {
  borderColor: "rgba(126, 240, 200, 0.58)",
  background: "linear-gradient(180deg, rgba(38, 77, 59, 0.84), rgba(25, 33, 27, 0.76))",
};

function explorationPinStyle(state: "visited" | "locked" | "new"): CSSProperties {
  const background =
    state === "visited"
      ? "radial-gradient(circle, #c8ffe9 0 28%, #42bd8f 30% 64%, rgba(15,54,40,0.95) 66%)"
      : state === "new"
        ? "radial-gradient(circle, #fff5c8 0 28%, #ffb34d 30% 64%, rgba(95,45,16,0.95) 66%)"
        : "radial-gradient(circle, #d0c0aa 0 28%, #6d6256 30% 64%, rgba(42,36,31,0.95) 66%)";

  return {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background,
    boxShadow: state === "locked" ? "none" : "0 0 14px rgba(255,221,148,0.45)",
    gridRow: "1 / 3",
  };
}

const explorationLabelStyle: CSSProperties = {
  display: "block",
  color: "#fff1cb",
  fontSize: 11,
  lineHeight: 1.2,
  fontWeight: 950,
  whiteSpace: "normal",
};

function explorationBadgeStyle(state: "visited" | "locked" | "new"): CSSProperties {
  const colors =
    state === "visited"
      ? ["rgba(37, 118, 90, 0.9)", "#d7ffed"]
      : state === "new"
        ? ["rgba(184, 86, 19, 0.94)", "#fff3c2"]
        : ["rgba(68, 57, 48, 0.9)", "#d9c8b5"];

  return {
    justifySelf: "start",
    padding: "2px 6px",
    borderRadius: 999,
    background: colors[0],
    color: colors[1],
    fontSize: 9,
    fontWeight: 950,
    lineHeight: 1,
  };
}

const dialogPanelStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "5%",
  width: "min(84%, 430px)",
  transform: "translateX(-50%)",
  padding: "12px 14px",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255, 227, 169, 0.34)",
  background: "linear-gradient(180deg, rgba(44, 29, 19, 0.88), rgba(21, 17, 16, 0.78))",
  boxShadow: "0 18px 38px rgba(0,0,0,0.34)",
  zIndex: 4,
};

const dialogSpeakerStyle: CSSProperties = {
  marginTop: 3,
  color: "#ffd27b",
  fontSize: 11,
  fontWeight: 950,
};

const dialogTextStyle: CSSProperties = {
  marginTop: 2,
  color: "rgba(255, 239, 207, 0.86)",
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 800,
};

const explorationModalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  display: "grid",
  placeItems: "center",
  padding: 16,
  boxSizing: "border-box",
  background: "rgba(9, 8, 7, 0.64)",
  backdropFilter: "blur(3px)",
};

const explorationModalStyle: CSSProperties = {
  width: "min(520px, 100%)",
  maxHeight: "min(82dvh, 620px)",
  overflowY: "auto",
  borderRadius: 16,
  border: "1px solid rgba(255, 223, 154, 0.38)",
  background:
    "radial-gradient(circle at 20% 0%, rgba(255, 207, 118, 0.18), transparent 34%), linear-gradient(180deg, rgba(58, 39, 25, 0.98), rgba(22, 18, 16, 0.98))",
  boxShadow: "0 28px 70px rgba(0,0,0,0.56), inset 0 0 45px rgba(255, 207, 118, 0.08)",
  padding: 18,
  boxSizing: "border-box",
  color: "#fff1cf",
};

const modalEyebrowStyle: CSSProperties = {
  color: "#ffd27b",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0,
};

const modalTitleStyle: CSSProperties = {
  margin: "4px 0 8px",
  fontSize: 22,
  lineHeight: 1.25,
  color: "#fff0c2",
};

const modalDescriptionStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "rgba(255, 239, 207, 0.82)",
  fontSize: 13,
  lineHeight: 1.6,
  fontWeight: 800,
};

const modalDialogueListStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255, 232, 180, 0.18)",
  background: "rgba(15, 12, 10, 0.32)",
};

const modalDialogueLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px 1fr",
  gap: 8,
  alignItems: "start",
};

const modalSpeakerStyle: CSSProperties = {
  color: "#ffd27b",
  fontSize: 12,
  fontWeight: 950,
};

const modalTextStyle: CSSProperties = {
  color: "rgba(255, 244, 220, 0.92)",
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 800,
};

const modalCloseButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  marginTop: 14,
  borderRadius: 12,
  border: "1px solid rgba(255,232,180,0.34)",
  background: "rgba(255,241,204,0.12)",
  color: "#fff1cc",
  fontWeight: 950,
  cursor: "pointer",
};
