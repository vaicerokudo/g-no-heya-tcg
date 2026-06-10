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
  { id: "rokudoHouse", label: "ROKUDOの家", subLabel: "物語", x: 47, y: 31, kind: "home" },
  { id: "souunHouse", label: "早雲の家", subLabel: "和弓", x: 19, y: 66, kind: "home" },
  { id: "nachaHouse", label: "那茶の家", subLabel: "逃げ足", x: 76, y: 65, kind: "home" },
  { id: "mijinWorkshop", label: "微塵の工房", subLabel: "技工", x: 53, y: 78, kind: "workshop" },
  { id: "bambooGrove", label: "竹林の奥", subLabel: "和弓探し", x: 80, y: 46, kind: "quest" },
  { id: "oldWell", label: "古井戸", subLabel: "核石", x: 48, y: 58, kind: "part", partId: "core_stone" },
  { id: "ninjaStorehouse", label: "忍具倉庫", subLabel: "音声", x: 31, y: 50, kind: "part", partId: "voice_unit" },
  { id: "watchtower", label: "見張り台", subLabel: "視線", x: 18, y: 23, kind: "part", partId: "eye_tracker" },
  { id: "brokenKarakuriBox", label: "からくり箱", subLabel: "しっぽ", x: 43, y: 67, kind: "part", partId: "tail_drive" },
  { id: "oldShrine", label: "古い祠", subLabel: "記憶", x: 79, y: 25, kind: "part", partId: "memory_gear" },
];

const PART_SPOT_TEXT: Record<Exclude<HotspotId, "rokudoHouse" | "souunHouse" | "nachaHouse" | "mijinWorkshop" | "bambooGrove">, string> = {
  oldWell: "井戸の底に、小さく光る石が沈んでいた。",
  ninjaStorehouse: "古い箱の中から、小さな発声装置のような部品を見つけた。",
  watchtower: "見張り台の片隅に、こちらを見返すような玉が置かれていた。",
  brokenKarakuriBox: "壊れたからくり箱の奥で、小さな駆動部がまだ動いていた。",
  oldShrine: "祠の奥に、古びた歯車が大切に納められていた。",
};

