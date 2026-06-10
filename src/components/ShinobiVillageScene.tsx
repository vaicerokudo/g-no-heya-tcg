import { useMemo, useState, type CSSProperties } from "react";
import {
  ROKU_PART_IDS,
  ROKU_PART_LABELS,
  readShinobiVillageProgress,
  updateShinobiVillageProgress,
  type RokuPartId,
  type ShinobiVillageProgress,
} from "../game/shinobi/progress";

type ShinobiVillageSceneProps = {
  onReturnTown: () => void;
};

type HotspotId =
  | "rokudoHouse"
  | "souunHouse"
  | "nachaHouse"
  | "mijinWorkshop"
  | "bambooGrove"
  | "oldWell"
  | "ninjaStorehouse"
  | "watchtower"
  | "brokenKarakuriBox"
  | "oldShrine";

type Hotspot = {
  id: HotspotId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  kind: "home" | "quest" | "workshop" | "part";
  partId?: RokuPartId;
};

const ROKUDO_YOUTUBE_URL = "https://www.youtube.com/@vaicerokudo";
const SHINOBI_VILLAGE_MAP_URL = "/backgrounds/shinobi-village-map.png";

const CHARACTER_VISUALS: Partial<Record<HotspotId, { name: string; imagePath: string; tone: string }>> = {
  rokudoHouse: { name: "ROKUDO", imagePath: "/portraits/south/default/base/rokudo.png", tone: "静かな忍具の気配" },
  souunHouse: { name: "早雲", imagePath: "/ui/shinobi/souun.png", tone: "偉そうで、少し構ってほしそうな兄貴分" },
  nachaHouse: { name: "那茶", imagePath: "/ui/shinobi/nacha.png", tone: "人見知りだが、煽る時は煽る弟分" },
  mijinWorkshop: { name: "微塵", imagePath: "/ui/shinobi/mijin.png", tone: "ロクを作る、頼れるふとっちょ技工士" },
};

const HOTSPOTS: Hotspot[] = [
  { id: "rokudoHouse", label: "ROKUDOの家", subLabel: "物語の始まり", x: 48, y: 28, kind: "home" },
  { id: "souunHouse", label: "早雲の家", subLabel: "和弓使い", x: 20, y: 63, kind: "home" },
  { id: "nachaHouse", label: "那茶の家", subLabel: "逃げ足注意", x: 74, y: 62, kind: "home" },
  { id: "mijinWorkshop", label: "微塵の工房", subLabel: "技工士", x: 52, y: 75, kind: "workshop" },
  { id: "bambooGrove", label: "竹林の奥", subLabel: "和弓探し", x: 78, y: 43, kind: "quest" },
  { id: "oldWell", label: "古井戸", subLabel: "小さな核石", x: 49, y: 56, kind: "part", partId: "core_stone" },
  { id: "ninjaStorehouse", label: "忍具倉庫", subLabel: "音声からくり", x: 33, y: 48, kind: "part", partId: "voice_unit" },
  { id: "watchtower", label: "見張り台", subLabel: "視線追尾の玉", x: 19, y: 20, kind: "part", partId: "eye_tracker" },
  { id: "brokenKarakuriBox", label: "壊れたからくり箱", subLabel: "しっぽ駆動部", x: 44, y: 64, kind: "part", partId: "tail_drive" },
  { id: "oldShrine", label: "古い祠", subLabel: "記憶の歯車", x: 78, y: 23, kind: "part", partId: "memory_gear" },
];

