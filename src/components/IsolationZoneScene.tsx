import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getIsolationProgress,
  type IsolationDuelMemberId,
} from "../game/isolation/progress";
import type { ScenarioId } from "../game/scenario/scenarios";

type IsolationZoneSceneProps = {
  onReturnContinent: () => void;
  onStartScenario: (scenarioId: ScenarioId) => void;
};

type DuelMission = {
  memberId: IsolationDuelMemberId;
  label: string;
  subLabel: string;
  scenarioId?: ScenarioId;
};

const DUEL_MISSIONS: DuelMission[] = [
  { memberId: "socho", label: "総長", subLabel: "影との一騎打ち" },
  { memberId: "tsutsu", label: "つつ", subLabel: "影との一騎打ち" },
  { memberId: "rokudo", label: "ROKUDO", subLabel: "影との一騎打ち" },
  { memberId: "7171", label: "7171", subLabel: "影との一騎打ち" },
  { memberId: "myouou", label: "明王", subLabel: "影との一騎打ち" },
  { memberId: "hibiki", label: "hibiki", subLabel: "影との一騎打ち" },
  { memberId: "ushimaru", label: "うしまる", subLabel: "第22話 影のうしまる", scenarioId: "scenario22" },
  { memberId: "deli", label: "Deli", subLabel: "影との一騎打ち" },
  { memberId: "yabuko", label: "やぶこ", subLabel: "影との一騎打ち" },
  { memberId: "rockel", label: "ROCKEL", subLabel: "影との一騎打ち" },
  { memberId: "player", label: "Player", subLabel: "影との一騎打ち" },
];