const PART_REACTION_TEXT: Record<RokuPartId, string> = {
  core_stone: "微塵：「いいぞ。それがロクの中核になる。」",
  voice_unit: "那茶：「これでしゃべるの？ ……うるさくならない？」",
  eye_tracker: "早雲：「見られてるみてぇで落ち着かねぇな。」",
  tail_drive: "那茶：「しっぽいる？ 本当にいる？」",
  memory_gear: "ROKUDO：「……これは、簡単に扱っていいものではなさそうですね。」",
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
            ここから、ROKUDOの物語は今も続いている。
            <br />
            <br />
            ROKUDO：
            <br />
            「ここは……少し、落ち着きますね。」
            <br />
            <br />
            ロク：
            <br />
            「外の記録へ接続できます。」
          </p>
          <button type="button" style={primaryButtonStyle} onClick={() => openExternalUrl(ROKUDO_YOUTUBE_URL)}>
            ロクドの記録を見る
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
              「おう、ROKUDO。やっと来たか。」
              <br />
              <br />
              ROKUDO：
              <br />
              「呼ばれてはいませんが。」
              <br />
              <br />
              早雲：
              <br />
              「細けぇこと言うな。兄貴分が困ってんだ。俺の和弓、どっか行っちまってよ。」
              <br />
              <br />
              ROKUDO：
              <br />
              「……それは、探してほしいという意味ですか。」
              <br />
              <br />
              早雲：
              <br />
              「察しがいいじゃねぇか。さすが俺の弟分だな。」
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
              「お、それだそれだ。やっぱ俺の弓は絵になるな。」
              <br />
              <br />
              ROKUDO：
              <br />
              「探したのはこちらですが。」
              <br />
              <br />
              早雲：
              <br />
              「しょうがねぇな。そこまで言うなら付き合ってやるよ。兄貴分だからな。」
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
          「で、次はどこ行くんだ？ 別に暇してたわけじゃねぇけど、付き合ってやるよ。」
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
          {justFound ? <div style={hintBoxStyle}>{PART_REACTION_TEXT[activeSpot.partId]}</div> : null}
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
              「……知らない人いる。やだああああ！」
              <br />
              <br />
              ROKUDO：
              <br />
              「待ってください。話を聞いてください。」
              <br />
              <br />
              那茶：
              <br />
              「聞いたら巻き込まれるやつでしょ！ そういうの、顔に出てるから！」
              <br />
              <br />
              ROKUDO：
              <br />
              「……一人では追いきれませんね。」
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
              那茶：
              <br />
              「やだああああ！ なんで早雲までいるの！」
              <br />
              <br />
              早雲：
              <br />
              「逃げ足だけは一人前だな、那茶。」
              <br />
              <br />
              那茶：
              <br />
              「うるさいなぁ！捕まっただけで負けたわけじゃないし！」
              <br />
              <br />
              ROKUDO：
              <br />
              「では、手伝ってくれるということで。」
              <br />
              <br />
              那茶：
              <br />
              「……ちょっとだけだからね。あと、変な道具作るなら僕のせいにしないでよ。」
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
          「まだ行くの？ ……まあ、ついていけないとは言ってないけど。」
        </p>
      );
    }

    if (activeSpot.id === "mijinWorkshop") {
      if (!progress.souunJoined || !progress.nachaJoined) {
        return (
          <p style={modalTextStyle}>
            微塵：
            <br />
            「おお、ROKUDOか。ちょうど変な道具を作っていたところだ。」
            <br />
            <br />
            ROKUDO：
            <br />
            「変な道具……ですか。」
            <br />
            <br />
            微塵：
            <br />
            「お前を後ろから支える、小さな相棒みたいなもんだ。だが、材料集めには人手がいる。」
            <br />
            <br />
            微塵：
            <br />
            「早雲と那茶も連れてこい。あいつらも、こういう時くらい役に立つだろ。」
          </p>
        );
      }

      if (!progress.mijinJoined) {
        return (
          <>
            <p style={modalTextStyle}>
              微塵：
              <br />
              「よし、面子はそろったな。」
              <br />
              <br />
              早雲：
              <br />
              「俺は巻き込まれただけだぞ。」
              <br />
              <br />
              那茶：
              <br />
              「僕も捕まっただけなんだけど。」
              <br />
              <br />
              微塵：
              <br />
              「つまり、ちょうどいい人手ってことだ。」
              <br />
              <br />
              ROKUDO：
              <br />
              「それで、何を作るんですか。」
              <br />
              <br />
              微塵：
              <br />
              「ロクだ。お前の後ろを見てくれる、小さな相棒を作る。」
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
              「よし、必要なもんは揃ったな。道具ってのは、持ち主に似るもんだ。」
              <br />
              <br />
              微塵：
              <br />
              「ロクはただの道具じゃない。ROKUDOの後ろを見るための相棒だ。」
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
              <br />
              <br />
              ROKUDO：
              <br />
              「……監視という言い方は、少し気になりますね。」
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
            「足りない部品がまだあるな。道具ってのは、最後の小さい部品ほど大事なんだ。」
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
          <span style={progressLeadStyle}>同行者</span>
          <span style={progressChipStyle}>早雲：{progress.souunJoined ? "同行中" : "未"}</span>
          <span style={progressChipStyle}>那茶：{progress.nachaJoined ? "同行中" : "未"}</span>
          <span style={progressChipStyle}>微塵：{progress.mijinJoined ? "参加" : "未"}</span>
          {progress.rokuPartsQuestStarted ? <strong style={progressAccentChipStyle}>ロク制作準備中</strong> : null}
          {progress.rokuPartsQuestStarted ? <span style={progressChipStyle}>パーツ：{progress.rokuPartsFound.length} / {ROKU_PART_IDS.length}</span> : null}
          {progress.rokuBuildReady ? <strong style={progressAccentChipStyle}>準備完了</strong> : null}
          {progress.rokuBuilt ? <strong style={progressAccentChipStyle}>ロク起動済み</strong> : null}
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
              <span style={hotspotStemStyle} />
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
const progressPanelStyle: CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8, padding: "7px 9px", borderRadius: 14, border: "1px solid rgba(174,230,255,0.13)", background: "rgba(4, 9, 16, 0.44)", color: "#dff5ff", fontSize: 11, fontWeight: 900, backdropFilter: "blur(3px)" };
const progressLeadStyle: CSSProperties = { color: "rgba(238,248,255,0.72)", fontWeight: 950, marginRight: 2 };
const progressChipStyle: CSSProperties = { padding: "3px 7px", borderRadius: 999, border: "1px solid rgba(174,230,255,0.12)", background: "rgba(255,255,255,0.045)" };
const progressAccentChipStyle: CSSProperties = { ...progressChipStyle, color: "#c8ffe9", border: "1px solid rgba(126,240,200,0.2)", background: "rgba(17,54,43,0.22)" };
const mapFrameStyle: CSSProperties = { position: "relative", minHeight: "clamp(430px, 74dvh, 820px)", overflow: "hidden", borderRadius: 18, border: "1px solid rgba(174,230,255,0.24)", backgroundImage: `linear-gradient(180deg, rgba(6, 10, 18, 0.08), rgba(6, 10, 18, 0.2)), url("${SHINOBI_VILLAGE_MAP_URL}")`, backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat", boxShadow: "0 24px 66px rgba(0,0,0,0.54), inset 0 0 90px rgba(0,0,0,0.25)" };
const moonStyle: CSSProperties = { position: "absolute", right: "10%", top: "10%", width: 76, height: 76, borderRadius: "50%", background: "radial-gradient(circle, rgba(235,247,255,0.42), rgba(148,193,230,0.12) 58%, transparent 68%)", boxShadow: "0 0 34px rgba(174,230,255,0.14)", pointerEvents: "none", opacity: 0.42 };
const pathStyle: CSSProperties = { position: "absolute", left: "20%", right: "18%", top: "57%", height: "22%", borderRadius: "50%", borderTop: "1px dashed rgba(230,242,255,0.16)", transform: "rotate(1deg)", pointerEvents: "none", filter: "drop-shadow(0 0 5px rgba(210,232,255,0.08))" };
const hotspotStyle: CSSProperties = { position: "absolute", transform: "translate(-50%, -50%)", minWidth: 92, minHeight: 40, padding: "5px 8px 5px 23px", borderRadius: 999, border: "1px solid rgba(224,244,255,0.24)", background: "linear-gradient(180deg, rgba(5, 14, 22, 0.46), rgba(3, 8, 14, 0.34))", color: "#f5fbff", display: "grid", gap: 0, textAlign: "left", cursor: "pointer", boxShadow: "0 8px 18px rgba(0,0,0,0.22), 0 0 10px rgba(94,167,255,0.08)", touchAction: "manipulation", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" };
const questHotspotStyle: CSSProperties = { borderColor: "rgba(255,220,145,0.32)", background: "linear-gradient(180deg, rgba(49, 38, 17, 0.48), rgba(10, 8, 6, 0.34))" };
const workshopHotspotStyle: CSSProperties = { borderColor: "rgba(183,158,255,0.34)", background: "linear-gradient(180deg, rgba(28, 21, 50, 0.5), rgba(8, 7, 13, 0.36))" };
const partHotspotStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.3)", background: "linear-gradient(180deg, rgba(11, 44, 34, 0.48), rgba(4, 14, 12, 0.34))" };
const hotspotStemStyle: CSSProperties = { position: "absolute", left: 12, top: 29, width: 1, height: 15, background: "linear-gradient(180deg, rgba(223,245,255,0.36), transparent)", boxShadow: "0 0 7px rgba(223,245,255,0.16)", pointerEvents: "none" };
const hotspotPinStyle: CSSProperties = { position: "absolute", left: 8, top: 11, width: 10, height: 10, borderRadius: "50%", background: "#dff5ff", boxShadow: "0 0 0 3px rgba(174,230,255,0.1), 0 0 12px rgba(174,230,255,0.44), 0 7px 12px rgba(0,0,0,0.26)" };
const hotspotLabelStyle: CSSProperties = { fontSize: "clamp(10px, 1.25vw, 12px)", fontWeight: 950, lineHeight: 1.1, letterSpacing: 0 };
const hotspotSubLabelStyle: CSSProperties = { color: "rgba(238,248,255,0.62)", fontSize: "clamp(9px, 1vw, 10px)", fontWeight: 800, lineHeight: 1.15 };
const rokuBuiltMarkerStyle: CSSProperties = { position: "absolute", left: "60%", top: "70%", transform: "translate(-50%, -50%)", minWidth: 76, minHeight: 34, padding: "5px 8px 5px 24px", borderRadius: 999, border: "1px solid rgba(126,240,200,0.3)", background: "linear-gradient(180deg, rgba(12, 46, 35, 0.46), rgba(6, 16, 13, 0.34))", color: "#e6fff4", display: "grid", gap: 0, fontSize: 10, fontWeight: 950, boxShadow: "0 8px 18px rgba(0,0,0,0.22), 0 0 12px rgba(126,240,200,0.14)", pointerEvents: "none", backdropFilter: "blur(4px)" };
const rokuBuiltDotStyle: CSSProperties = { position: "absolute", left: 8, top: 11, width: 9, height: 9, borderRadius: "50%", background: "#9dffd6", boxShadow: "0 0 0 3px rgba(126,240,200,0.1), 0 0 14px rgba(126,240,200,0.5)" };
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