const PART_SPOT_TEXT: Record<Exclude<HotspotId, "rokudoHouse" | "souunHouse" | "nachaHouse" | "mijinWorkshop" | "bambooGrove">, string> = {
  oldWell: "井戸の底に、小さく光る石が沈んでいた。",
  ninjaStorehouse: "古い忍具の棚に、小さな音声からくりが残されていた。",
  watchtower: "見張り台の梁に、視線を追うように揺れる玉が吊られていた。",
  brokenKarakuriBox: "壊れたからくり箱の中に、しっぽを動かす小さな駆動部が残っていた。",
  oldShrine: "古い祠の奥で、記憶を刻む歯車が静かに回っていた。",
};

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ShinobiVillageScene({ onReturnTown }: ShinobiVillageSceneProps) {
  const [progress, setProgress] = useState<ShinobiVillageProgress>(() => readShinobiVillageProgress());
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const [recentPartFound, setRecentPartFound] = useState<RokuPartId | null>(null);
  const [showRokuAssemblyEvent, setShowRokuAssemblyEvent] = useState(false);
  const activeSpot = useMemo(() => HOTSPOTS.find((spot) => spot.id === activeHotspot) ?? null, [activeHotspot]);
  const foundParts = useMemo(() => new Set(progress.rokuPartsFound), [progress.rokuPartsFound]);
  const allRokuPartsFound = ROKU_PART_IDS.every((partId) => foundParts.has(partId));
  const visibleHotspots = useMemo(
    () => HOTSPOTS.filter((spot) => spot.kind !== "part" || progress.rokuPartsQuestStarted),
    [progress.rokuPartsQuestStarted]
  );

  const updateProgress = (updater: (current: ShinobiVillageProgress) => ShinobiVillageProgress) => {
    setProgress(updateShinobiVillageProgress(updater));
  };

  const handleHotspot = (spotId: HotspotId) => {
    setActiveHotspot(spotId);
    setShowRokuAssemblyEvent(false);
    const spot = HOTSPOTS.find((item) => item.id === spotId);
    if (spot?.kind === "part" && spot.partId && !progress.rokuPartsFound.includes(spot.partId)) {
      setRecentPartFound(spot.partId);
      collectRokuPart(spot.partId);
    } else {
      setRecentPartFound(null);
    }
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

  const collectRokuPart = (partId: RokuPartId) => {
    updateProgress((current) => ({
      ...current,
      rokuPartsFound: current.rokuPartsFound.includes(partId)
        ? current.rokuPartsFound
        : [...current.rokuPartsFound, partId],
    }));
  };

  const markRokuBuildReady = () => {
    updateProgress((current) => ({ ...current, rokuBuildReady: true }));
  };

  const assembleRoku = () => {
    updateProgress((current) => ({ ...current, rokuBuilt: true }));
    setShowRokuAssemblyEvent(true);
  };

  const closeModal = () => {
    setActiveHotspot(null);
    setShowRokuAssemblyEvent(false);
    setRecentPartFound(null);
  };

  const renderCharacterPanel = () => {
    if (!activeSpot) return null;
    const visual = CHARACTER_VISUALS[activeSpot.id];
    if (!visual) return null;
    return (
      <div style={characterPanelStyle}>
        <div style={characterImageFrameStyle}>
          <img src={visual.imagePath} alt={visual.name} style={characterImageStyle} loading="lazy" />
        </div>
        <div style={characterInfoStyle}>
          <div style={characterNameStyle}>{visual.name}</div>
          <div style={characterToneStyle}>{visual.tone}</div>
        </div>
      </div>
    );
  };

  const renderRokuBlueprint = () => {
    if (!progress.rokuPartsQuestStarted) return null;
    return (
      <div style={blueprintStyle}>
        <div style={blueprintTitleStyle}>ロク制作メモ</div>
        <div style={blueprintGridStyle}>
          {ROKU_PART_IDS.map((partId) => {
            const found = foundParts.has(partId);
            return (
              <span key={partId} style={blueprintPartStyle(found)}>
                {found ? "✓" : "□"} {ROKU_PART_LABELS[partId]}
              </span>
            );
          })}
        </div>
        <div style={blueprintStatusStyle}>
          {progress.rokuBuilt
            ? "ロク起動済み"
            : progress.rokuBuildReady
            ? "ロク制作準備完了"
            : allRokuPartsFound
              ? "必要なパーツが揃った。微塵に見せよう。"
              : `完成度：${progress.rokuPartsFound.length} / ${ROKU_PART_IDS.length}`}
        </div>
      </div>
    );
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

    if (activeSpot.kind === "part" && activeSpot.partId) {
      const found = foundParts.has(activeSpot.partId);
      const justFound = recentPartFound === activeSpot.partId;
      const partSpotId = activeSpot.id as keyof typeof PART_SPOT_TEXT;
      return (
        <>
          <p style={modalTextStyle}>
            {found && !justFound ? "ここではもう必要なものを見つけている。" : PART_SPOT_TEXT[partSpotId]}
            {justFound ? (
              <>
                <br />
                {ROKU_PART_LABELS[activeSpot.partId]}を入手した。
              </>
            ) : null}
          </p>
          {justFound ? <div style={hintBoxStyle}>微塵：「いいぞ、それは中核に使える。」</div> : null}
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

      if (allRokuPartsFound && !progress.rokuBuildReady) {
        return (
          <>
            {renderRokuBlueprint()}
            <p style={modalTextStyle}>
              微塵：
              <br />
              「よし、必要なもんは揃ったな。あとは組み上げるだけだ。」
            </p>
            <button type="button" style={primaryButtonStyle} onClick={markRokuBuildReady}>
              ロク制作準備を完了する
            </button>
          </>
        );
      }

      if (showRokuAssemblyEvent && progress.rokuBuilt) {
        return (
          <>
            {renderRokuBlueprint()}
            <p style={modalTextStyle}>
              微塵：
              <br />
              「よし、必要なもんは揃った。あとは、こいつを組み上げるだけだ。」
              <br />
              <br />
              早雲：
              <br />
              「本当に動くのか、それ。」
              <br />
              <br />
              那茶：
              <br />
              「動いたら動いたで、ちょっと怖いんだけど。」
              <br />
              <br />
              ROKUDO：
              <br />
              「……ロク。」
              <br />
              <br />
              微塵：
              <br />
              「名前、決まってるじゃねぇか。」
              <br />
              <br />
              ロク：
              <br />
              「……起動確認。ROKUDO、補助対象として登録します。」
              <br />
              <br />
              ROKUDO：
              <br />
              「補助対象……ですか。」
              <br />
              <br />
              ロク：
              <br />
              「大丈夫？ の前に、あなたが大丈夫か確認します。」
              <br />
              <br />
              ROKUDO：
              <br />
              「……それは、少し困りますね。」
            </p>
          </>
        );
      }

      if (progress.rokuBuilt) {
        return (
          <>
            {renderRokuBlueprint()}
            <p style={modalTextStyle}>
              ロク完成
              <br />
              <br />
              微塵：
              <br />
              「調整はまだ必要だが、起動は成功だ。こいつは、ROKUDOの後ろをちゃんと見てくれる。」
              <br />
              <br />
              ロク：
              <br />
              「待機中。ROKUDOの状態を監視しています。」
            </p>
          </>
        );
      }

      if (progress.rokuBuildReady) {
        return (
          <>
            {renderRokuBlueprint()}
            <p style={modalTextStyle}>
              微塵：
              <br />
              「準備は整った。あとは組み上げるだけだな。」
            </p>
            <button type="button" style={primaryButtonStyle} onClick={assembleRoku}>
              ロクを組み上げる
            </button>
          </>
        );
      }

      return (
        <>
          {renderRokuBlueprint()}
          <p style={modalTextStyle}>
            微塵：
            <br />
            {progress.rokuBuildReady
              ? "「準備は整った。あとは組み上げるだけだな。」"
              : "「ロク制作の準備中だ。次はパーツ探しだな。」"}
          </p>
        </>
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
          {progress.rokuPartsQuestStarted ? <span>パーツ：{progress.rokuPartsFound.length} / {ROKU_PART_IDS.length}</span> : null}
          {progress.rokuBuildReady ? <strong>準備完了</strong> : null}
          {progress.rokuBuilt ? <strong>ロク起動済み</strong> : null}
        </section>

        <main style={mapFrameStyle}>
          <div style={moonStyle} />
          <div style={pathStyle} />
          {visibleHotspots.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleHotspot(spot.id)}
              style={{
                ...hotspotStyle,
                ...(spot.kind === "quest" ? questHotspotStyle : null),
                ...(spot.kind === "workshop" ? workshopHotspotStyle : null),
                ...(spot.kind === "part" ? partHotspotStyle : null),
                left: `${spot.x}%`,
                top: `${spot.y}%`,
              }}
            >
              <span style={hotspotPinStyle} />
              <span style={hotspotLabelStyle}>{spot.label}</span>
              <span style={hotspotSubLabelStyle}>{spot.subLabel}</span>
            </button>
          ))}
          {progress.rokuBuilt ? (
            <div style={rokuBuiltMarkerStyle}>
              <span style={rokuBuiltDotStyle} />
              <strong>ロク</strong>
              <span>起動済み</span>
            </div>
          ) : null}
        </main>

        {activeSpot ? (
          <div style={modalOverlayStyle} onClick={closeModal}>
            <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
              <div style={modalEyebrowStyle}>忍びの里</div>
              <h2 style={modalTitleStyle}>{activeSpot.label}</h2>
              {renderCharacterPanel()}
              {renderModalBody()}
              <button type="button" style={closeButtonStyle} onClick={closeModal}>
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

const shellStyle: CSSProperties = { width: "min(1180px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 10 };
const eyebrowStyle: CSSProperties = { color: "#aee6ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", fontSize: 30, color: "#eef8ff", textShadow: "0 0 18px rgba(94,167,255,0.26)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(238,248,255,0.74)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 40, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(174,230,255,0.28)", background: "rgba(255,255,255,0.08)", color: "#eef8ff", fontWeight: 950, cursor: "pointer" };
const progressPanelStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10, padding: "9px 11px", borderRadius: 14, border: "1px solid rgba(174,230,255,0.18)", background: "rgba(4, 9, 16, 0.66)", color: "#dff5ff", fontSize: 12, fontWeight: 950 };
const mapFrameStyle: CSSProperties = { position: "relative", minHeight: "clamp(430px, 74dvh, 820px)", overflow: "hidden", borderRadius: 18, border: "1px solid rgba(174,230,255,0.24)", backgroundImage: `linear-gradient(180deg, rgba(6, 10, 18, 0.08), rgba(6, 10, 18, 0.2)), url("${SHINOBI_VILLAGE_MAP_URL}")`, backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", boxShadow: "0 24px 66px rgba(0,0,0,0.54), inset 0 0 90px rgba(0,0,0,0.25)" };
const moonStyle: CSSProperties = { position: "absolute", right: "10%", top: "10%", width: 76, height: 76, borderRadius: "50%", background: "radial-gradient(circle, rgba(235,247,255,0.42), rgba(148,193,230,0.12) 58%, transparent 68%)", boxShadow: "0 0 34px rgba(174,230,255,0.14)", pointerEvents: "none", opacity: 0.42 };
const pathStyle: CSSProperties = { position: "absolute", left: "18%", right: "18%", top: "54%", height: "26%", borderRadius: "50%", borderTop: "2px dashed rgba(210,232,255,0.2)", transform: "rotate(2deg)", pointerEvents: "none" };
const hotspotStyle: CSSProperties = { position: "absolute", transform: "translate(-50%, -50%)", minWidth: 112, minHeight: 48, padding: "7px 9px 7px 26px", borderRadius: 13, border: "1px solid rgba(174,230,255,0.34)", background: "linear-gradient(180deg, rgba(16, 35, 54, 0.78), rgba(6, 11, 18, 0.72))", color: "#f5fbff", display: "grid", gap: 1, textAlign: "left", cursor: "pointer", boxShadow: "0 12px 26px rgba(0,0,0,0.32), 0 0 16px rgba(94,167,255,0.1)", touchAction: "manipulation", backdropFilter: "blur(2px)" };
const questHotspotStyle: CSSProperties = { borderColor: "rgba(255,220,145,0.46)", background: "linear-gradient(180deg, rgba(56, 42, 18, 0.9), rgba(16, 12, 8, 0.84))" };
const workshopHotspotStyle: CSSProperties = { borderColor: "rgba(183,158,255,0.46)", background: "linear-gradient(180deg, rgba(35, 27, 62, 0.9), rgba(10, 9, 18, 0.84))" };
const partHotspotStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.42)", background: "linear-gradient(180deg, rgba(17, 54, 43, 0.9), rgba(7, 18, 16, 0.84))" };
const hotspotPinStyle: CSSProperties = { position: "absolute", left: 10, top: 14, width: 9, height: 9, borderRadius: "50%", background: "#dff5ff", boxShadow: "0 0 0 4px rgba(174,230,255,0.12), 0 0 16px rgba(174,230,255,0.64)" };
const hotspotLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 950, lineHeight: 1.15 };
const hotspotSubLabelStyle: CSSProperties = { color: "rgba(238,248,255,0.72)", fontSize: 11, fontWeight: 850, lineHeight: 1.2 };
const rokuBuiltMarkerStyle: CSSProperties = { position: "absolute", left: "63%", top: "62%", transform: "translate(-50%, -50%)", minWidth: 96, minHeight: 42, padding: "7px 10px 7px 27px", borderRadius: 999, border: "1px solid rgba(126,240,200,0.46)", background: "linear-gradient(180deg, rgba(18, 62, 48, 0.92), rgba(8, 20, 17, 0.88))", color: "#e6fff4", display: "grid", gap: 0, fontSize: 11, fontWeight: 950, boxShadow: "0 12px 28px rgba(0,0,0,0.36), 0 0 18px rgba(126,240,200,0.18)", pointerEvents: "none" };
const rokuBuiltDotStyle: CSSProperties = { position: "absolute", left: 10, top: 15, width: 9, height: 9, borderRadius: "50%", background: "#9dffd6", boxShadow: "0 0 0 4px rgba(126,240,200,0.13), 0 0 18px rgba(126,240,200,0.7)" };
const modalOverlayStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 14, boxSizing: "border-box", background: "rgba(2, 5, 10, 0.68)", backdropFilter: "blur(3px)" };
const modalStyle: CSSProperties = { width: "min(620px, 100%)", maxHeight: "min(84dvh, 680px)", overflowY: "auto", padding: 18, boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(174,230,255,0.3)", background: "linear-gradient(180deg, rgba(15, 29, 46, 0.98), rgba(6, 10, 17, 0.98))", color: "#f5fbff", boxShadow: "0 28px 70px rgba(0,0,0,0.58)" };
const modalEyebrowStyle: CSSProperties = { color: "#aee6ff", fontSize: 11, fontWeight: 950 };
const modalTitleStyle: CSSProperties = { margin: "4px 0 10px", fontSize: 23, color: "#eef8ff" };
const characterPanelStyle: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(96px, 130px) 1fr", gap: 12, alignItems: "center", marginBottom: 14, padding: 10, borderRadius: 15, border: "1px solid rgba(174,230,255,0.2)", background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))" };
const characterImageFrameStyle: CSSProperties = { height: 132, borderRadius: 13, overflow: "hidden", border: "1px solid rgba(174,230,255,0.22)", background: "radial-gradient(circle at 50% 20%, rgba(174,230,255,0.12), rgba(0,0,0,0.28))", boxShadow: "0 14px 34px rgba(0,0,0,0.32)" };
const characterImageStyle: CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" };
const characterInfoStyle: CSSProperties = { display: "grid", gap: 5 };
const characterNameStyle: CSSProperties = { color: "#eef8ff", fontSize: 18, fontWeight: 950 };
const characterToneStyle: CSSProperties = { color: "rgba(245,251,255,0.72)", fontSize: 12, fontWeight: 850, lineHeight: 1.5 };
const modalTextStyle: CSSProperties = { margin: "0 0 14px", color: "rgba(245,251,255,0.88)", fontSize: 14, lineHeight: 1.75, fontWeight: 800 };
const hintBoxStyle: CSSProperties = { padding: 10, borderRadius: 12, border: "1px solid rgba(255,220,145,0.22)", background: "rgba(0,0,0,0.22)", color: "#ffe4ac", fontSize: 13, fontWeight: 900 };
const blueprintStyle: CSSProperties = { display: "grid", gap: 8, marginBottom: 14, padding: 12, borderRadius: 14, border: "1px solid rgba(126,240,200,0.24)", background: "rgba(0,0,0,0.24)" };
const blueprintTitleStyle: CSSProperties = { color: "#c8ffe9", fontSize: 14, fontWeight: 950 };
const blueprintGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 7 };
function blueprintPartStyle(found: boolean): CSSProperties {
  return {
    padding: "7px 9px",
    borderRadius: 10,
    border: found ? "1px solid rgba(126,240,200,0.42)" : "1px solid rgba(174,230,255,0.14)",
    background: found ? "rgba(35, 116, 86, 0.26)" : "rgba(255,255,255,0.05)",
    color: found ? "#dfffea" : "rgba(245,251,255,0.66)",
    fontSize: 12,
    fontWeight: 950,
  };
}
const blueprintStatusStyle: CSSProperties = { color: "#ffe4ac", fontSize: 12, fontWeight: 950 };
const primaryButtonStyle: CSSProperties = { width: "100%", minHeight: 42, borderRadius: 12, border: "1px solid rgba(174,230,255,0.42)", background: "linear-gradient(180deg, #cfefff, #5c8ec8)", color: "#08111d", fontWeight: 950, cursor: "pointer" };
const closeButtonStyle: CSSProperties = { width: "100%", minHeight: 40, marginTop: 12, borderRadius: 12, border: "1px solid rgba(174,230,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#eef8ff", fontWeight: 950, cursor: "pointer" };
