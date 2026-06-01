import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ScenarioId } from "../game/scenario/scenarios";
import { readWastelandProgress } from "../game/wasteland/progress";

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

const DUST_WASTELAND_BACKGROUND_URL = "/backgrounds/dust-wasteland-map.png";

const WASTELAND_NODES: WastelandNode[] = [
  { id: "scenario12", title: "第12話 荒野の入口", subtitle: "つつとやぶこの荒野調査開始", x: 24, y: 78 },
  { id: "scenario13", title: "第13話 流砂地帯", subtitle: "停止でスタンする危険地帯", x: 72, y: 56, requires: "scenario12" },
  { id: "scenario14", title: "第14話 砂嵐の抜け道", subtitle: "視界の悪い中盤ルート", x: 28, y: 34, requires: "scenario13" },
  { id: "scenario15", title: "第15話 荒野の奥地", subtitle: "助っ人7171参加予定", x: 74, y: 18, requires: "scenario14" },
];

export function DustWastelandScene({ onReturnContinent, onStartScenario }: DustWastelandSceneProps) {
  const [progress, setProgress] = useState(() => readWastelandProgress());
  const clearedSet = useMemo(() => new Set(progress.clearedScenarios), [progress.clearedScenarios]);
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
          <svg viewBox="0 0 100 100" aria-hidden="true" style={routeLineStyle}>
            <polyline points="24,78 72,56 28,34 74,18" fill="none" stroke="rgba(255,226,156,0.42)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="24,78 72,56 28,34 74,18" fill="none" stroke="rgba(118,70,30,0.45)" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
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

          <div style={dialogPanelStyle}>
            <div style={dialogSpeakerStyle}>つつ</div>
            <div style={dialogTextStyle}>しょうがねぇなぁ……そっちは危ねぇって言ってんだろ</div>
            <div style={dialogSpeakerStyle}>やぶこ</div>
            <div style={dialogTextStyle}>えー？でも、こっちのほうが近そうなの？</div>
          </div>
        </div>
      </div>
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
    `linear-gradient(180deg, rgba(32, 24, 14, 0.12), rgba(37, 20, 10, 0.5)), url(${DUST_WASTELAND_BACKGROUND_URL}), linear-gradient(180deg, #9c7449 0%, #6d4a2d 45%, #2a201c 100%)`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  boxShadow: "0 22px 60px rgba(0,0,0,0.5), inset 0 0 70px rgba(55,30,12,0.34)",
};

const routeLineStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: 1,
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
  zIndex: 2,
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
  zIndex: 3,
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
