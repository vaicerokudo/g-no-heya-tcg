import { useMemo, useState, type CSSProperties } from "react";
import {
  readShinobiVillageProgress,
  updateShinobiVillageProgress,
  type ShinobiVillageProgress,
} from "../game/shinobi/progress";

type ShinobiVillageSceneProps = {
  onReturnTown: () => void;
};

type HotspotId = "rokudoHouse" | "souunHouse" | "nachaHouse" | "mijinWorkshop" | "bambooGrove";

type Hotspot = {
  id: HotspotId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  kind: "home" | "quest" | "workshop";
};

const ROKUDO_YOUTUBE_URL = "https://www.youtube.com/@vaicerokudo";

const HOTSPOTS: Hotspot[] = [
  { id: "rokudoHouse", label: "ROKUDOの家", subLabel: "物語の始まり", x: 50, y: 38, kind: "home" },
  { id: "souunHouse", label: "早雲の家", subLabel: "和弓使い", x: 26, y: 48, kind: "home" },
  { id: "nachaHouse", label: "那茶の家", subLabel: "逃げ足注意", x: 74, y: 50, kind: "home" },
  { id: "mijinWorkshop", label: "微塵の工房", subLabel: "技工士", x: 56, y: 68, kind: "workshop" },
  { id: "bambooGrove", label: "竹林の奥", subLabel: "和弓探し", x: 18, y: 72, kind: "quest" },
];

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ShinobiVillageScene({ onReturnTown }: ShinobiVillageSceneProps) {
  const [progress, setProgress] = useState<ShinobiVillageProgress>(() => readShinobiVillageProgress());
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const activeSpot = useMemo(() => HOTSPOTS.find((spot) => spot.id === activeHotspot) ?? null, [activeHotspot]);

  const updateProgress = (updater: (current: ShinobiVillageProgress) => ShinobiVillageProgress) => {
    setProgress(updateShinobiVillageProgress(updater));
  };

  const handleHotspot = (spotId: HotspotId) => {
    setActiveHotspot(spotId);
    if (spotId === "rokudoHouse" && !progress.visitedRokudoHouse) {
      updateProgress((current) => ({ ...current, visitedRokudoHouse: true }));
    }
  };

  const markBowFound = () => {
    updateProgress((current) => ({ ...current, souunBowFound: true }));
  };

  const joinSouun = () => {
    updateProgress((current) => ({ ...current, souunBowFound: true, souunJoined: true }));
  };

  const visitNacha = () => {
    updateProgress((current) => ({
      ...current,
      nachaFound: true,
      nachaJoined: current.souunJoined ? true : current.nachaJoined,
    }));
  };

  const joinMijin = () => {
    updateProgress((current) => ({
      ...current,
      mijinJoined: true,
      rokuPartsQuestStarted: true,
    }));
  };

  const renderModalBody = () => {
    if (!activeSpot) return null;

    if (activeSpot.id === "rokudoHouse") {
      return (
        <>
          <p style={modalTextStyle}>
            静かな家の中に、使い込まれた忍具が並んでいる。
            <br />
            ここから、ROKUDOの物語が続いている。
          </p>
          <button type="button" style={primaryButtonStyle} onClick={() => openExternalUrl(ROKUDO_YOUTUBE_URL)}>
            YouTubeを開く
          </button>
        </>
      );
    }

    if (activeSpot.id === "souunHouse") {
      if (!progress.souunBowFound) {
        return (
          <>
            <p style={modalTextStyle}>
              早雲：
              <br />
              「おう、ROKUDO。来たか。手ぇ貸してほしいなら、まず俺の和弓探してきてくれや。」
              <br />
              <br />
              ROKUDO：
              <br />
              「……自分で探しなよ。にいちゃん。」
              <br />
              <br />
              早雲：
              <br />
              「細けぇこと言うな。兄貴分の頼みだろ。」
            </p>
            <div style={hintBoxStyle}>竹林の奥に手がかりがありそうだ。</div>
          </>
        );
      }

      if (!progress.souunJoined) {
        return (
          <>
            <p style={modalTextStyle}>
              早雲：
              <br />
              「お、見つけてきたか。しょうがねぇな。付き合ってやるよ。」
            </p>
            <button type="button" style={primaryButtonStyle} onClick={joinSouun}>
              早雲に同行してもらう
            </button>
          </>
        );
      }

      return (
        <p style={modalTextStyle}>
          早雲：
          <br />
          「しょうがねぇな。付き合ってやるよ。」
        </p>
      );
    }

    if (activeSpot.id === "bambooGrove") {
      return (
        <>
          <p style={modalTextStyle}>
            古い竹の根元に、丁寧に包まれた和弓が置かれていた。
            <br />
            早雲の和弓を見つけた。
          </p>
          {!progress.souunBowFound ? (
            <button type="button" style={primaryButtonStyle} onClick={markBowFound}>
              和弓を持っていく
            </button>
          ) : (
            <div style={hintBoxStyle}>早雲の和弓は回収済みだ。</div>
          )}
        </>
      );
    }

    if (activeSpot.id === "nachaHouse") {
      if (!progress.nachaFound) {
        return (
          <>
            <p style={modalTextStyle}>
              那茶：
              <br />
              「……やだああああ！」
              <br />
              <br />
              ROKUDO：
              <br />
              「那茶。おちつけ！」
              <br />
              <br />
              那茶：
              <br />
              「やーだね！にげろぉぉ！」
            </p>
            <button type="button" style={primaryButtonStyle} onClick={visitNacha}>
              追いかける
            </button>
          </>
        );
      }

      if (!progress.souunJoined) {
        return (
          <p style={modalTextStyle}>
            ROKUDO：
            <br />
            「……一人では追いきれませんね。」
          </p>
        );
      }

      if (!progress.nachaJoined) {
        return (
          <>
            <p style={modalTextStyle}>
              早雲：
              <br />
              「おい那茶、逃げ足だけは一人前だな。」
              <br />
              <br />
              那茶：
              <br />
              「うるさいなぁ！捕まっただけで負けたわけじゃないし！」
              <br />
              <br />
              ROKUDO：
              <br />
              「ほら、いくよっ！」
              <br />
              <br />
              那茶：
              <br />
              「……ちょっとだけだからね。」
            </p>
            <button type="button" style={primaryButtonStyle} onClick={visitNacha}>
              那茶に同行してもらう
            </button>
          </>
        );
      }

      return (
        <p style={modalTextStyle}>
          那茶：
          <br />
          「……ちょっとだけだからね。」
        </p>
      );
    }

    if (activeSpot.id === "mijinWorkshop") {
      if (!progress.souunJoined || !progress.nachaJoined) {
        return (
          <p style={modalTextStyle}>
            微塵：
            <br />
            「おお、ROKUDOか。これよくね？」
            <br />
            <br />
            ROKUDO：
            <br />
            「なに？新しい道具？」
            <br />
            <br />
            微塵：
            <br />
            「人手が足りねぇな。早雲と那茶も連れてきな。」
          </p>
        );
      }

      if (!progress.mijinJoined) {
        return (
          <>
            <p style={modalTextStyle}>
              微塵：
              <br />
              「よし、面子はそろったな。それじゃ、ロクのパーツ集めといくか。」
              <br />
              <br />
              ROKUDO：
              <br />
              「ロク……？」
              <br />
              <br />
              微塵：
              <br />
              「名前は仮だ。だが、きっとお前の助けになる。」
            </p>
            <button type="button" style={primaryButtonStyle} onClick={joinMijin}>
              ロク制作の準備を始める
            </button>
          </>
        );
      }

      return (
        <p style={modalTextStyle}>
          微塵：
          <br />
          「ロク制作の準備中だ。次はパーツ探しだな。」
        </p>
      );
    }

    return null;
  };

  return (
    <div style={sceneStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>ROKUDO SIDE STORY</div>
            <h1 style={titleStyle}>忍びの里</h1>
            <div style={subtitleStyle}>ROKUDOの故郷。ロク制作の物語が、ここから始まる。</div>
          </div>
          <button type="button" style={returnButtonStyle} onClick={onReturnTown}>
            Gの部屋へ戻る
          </button>
        </header>

        <section style={progressPanelStyle}>
          <span>同行者</span>
          <span>早雲：{progress.souunJoined ? "同行中" : "未"}</span>
          <span>那茶：{progress.nachaJoined ? "同行中" : "未"}</span>
          <span>微塵：{progress.mijinJoined ? "参加" : "未"}</span>
          {progress.rokuPartsQuestStarted ? <strong>ロク制作準備中</strong> : null}
        </section>

        <main style={mapFrameStyle}>
          <div style={moonStyle} />
          <div style={pathStyle} />
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleHotspot(spot.id)}
              style={{
                ...hotspotStyle,
                ...(spot.kind === "quest" ? questHotspotStyle : null),
                ...(spot.kind === "workshop" ? workshopHotspotStyle : null),
                left: `${spot.x}%`,
                top: `${spot.y}%`,
              }}
            >
              <span style={hotspotPinStyle} />
              <span style={hotspotLabelStyle}>{spot.label}</span>
              <span style={hotspotSubLabelStyle}>{spot.subLabel}</span>
            </button>
          ))}
        </main>

        {activeSpot ? (
          <div style={modalOverlayStyle} onClick={() => setActiveHotspot(null)}>
            <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
              <div style={modalEyebrowStyle}>忍びの里</div>
              <h2 style={modalTitleStyle}>{activeSpot.label}</h2>
              {renderModalBody()}
              <button type="button" style={closeButtonStyle} onClick={() => setActiveHotspot(null)}>
                閉じる
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  minHeight: "100dvh",
  padding: "12px 10px 18px",
  boxSizing: "border-box",
  color: "#f5fbff",
  background:
    "radial-gradient(circle at 72% 16%, rgba(136, 180, 255, 0.18), transparent 24%), linear-gradient(180deg, #101727 0%, #0a101a 54%, #06080d 100%)",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = { width: "min(980px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 10 };
const eyebrowStyle: CSSProperties = { color: "#aee6ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", fontSize: 30, color: "#eef8ff", textShadow: "0 0 18px rgba(94,167,255,0.26)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(238,248,255,0.74)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 40, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(174,230,255,0.28)", background: "rgba(255,255,255,0.08)", color: "#eef8ff", fontWeight: 950, cursor: "pointer" };
const progressPanelStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10, padding: "9px 11px", borderRadius: 14, border: "1px solid rgba(174,230,255,0.18)", background: "rgba(4, 9, 16, 0.66)", color: "#dff5ff", fontSize: 12, fontWeight: 950 };
const mapFrameStyle: CSSProperties = { position: "relative", minHeight: "min(72dvh, 720px)", overflow: "hidden", borderRadius: 18, border: "1px solid rgba(174,230,255,0.24)", background: "radial-gradient(circle at 50% 22%, rgba(93,137,190,0.26), transparent 24%), linear-gradient(180deg, rgba(13, 28, 45, 0.92), rgba(6, 10, 18, 0.94)), repeating-linear-gradient(120deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 28px)", boxShadow: "0 24px 66px rgba(0,0,0,0.54), inset 0 0 70px rgba(0,0,0,0.26)" };
const moonStyle: CSSProperties = { position: "absolute", right: "10%", top: "10%", width: 76, height: 76, borderRadius: "50%", background: "radial-gradient(circle, rgba(235,247,255,0.94), rgba(148,193,230,0.22) 58%, transparent 68%)", boxShadow: "0 0 34px rgba(174,230,255,0.28)", pointerEvents: "none" };
const pathStyle: CSSProperties = { position: "absolute", left: "14%", right: "14%", top: "58%", height: "24%", borderRadius: "50%", borderTop: "2px dashed rgba(210,232,255,0.16)", transform: "rotate(-4deg)", pointerEvents: "none" };
const hotspotStyle: CSSProperties = { position: "absolute", transform: "translate(-50%, -50%)", minWidth: 130, minHeight: 54, padding: "8px 10px 8px 28px", borderRadius: 14, border: "1px solid rgba(174,230,255,0.34)", background: "linear-gradient(180deg, rgba(16, 35, 54, 0.9), rgba(6, 11, 18, 0.84))", color: "#f5fbff", display: "grid", gap: 2, textAlign: "left", cursor: "pointer", boxShadow: "0 14px 30px rgba(0,0,0,0.34), 0 0 18px rgba(94,167,255,0.12)", touchAction: "manipulation" };
const questHotspotStyle: CSSProperties = { borderColor: "rgba(255,220,145,0.46)", background: "linear-gradient(180deg, rgba(56, 42, 18, 0.9), rgba(16, 12, 8, 0.84))" };
const workshopHotspotStyle: CSSProperties = { borderColor: "rgba(183,158,255,0.46)", background: "linear-gradient(180deg, rgba(35, 27, 62, 0.9), rgba(10, 9, 18, 0.84))" };
const hotspotPinStyle: CSSProperties = { position: "absolute", left: 10, top: 15, width: 10, height: 10, borderRadius: "50%", background: "#dff5ff", boxShadow: "0 0 0 4px rgba(174,230,255,0.12), 0 0 16px rgba(174,230,255,0.64)" };
const hotspotLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 950, lineHeight: 1.15 };
const hotspotSubLabelStyle: CSSProperties = { color: "rgba(238,248,255,0.72)", fontSize: 11, fontWeight: 850, lineHeight: 1.2 };
const modalOverlayStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 14, boxSizing: "border-box", background: "rgba(2, 5, 10, 0.68)", backdropFilter: "blur(3px)" };
const modalStyle: CSSProperties = { width: "min(620px, 100%)", maxHeight: "min(84dvh, 680px)", overflowY: "auto", padding: 18, boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(174,230,255,0.3)", background: "linear-gradient(180deg, rgba(15, 29, 46, 0.98), rgba(6, 10, 17, 0.98))", color: "#f5fbff", boxShadow: "0 28px 70px rgba(0,0,0,0.58)" };
const modalEyebrowStyle: CSSProperties = { color: "#aee6ff", fontSize: 11, fontWeight: 950 };
const modalTitleStyle: CSSProperties = { margin: "4px 0 10px", fontSize: 23, color: "#eef8ff" };
const modalTextStyle: CSSProperties = { margin: "0 0 14px", color: "rgba(245,251,255,0.88)", fontSize: 14, lineHeight: 1.75, fontWeight: 800 };
const hintBoxStyle: CSSProperties = { padding: 10, borderRadius: 12, border: "1px solid rgba(255,220,145,0.22)", background: "rgba(0,0,0,0.22)", color: "#ffe4ac", fontSize: 13, fontWeight: 900 };
const primaryButtonStyle: CSSProperties = { width: "100%", minHeight: 42, borderRadius: 12, border: "1px solid rgba(174,230,255,0.42)", background: "linear-gradient(180deg, #cfefff, #5c8ec8)", color: "#08111d", fontWeight: 950, cursor: "pointer" };
const closeButtonStyle: CSSProperties = { width: "100%", minHeight: 40, marginTop: 12, borderRadius: 12, border: "1px solid rgba(174,230,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#eef8ff", fontWeight: 950, cursor: "pointer" };