export function IsolationZoneScene({ onReturnContinent, onStartScenario }: IsolationZoneSceneProps) {
  const [progress, setProgress] = useState(() => getIsolationProgress());
  const clearedSet = useMemo(() => new Set(progress.clearedDuels), [progress.clearedDuels]);
  const clearedCount = progress.clearedDuels.length;

  useEffect(() => {
    const refresh = () => setProgress(getIsolationProgress());

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>ISOLATION ZONE</div>
            <h1 style={titleStyle}>隔離区域</h1>
            <div style={subtitleStyle}>己の影と向き合う場所</div>
          </div>
          <button type="button" onClick={onReturnContinent} style={returnButtonStyle}>
            大陸MAPへ戻る
          </button>
        </header>

        <section style={heroStyle}>
          <div style={panelTitleStyle}>最終試練：一騎打ち</div>
          <p style={leadStyle}>
            この区域では、Gの部屋メンバーがそれぞれ自分の闇落ちVerと一騎打ちを行います。
            すべての影を越えると、闇落ちスキンが解放されます。
          </p>
          <div style={progressPillStyle}>
            影の踏破：{clearedCount} / {DUEL_MISSIONS.length}
          </div>
        </section>

        <section style={missionPanelStyle}>
          <div style={sectionHeaderStyle}>一騎打ちミッション</div>
          <div style={missionGridStyle}>
            {DUEL_MISSIONS.map((mission) => {
              const cleared = clearedSet.has(mission.memberId);
              const implemented = Boolean(mission.scenarioId);
              const badge = cleared ? "CLEAR" : implemented ? "NEXT" : "準備中";

              return (
                <button
                  key={mission.memberId}
                  type="button"
                  disabled={!implemented}
                  onClick={() => {
                    if (mission.scenarioId) onStartScenario(mission.scenarioId);
                  }}
                  style={{
                    ...missionButtonStyle,
                    ...(!implemented ? disabledMissionStyle : null),
                    ...(cleared ? clearedMissionStyle : null),
                  }}
                >
                  <span style={missionBadgeStyle(cleared, implemented)}>{badge}</span>
                  <span style={missionTitleStyle}>{mission.label}</span>
                  <span style={missionSubStyle}>{mission.subLabel}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div style={noteStyle}>
          闇落ちスキンは、全員分の影を越えた時に解放される予定です。現在は「うしまる」の動作確認用ミッションのみ実装済みです。
        </div>
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: "12px 10px 20px",
  color: "#f5f0ff",
  background:
    "radial-gradient(circle at 50% 18%, rgba(145, 90, 255, 0.22), transparent 32%), radial-gradient(circle at 18% 62%, rgba(27, 185, 255, 0.1), transparent 28%), linear-gradient(180deg, #10101a 0%, #090b12 54%, #05060a 100%)",
  display: "flex",
  justifyContent: "center",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = { width: "min(760px, 100%)" };
const headerStyle: CSSProperties = { display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 };
const eyebrowStyle: CSSProperties = { color: "#c9b5ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", color: "#f5f0ff", fontSize: 30, textShadow: "0 0 18px rgba(156,112,255,0.34)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(231,223,255,0.76)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 40, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(218,207,255,0.28)", background: "rgba(255,255,255,0.08)", color: "#f5f0ff", fontWeight: 950, cursor: "pointer" };
const heroStyle: CSSProperties = { padding: 16, borderRadius: 16, border: "1px solid rgba(190,170,255,0.28)", background: "linear-gradient(180deg, rgba(36, 28, 62, 0.82), rgba(8, 10, 18, 0.88))", boxShadow: "0 22px 58px rgba(0,0,0,0.44), inset 0 0 46px rgba(120,78,255,0.1)" };
const panelTitleStyle: CSSProperties = { color: "#ffe0ff", fontSize: 13, fontWeight: 950 };
const leadStyle: CSSProperties = { margin: "9px 0 0", color: "rgba(245,240,255,0.86)", fontSize: 14, lineHeight: 1.7, fontWeight: 800 };
const progressPillStyle: CSSProperties = { display: "inline-flex", marginTop: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(185,160,255,0.38)", background: "rgba(0,0,0,0.22)", color: "#dfd2ff", fontSize: 12, fontWeight: 950 };
const missionPanelStyle: CSSProperties = { marginTop: 12, padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(7, 8, 14, 0.76)", boxShadow: "0 18px 38px rgba(0,0,0,0.34)" };
const sectionHeaderStyle: CSSProperties = { color: "#c9b5ff", fontSize: 13, fontWeight: 950, marginBottom: 10 };
const missionGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 };
const missionButtonStyle: CSSProperties = { minHeight: 94, padding: 12, borderRadius: 12, border: "1px solid rgba(185,160,255,0.3)", background: "linear-gradient(180deg, rgba(37, 31, 62, 0.92), rgba(11, 13, 22, 0.88))", color: "#f5f0ff", textAlign: "left", cursor: "pointer", boxShadow: "0 12px 24px rgba(0,0,0,0.28)" };
const disabledMissionStyle: CSSProperties = { opacity: 0.48, cursor: "not-allowed", filter: "saturate(0.5)" };
const clearedMissionStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.68)", boxShadow: "0 12px 24px rgba(0,0,0,0.28), 0 0 18px rgba(126,240,200,0.14)" };
const missionTitleStyle: CSSProperties = { display: "block", fontSize: 15, fontWeight: 950 };
const missionSubStyle: CSSProperties = { display: "block", marginTop: 5, color: "rgba(245,240,255,0.68)", fontSize: 12, fontWeight: 800, lineHeight: 1.35 };
const noteStyle: CSSProperties = { marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.22)", color: "rgba(245,240,255,0.72)", fontSize: 12, lineHeight: 1.6, fontWeight: 800 };

function missionBadgeStyle(cleared: boolean, implemented: boolean): CSSProperties {
  return {
    display: "inline-flex",
    padding: "3px 8px",
    borderRadius: 999,
    marginBottom: 9,
    background: cleared ? "rgba(35, 116, 86, 0.86)" : implemented ? "rgba(123, 82, 255, 0.32)" : "rgba(70, 66, 82, 0.72)",
    color: cleared ? "#c8ffe9" : implemented ? "#eadfff" : "#d1cadd",
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 950,
  };
}
