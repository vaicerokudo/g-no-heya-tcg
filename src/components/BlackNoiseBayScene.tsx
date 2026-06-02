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
  onEnterNecroCity: () => void;
  onStartScenario: (scenarioId: ScenarioId) => void;
};

const FRONT_MISSIONS: Array<{ id: ScenarioId; title: string; subLabel: string; requires?: ScenarioId }> = [
  { id: "scenario16", title: "第16話 黒い潮", subLabel: "湾岸の異変確認" },
  { id: "scenario17", title: "第17話 漂着する影", subLabel: "侵された魔物の調査", requires: "scenario16" },
  { id: "scenario18", title: "第18話 湾の中心へ", subLabel: "巨大な影の確認", requires: "scenario17" },
];

export function BlackNoiseBayScene({
  clearedScenarioIds,
  onReturnContinent,
  onEnterNecroCity,
  onStartScenario,
}: BlackNoiseBaySceneProps) {
  const [shipProgress, setShipProgress] = useState(() => readShipProgress());
  const clearedSet = useMemo(() => new Set(clearedScenarioIds), [clearedScenarioIds]);
  const frontCleared =
    clearedSet.has("scenario18") || hasBlackNoiseBayEventFlag("black_noise_bay_front_cleared");
  const shipReady =
    shipProgress.flags.includes("ship_built") || shipProgress.flags.includes("black_noise_bay_ship_ready");
  const departed = shipProgress.flags.includes("black_noise_bay_departed");
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

        <section style={heroPanelStyle}>
          <div style={panelTitleStyle}>湾岸調査ログ</div>
          <p style={leadStyle}>
            湾岸に黒い潮が流れ着いている。海辺の魔物が活性化し、湾の中心には巨大な影が見える。
          </p>
          <div style={statusBoxStyle}>
            {departed ? (
              <>
                <strong>湾の中心が目前です。</strong>
                <span>次は、うしまるがリヴァイアサンを釣り上げる作戦です。</span>
              </>
            ) : shipReady ? (
              <>
                <strong>船の準備が整いました。</strong>
                <span>湾の中心へ向かえます。黒い潮の奥に、巨大な影が待っています。</span>
              </>
            ) : frontCleared ? (
              <>
                <strong>湾の中心へ進むには船が必要です。</strong>
                <span>ROCKELが木材集めに向かいました。残りの部材を探すため、廃都ネクロシティへ向かいましょう。</span>
              </>
            ) : (
              <>
                <strong>湾岸の異変を調査しましょう。</strong>
                <span>まずは第16話「黒い潮」から開始します。</span>
              </>
            )}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>前編ミッション</div>
          <div style={missionGridStyle}>
            {FRONT_MISSIONS.map((mission) => {
              const cleared = clearedSet.has(mission.id);
              const locked = mission.requires ? !clearedSet.has(mission.requires) : false;
              return (
                <button
                  key={mission.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onStartScenario(mission.id)}
                  style={{
                    ...missionButtonStyle,
                    ...(locked ? disabledMissionStyle : null),
                    ...(cleared ? clearedMissionStyle : null),
                  }}
                >
                  <span style={missionBadgeStyle}>{cleared ? "CLEAR" : locked ? "LOCK" : "START"}</span>
                  <span style={missionTitleStyle}>{mission.title}</span>
                  <span style={missionSubStyle}>{mission.subLabel}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>造船状態</div>
          <div style={shipStatusStyle}>
            <span>船の部材：{collectedPartCount} / {SHIP_PART_IDS.length}</span>
            <span>{shipReady ? "造船完了" : frontCleared ? "ネクロシティ探索可能" : "船の必要性は未確認"}</span>
          </div>
          <div style={actionsStyle}>
            <button type="button" onClick={onEnterNecroCity} disabled={!frontCleared} style={{
              ...primaryButtonStyle,
              ...(!frontCleared ? disabledButtonStyle : null),
            }}>
              廃都ネクロシティへ
            </button>
            <button
              type="button"
              disabled={!shipReady || departed}
              onClick={() => onStartScenario("scenario19")}
              style={{
                ...(shipReady && !departed ? primaryButtonStyle : secondaryButtonStyle),
                ...(!shipReady || departed ? disabledButtonStyle : null),
              }}
            >
              {departed ? "第20話 準備中" : shipReady ? "湾中央へ向かう" : "湾の中心へ：船が必要"}
            </button>
          </div>
        </section>

        {frontCleared ? (
          <div style={rockelLineStyle}>ROCKEL：「木材なら任せるっす！でっかいの持ってくるっす！」</div>
        ) : null}
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  padding: "12px 10px 20px",
  boxSizing: "border-box",
  color: "#f3f7ff",
  background:
    "linear-gradient(180deg, rgba(4, 10, 18, 0.34), rgba(3, 6, 12, 0.9)), radial-gradient(circle at 50% 32%, rgba(37, 95, 120, 0.24), transparent 34%), url('/backgrounds/black-noise-bay-map.png') center top / cover no-repeat, linear-gradient(180deg, #101925 0%, #10202a 48%, #080b12 100%)",
};

const shellStyle: CSSProperties = { width: "min(720px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 12 };
const eyebrowStyle: CSSProperties = { color: "#8fd7ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", color: "#e8f8ff", fontSize: 28, textShadow: "0 2px 14px rgba(0,0,0,0.58)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(214, 238, 255, 0.78)", fontSize: 13, fontWeight: 850 };
const heroPanelStyle: CSSProperties = { padding: 16, borderRadius: 14, border: "1px solid rgba(143,215,255,0.3)", background: "linear-gradient(180deg, rgba(14, 38, 54, 0.92), rgba(8, 12, 19, 0.88))", boxShadow: "0 18px 46px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", backdropFilter: "blur(2px)" };
const panelTitleStyle: CSSProperties = { color: "#bdeaff", fontSize: 12, fontWeight: 950 };
const leadStyle: CSSProperties = { margin: "8px 0 0", color: "rgba(244,250,255,0.88)", fontSize: 14, lineHeight: 1.7, fontWeight: 800 };
const statusBoxStyle: CSSProperties = { display: "grid", gap: 6, marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(0,0,0,0.24)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, lineHeight: 1.55 };
const sectionStyle: CSSProperties = { marginTop: 12, padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(5, 9, 15, 0.76)", boxShadow: "0 14px 32px rgba(0,0,0,0.28)", backdropFilter: "blur(2px)" };
const sectionHeaderStyle: CSSProperties = { color: "#ffe0a3", fontSize: 13, fontWeight: 950, marginBottom: 10 };
const missionGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 };
const missionButtonStyle: CSSProperties = { minHeight: 92, padding: 12, borderRadius: 10, border: "1px solid rgba(143,215,255,0.28)", background: "linear-gradient(180deg, rgba(22, 52, 70, 0.88), rgba(10, 16, 24, 0.84))", color: "#f3f7ff", textAlign: "left", cursor: "pointer" };
const disabledMissionStyle: CSSProperties = { opacity: 0.5, cursor: "not-allowed", filter: "saturate(0.55)" };
const clearedMissionStyle: CSSProperties = { borderColor: "rgba(126, 240, 200, 0.62)", boxShadow: "0 0 18px rgba(126, 240, 200, 0.12)" };
const missionBadgeStyle: CSSProperties = { display: "inline-flex", padding: "3px 8px", borderRadius: 999, background: "rgba(255, 212, 122, 0.18)", color: "#ffe0a3", fontSize: 10, fontWeight: 950, marginBottom: 8 };
const missionTitleStyle: CSSProperties = { display: "block", fontSize: 14, fontWeight: 950 };
const missionSubStyle: CSSProperties = { display: "block", marginTop: 4, color: "rgba(244,250,255,0.72)", fontSize: 12, fontWeight: 800 };
const shipStatusStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: "rgba(244,250,255,0.86)", fontSize: 13, fontWeight: 900 };
const actionsStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 };
const baseButtonStyle: CSSProperties = { minHeight: 40, padding: "0 14px", borderRadius: 10, fontWeight: 950, cursor: "pointer" };
const primaryButtonStyle: CSSProperties = { ...baseButtonStyle, border: "1px solid rgba(255, 220, 136, 0.66)", background: "linear-gradient(180deg, #ffd979, #b87624)", color: "#22160a" };
const secondaryButtonStyle: CSSProperties = { ...baseButtonStyle, border: "1px solid rgba(214,238,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#e8f8ff" };
const disabledButtonStyle: CSSProperties = { opacity: 0.48, cursor: "not-allowed" };
const rockelLineStyle: CSSProperties = { marginTop: 12, color: "#ffe0a3", fontSize: 13, fontWeight: 900, lineHeight: 1.6 };
