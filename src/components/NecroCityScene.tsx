import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import rokuSpriteSheet from "../assets/pets/roku/spritesheet.webp";
import {
  addBlackNoiseBayEventFlag,
  addShipPart,
  readShipProgress,
  readNecroCityProgress,
  SHIP_PART_IDS,
  SHIP_PART_LABELS,
  unlockNextNecroCitySpot,
  type BlackNoiseBayEventFlag,
  type NecroCityProgress,
  type NecroCitySpotId,
  type ShipPartId,
} from "../game/blackNoiseBay/progress";

type NecroCitySceneProps = {
  onReturnContinent: () => void;
};

type DistrictId = "entrance" | "plaza" | "market" | "clock" | "waterfront" | "residential" | "shipyard";
type ActionId =
  | "returnContinent"
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
type MapPos = { x: number; y: number };
type Facing = "left" | "right";
type SpriteState = "idle" | "running-left" | "running-right";

type District = {
  id: DistrictId;
  label: string;
  subLabel: string;
  backgroundUrl: string;
};

type NecroCityHotspot = {
  id: NecroCitySpotId;
  districtId: DistrictId;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  rokuX?: number;
  rokuY?: number;
  kind: "back" | "guide" | "search" | "hint" | "build";
};

type RouteSegment = {
  from: NecroCitySpotId;
  to: NecroCitySpotId;
  branch?: boolean;
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

const ROKU_PLAYER_SIZE = 32;
const ROKU_MOVE_MS = 620;
const SPRITE_CELL_WIDTH = 192;
const SPRITE_CELL_HEIGHT = 208;
const ROKU_SPRITE_SCALE = ROKU_PLAYER_SIZE / SPRITE_CELL_WIDTH;
const SPRITE_ANIMS: Record<SpriteState, { row: number; frames: number; intervalMs: number }> = {
  idle: { row: 0, frames: 6, intervalMs: 190 },
  "running-right": { row: 1, frames: 8, intervalMs: 105 },
  "running-left": { row: 2, frames: 8, intervalMs: 105 },
};

const DISTRICTS: District[] = [
  { id: "entrance", label: "入口", subLabel: "大陸MAPへ戻る", backgroundUrl: "/backgrounds/necro-city/entrance.png" },
  { id: "plaza", label: "中央広場", subLabel: "クロイツに相談", backgroundUrl: "/backgrounds/necro-city/central-plaza.png" },
  { id: "market", label: "港湾市場区", subLabel: "帆布の手がかり", backgroundUrl: "/backgrounds/necro-city/harbor-market.png" },
  { id: "clock", label: "時計塔周辺", subLabel: "舵輪と羅針盤", backgroundUrl: "/backgrounds/necro-city/clocktower-area.png" },
  { id: "waterfront", label: "水辺区画", subLabel: "倉庫と灯台", backgroundUrl: "/backgrounds/necro-city/waterfront-area.png" },
  { id: "residential", label: "市街跡", subLabel: "記録と手記", backgroundUrl: "/backgrounds/necro-city/residential-ruins.png" },
  { id: "shipyard", label: "造船区", subLabel: "補強材と造船", backgroundUrl: "/backgrounds/necro-city/shipyard-area.png" },
];

const NECRO_CITY_HOTSPOTS: NecroCityHotspot[] = [
  { id: "entrance", districtId: "entrance", label: "入口", subLabel: "廃都の門", x: 50, y: 91, rokuX: 50, rokuY: 88, kind: "back" },
  { id: "plaza", districtId: "plaza", label: "中央広場", subLabel: "クロイツ", x: 50, y: 57, rokuX: 50, rokuY: 61, kind: "guide" },
  { id: "market", districtId: "market", label: "港湾市場", subLabel: "廃市場 / 旧酒場", x: 39, y: 66, rokuX: 37, rokuY: 70, kind: "search" },
  { id: "clock", districtId: "clock", label: "時計塔", subLabel: "崩れた塔", x: 25, y: 24, rokuX: 29, rokuY: 30, kind: "search" },
  { id: "waterfront", districtId: "waterfront", label: "水辺倉庫", subLabel: "水没区画", x: 26, y: 76, rokuX: 29, rokuY: 80, kind: "search" },
  { id: "lighthouse", districtId: "waterfront", label: "灯台跡", subLabel: "航海灯", x: 80, y: 24, rokuX: 77, rokuY: 30, kind: "search" },
  { id: "residential", districtId: "residential", label: "市街跡", subLabel: "記録と手記", x: 40, y: 42, rokuX: 42, rokuY: 47, kind: "hint" },
  { id: "oldShipyard", districtId: "shipyard", label: "旧造船区", subLabel: "補強材", x: 68, y: 39, rokuX: 66, rokuY: 44, kind: "search" },
  { id: "shipyard", districtId: "shipyard", label: "造船所", subLabel: "船を作る", x: 79, y: 33, rokuX: 82, rokuY: 39, kind: "build" },
];

const NECRO_CITY_ROUTE_SEGMENTS: RouteSegment[] = [
  { from: "entrance", to: "plaza" },
  { from: "plaza", to: "market" },
  { from: "plaza", to: "residential" },
  { from: "residential", to: "clock" },
  { from: "plaza", to: "waterfront", branch: true },
  { from: "plaza", to: "oldShipyard" },
  { from: "oldShipyard", to: "shipyard" },
  { from: "shipyard", to: "lighthouse" },
  { from: "waterfront", to: "market", branch: true },
];

const NECRO_CITY_SPOT_LABELS: Record<NecroCitySpotId, string> = {
  entrance: "入口",
  plaza: "中央広場",
  market: "港湾市場",
  residential: "市街跡",
  clock: "時計塔",
  waterfront: "水辺倉庫",
  oldShipyard: "旧造船区",
  lighthouse: "灯台跡",
  shipyard: "造船所",
};

const DISTRICT_ACTIONS: Record<DistrictId, DistrictAction[]> = {
  entrance: [{ id: "returnContinent", label: "大陸MAPへ戻る", subLabel: "廃都の入口から外へ出る" }],
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

function getNextMissingPart(partsSet: Set<ShipPartId>) {
  return SHIP_PART_IDS.find((partId) => !partsSet.has(partId)) ?? null;
}

function getKruitzStageHint(
  progress: NecroCityProgress,
  partsSet: Set<ShipPartId>,
  shipBuilt: boolean,
  unlockedSpotId: NecroCitySpotId | null
) {
  if (shipBuilt) return "船は完成しているにゃ。湾へ戻るにゃ。";
  if (unlockedSpotId) return `思い出したにゃ。次は${NECRO_CITY_SPOT_LABELS[unlockedSpotId]}を調べるにゃ。`;
  if (SHIP_PART_IDS.every((partId) => partsSet.has(partId))) return "部材は揃ったにゃ。造船所へ行くにゃ。";
  if (progress.unlockedSpotIds.length <= 2) return "この街、まだ少しだけ覚えてるにゃ。まずは港湾市場を思い出すにゃ。";
  return "もう行ける場所は思い出したにゃ。あとは部材を揃えて造船所へ行くにゃ。";
}

export function NecroCityScene({ onReturnContinent }: NecroCitySceneProps) {
  const [progress, setProgress] = useState(() => readShipProgress());
  const [necroProgress, setNecroProgress] = useState<NecroCityProgress>(() => readNecroCityProgress(readShipProgress()));
  const [activeDistrict, setActiveDistrict] = useState<DistrictId>("entrance");
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isKruitzModalOpen, setIsKruitzModalOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => (typeof window === "undefined" ? false : window.innerWidth < 820));
  const [rokuPos, setRokuPos] = useState<MapPos>({ x: 50, y: 88 });
  const [facing, setFacing] = useState<Facing>("right");
  const [isMoving, setIsMoving] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [message, setMessage] = useState<DetailMessage>({
    title: "入口",
    lines: ["霧の向こうに、廃都ネクロシティが沈んでいる。", "背景の地点を選ぶと、ロクがその場所へ向かいます。"],
  });
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const moveTimerRef = useRef<number | null>(null);

  const partsSet = useMemo(() => new Set(progress.parts), [progress.parts]);
  const flags = progress.flags;
  const allPartsReady = SHIP_PART_IDS.every((partId) => partsSet.has(partId));
  const shipBuilt = flags.includes("ship_built") || flags.includes("black_noise_bay_ship_ready");
  const activeDistrictConfig = DISTRICTS.find((district) => district.id === activeDistrict) ?? DISTRICTS[1];

  useEffect(() => {
    const refresh = () => {
      const nextShipProgress = readShipProgress();
      setProgress(nextShipProgress);
      setNecroProgress(readNecroCityProgress(nextShipProgress));
    };
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

  const spriteState: SpriteState = isMoving
    ? facing === "left"
      ? "running-left"
      : "running-right"
    : "idle";
  const spriteAnim = SPRITE_ANIMS[spriteState];

  useEffect(() => {
    setFrameIndex(0);
    const timerId = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % spriteAnim.frames);
    }, spriteAnim.intervalMs);

    return () => window.clearInterval(timerId);
  }, [spriteAnim.frames, spriteAnim.intervalMs, spriteState]);

  useEffect(() => {
    return () => {
      if (moveTimerRef.current !== null) {
        window.clearTimeout(moveTimerRef.current);
      }
    };
  }, []);

  const refreshProgress = () => {
    const nextShipProgress = readShipProgress();
    setProgress(nextShipProgress);
    setNecroProgress(readNecroCityProgress(nextShipProgress));
  };

  const collectPart = (partId: ShipPartId) => {
    if (partsSet.has(partId)) return false;
    setProgress(addShipPart(partId));
    setNecroProgress(readNecroCityProgress());
    return true;
  };

  const markFlag = (flag: BlackNoiseBayEventFlag) => {
    if (flags.includes(flag)) return false;
    setProgress(addBlackNoiseBayEventFlag(flag));
    setNecroProgress(readNecroCityProgress());
    return true;
  };

  const selectDistrict = (district: District) => {
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

  const selectHotspot = (hotspot: NecroCityHotspot) => {
    const district = DISTRICTS.find((item) => item.id === hotspot.districtId);
    if (!district) return;
    if (isMoving) return;

    const nextPos = { x: hotspot.rokuX ?? hotspot.x, y: hotspot.rokuY ?? hotspot.y };
    setActiveDistrict(district.id);
    setIsAreaModalOpen(false);
    setIsKruitzModalOpen(false);
    setUnlockNotice(null);
    setFacing(nextPos.x < rokuPos.x ? "left" : "right");
    setIsMoving(true);
    setRokuPos(nextPos);

    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
    }
    moveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveTimerRef.current = null;
      selectDistrict(district);
    }, ROKU_MOVE_MS);
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
    const nextShipProgress = addBlackNoiseBayEventFlag("black_noise_bay_ship_ready");
    setProgress(nextShipProgress);
    setNecroProgress(readNecroCityProgress(nextShipProgress));
    setMessage({
      title: "造船所",
      lines: ["船が組み上がった。", "これでブラックノイズ湾の中心へ向かえる。"],
      tone: "complete",
    });
  };

  const runAction = (action: DistrictAction) => {
    if (action.id === "returnContinent") {
      onReturnContinent();
      return;
    }

    if (action.id === "consultKruitz") {
      const result = unlockNextNecroCitySpot(progress);
      setNecroProgress(result.progress);
      setUnlockNotice(result.unlockedSpotId ? `新しい探索地点：${NECRO_CITY_SPOT_LABELS[result.unlockedSpotId]}` : null);
      setMessage({
        title: "クロイツの記憶",
        lines: [getKruitzStageHint(result.progress, partsSet, shipBuilt, result.unlockedSpotId)],
        tone: result.unlockedSpotId ? "success" : "hint",
      });
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
    DISTRICT_ACTIONS[activeDistrict];
  const kruitzExpression = getKruitzExpression(isKruitzModalOpen);
  const unlockedSpotSet = useMemo(() => new Set(necroProgress.unlockedSpotIds), [necroProgress.unlockedSpotIds]);
  const visibleHotspots = useMemo(
    () => NECRO_CITY_HOTSPOTS.filter((hotspot) => unlockedSpotSet.has(hotspot.id)),
    [unlockedSpotSet]
  );
  const visibleRouteSegments = useMemo(
    () => NECRO_CITY_ROUTE_SEGMENTS.filter((segment) => unlockedSpotSet.has(segment.from) && unlockedSpotSet.has(segment.to)),
    [unlockedSpotSet]
  );
  const kruitzHint = getKruitzStageHint(necroProgress, partsSet, shipBuilt, null);
  const blueprintStatus = shipBuilt ? "船完成" : allPartsReady ? "設計図完成" : `完成度 ${progress.parts.length} / ${SHIP_PART_IDS.length}`;

  const getRoutePoint = (spotId: NecroCitySpotId) => {
    const spot = NECRO_CITY_HOTSPOTS.find((item) => item.id === spotId);
    return spot ? `${spot.x},${spot.y}` : "0,0";
  };

  const getHotspotBadge = (hotspot: NecroCityHotspot) => {
    if (hotspot.kind === "back") return "BACK";
    if (hotspot.kind === "guide") return "HINT";
    if (hotspot.id === "shipyard") return shipBuilt ? "CLEAR" : allPartsReady ? "BUILD" : "GET";
    if (hotspot.id === "market") return partsSet.has("sailcloth") ? "DONE" : "GET";
    if (hotspot.id === "clock") return partsSet.has("helm") && partsSet.has("compass") ? "DONE" : "GET";
    if (hotspot.id === "waterfront") return partsSet.has("waterproof_material") && partsSet.has("anchor_chain") ? "DONE" : "GET";
    if (hotspot.id === "lighthouse") return partsSet.has("lantern") ? "DONE" : "GET";
    if (hotspot.id === "oldShipyard") return partsSet.has("hull_reinforcement") ? "DONE" : "GET";
    return "HINT";
  };

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
          <section style={{ ...mapStyle, ...(isNarrow ? mapNarrowStyle : null) }} aria-label="廃都ネクロシティ探索MAP">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={routeSvgStyle} aria-hidden="true">
              {visibleRouteSegments.map((segment) => (
                <line
                  key={`${segment.from}-${segment.to}`}
                  x1={getRoutePoint(segment.from).split(",")[0]}
                  y1={getRoutePoint(segment.from).split(",")[1]}
                  x2={getRoutePoint(segment.to).split(",")[0]}
                  y2={getRoutePoint(segment.to).split(",")[1]}
                  style={segment.branch ? routeBranchStyle : routeLineStyle}
                />
              ))}
            </svg>
            <div style={fogLayerStyle} />
            <div
              aria-label="ロク"
              style={{
                ...rokuSpriteStyle,
                ...(isNarrow ? rokuSpriteNarrowStyle : null),
                left: `${rokuPos.x}%`,
                top: `${rokuPos.y}%`,
                backgroundImage: `url(${rokuSpriteSheet})`,
                backgroundPosition: `${-frameIndex * SPRITE_CELL_WIDTH * ROKU_SPRITE_SCALE}px ${
                  -spriteAnim.row * SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE
                }px`,
              }}
            />
            <div style={mapCaptionStyle}>
              <span>{shipBuilt ? "船完成。湾中央へ向かう準備が整った" : "クロイツの記憶を頼りに廃都を巡る"}</span>
            </div>
            {visibleHotspots.map((hotspot) => {
              const active = activeDistrict === hotspot.districtId;
              const badge = getHotspotBadge(hotspot);
              return (
              <button
                key={hotspot.id}
                type="button"
                onClick={() => selectHotspot(hotspot)}
                style={{
                  ...hotspotButtonStyle,
                  ...(isNarrow ? hotspotButtonNarrowStyle : null),
                  ...(active ? hotspotActiveStyle : null),
                  ...(isMoving ? hotspotMovingStyle : null),
                  ...(hotspot.kind === "guide" ? plazaDistrictStyle : null),
                  ...(hotspot.kind === "build" ? shipyardDistrictStyle : null),
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                }}
              >
                <span style={hotspotPinStyle} aria-hidden="true" />
                <span style={hotspotTextStyle}>
                  <span style={districtBadgeStyle}>{badge}</span>
                  <span style={hotspotLabelStyle}>{hotspot.label}</span>
                </span>
              </button>
              );
            })}
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

            <div
              style={{
                ...areaVisualStyle,
                backgroundImage: `linear-gradient(180deg, rgba(4,7,11,0.12), rgba(4,7,11,0.72)), url('${activeDistrictConfig.backgroundUrl}')`,
              }}
            >
              <div style={areaVisualLabelStyle}>{activeDistrictConfig.label}</div>
              <div style={areaVisualSubStyle}>{activeDistrictConfig.subLabel}</div>
            </div>

            {activeDistrict === "plaza" ? (
              <div style={blueprintPanelStyle}>
                <div style={blueprintHeaderStyle}>
                  <span>船の設計図</span>
                  <span>{blueprintStatus}</span>
                </div>
                <div style={blueprintGridStyle}>
                  {SHIP_PART_IDS.map((partId) => {
                    const collected = partsSet.has(partId);
                    return (
                      <div key={partId} style={{ ...blueprintPieceStyle, ...(collected ? blueprintPieceDoneStyle : null) }}>
                        <span>{collected ? "✓" : "□"}</span>
                        <span>{SHIP_PART_LABELS[partId]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={blueprintNoteStyle}>
                  {shipBuilt
                    ? "船は完成した。湾中央へ向かう準備が整っている。"
                    : allPartsReady
                      ? "必要な部材が揃った。造船所へ向かおう。"
                      : "部材を見つけるたび、設計図の線が少しずつ戻っていく。"}
                </div>
              </div>
            ) : null}

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
                      <span style={actionBadgeStyle}>{partCollected ? "GET" : locked ? "LOCK" : action.id === "returnContinent" ? "BACK" : "調べる"}</span>
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
                <img
                  src={KRUitz_IMAGES[kruitzExpression]}
                  alt="クロイツ"
                  style={kruitzImageStyle}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div style={kruitzTextStyle}>
                <strong style={kruitzNameStyle}>クロイツ</strong>
                <span>この街、まだ少しだけ覚えてるにゃ。</span>
                <span>{kruitzHint}</span>
                {unlockNotice ? <span style={unlockNoticeStyle}>{unlockNotice}</span> : null}
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
  padding: "8px 8px 16px",
  boxSizing: "border-box",
  color: "#edf7ff",
  background:
    "linear-gradient(180deg, rgba(8, 12, 18, 0.28), rgba(4, 7, 11, 0.88)), radial-gradient(circle at 28% 18%, rgba(122, 198, 255, 0.14), transparent 28%), url('/backgrounds/necro-city-map.png') center top / cover no-repeat, linear-gradient(180deg, #151a23 0%, #12171c 48%, #080b10 100%)",
};

const shellStyle: CSSProperties = { width: "min(1180px, 100%)", margin: "0 auto" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 8 };
const eyebrowStyle: CSSProperties = { color: "#a9d7ff", fontSize: 11, fontWeight: 950 };
const titleStyle: CSSProperties = { margin: "4px 0 0", color: "#f0f6ff", fontSize: 28, textShadow: "0 2px 14px rgba(0,0,0,0.58)" };
const subtitleStyle: CSSProperties = { marginTop: 4, color: "rgba(237,247,255,0.72)", fontSize: 13, fontWeight: 850 };
const returnButtonStyle: CSSProperties = { minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#edf7ff", fontWeight: 950, cursor: "pointer" };
const progressStripStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8, padding: "7px 10px", borderRadius: 12, border: "1px solid rgba(210,232,255,0.16)", background: "rgba(7, 10, 15, 0.62)", color: "#dff2ff", fontSize: 12, fontWeight: 950 };
const layoutStyle: CSSProperties = { display: "block" };
const mapStyle: CSSProperties = { position: "relative", minHeight: "min(80dvh, 820px)", overflow: "hidden", borderRadius: 14, border: "1px solid rgba(210,232,255,0.22)", background: "linear-gradient(180deg, rgba(8, 12, 18, 0.02), rgba(4, 7, 11, 0.24)), url('/backgrounds/necro-city-map.png') center / cover no-repeat, linear-gradient(145deg, #28313a 0%, #161a20 52%, #0d1016 100%)", boxShadow: "0 20px 56px rgba(0,0,0,0.5), inset 0 0 54px rgba(0,0,0,0.28)" };
const mapNarrowStyle: CSSProperties = { minHeight: "72dvh", borderRadius: 12 };
const routeSvgStyle: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.78 };
const routeLineStyle: CSSProperties = { fill: "none", stroke: "rgba(255,224,163,0.28)", strokeWidth: 0.62, strokeDasharray: "1.6 1.8", filter: "drop-shadow(0 0 4px rgba(255,224,163,0.28))" };
const routeBranchStyle: CSSProperties = { fill: "none", stroke: "rgba(169,215,255,0.16)", strokeWidth: 0.45, strokeDasharray: "1.2 2.2", filter: "drop-shadow(0 0 3px rgba(169,215,255,0.18))" };
const fogLayerStyle: CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 0%, rgba(190,210,230,0.08) 36%, transparent 62%), radial-gradient(circle at 22% 74%, rgba(99,122,142,0.18), transparent 24%), linear-gradient(180deg, rgba(4,7,11,0.02), rgba(4,7,11,0.22))", pointerEvents: "none" };
const mapCaptionStyle: CSSProperties = { position: "absolute", left: 12, bottom: 10, zIndex: 2, maxWidth: "min(520px, calc(100% - 24px))", padding: "6px 9px", borderRadius: 999, border: "1px solid rgba(210,232,255,0.14)", background: "rgba(4, 7, 11, 0.48)", color: "rgba(237,247,255,0.72)", fontSize: 11, fontWeight: 850, pointerEvents: "none" };
const hotspotButtonStyle: CSSProperties = { position: "absolute", zIndex: 3, transform: "translate(-50%, -50%)", minWidth: 86, maxWidth: 116, minHeight: 34, padding: "4px 7px 4px 22px", boxSizing: "border-box", borderRadius: 999, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(6, 10, 16, 0.58)", color: "#edf7ff", fontWeight: 950, cursor: "pointer", boxShadow: "0 8px 18px rgba(0,0,0,0.36), inset 0 0 12px rgba(169,215,255,0.04)", display: "grid", alignItems: "center", textAlign: "left", lineHeight: 1.08, overflowWrap: "anywhere", backdropFilter: "blur(1px)" };
const hotspotButtonNarrowStyle: CSSProperties = { minWidth: "clamp(70px, 22vw, 96px)", maxWidth: "clamp(82px, 26vw, 110px)", minHeight: 38, padding: "5px 7px 5px 20px", fontSize: 10 };
const hotspotActiveStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.66)", background: "rgba(20, 17, 14, 0.68)", boxShadow: "0 0 16px rgba(255,224,163,0.22), 0 8px 18px rgba(0,0,0,0.36)" };
const hotspotMovingStyle: CSSProperties = { cursor: "wait" };
const plazaDistrictStyle: CSSProperties = { borderColor: "rgba(185,160,255,0.56)", background: "rgba(23, 16, 39, 0.66)" };
const shipyardDistrictStyle: CSSProperties = { borderColor: "rgba(255,224,163,0.54)", background: "rgba(47, 31, 12, 0.68)" };
const districtBadgeStyle: CSSProperties = { justifySelf: "start", padding: "1px 5px", borderRadius: 999, background: "rgba(169,215,255,0.14)", color: "#cfeaff", fontSize: 9, lineHeight: 1.1 };
const hotspotPinStyle: CSSProperties = { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#ffe0a3", boxShadow: "0 0 0 4px rgba(255,224,163,0.13), 0 0 13px rgba(255,224,163,0.72)" };
const hotspotTextStyle: CSSProperties = { display: "grid", gap: 1 };
const hotspotLabelStyle: CSSProperties = { color: "#f5fbff", fontSize: 11, textShadow: "0 1px 5px rgba(0,0,0,0.86)", whiteSpace: "normal" };
const rokuSpriteStyle: CSSProperties = {
  position: "absolute",
  width: ROKU_PLAYER_SIZE,
  height: ROKU_PLAYER_SIZE * (SPRITE_CELL_HEIGHT / SPRITE_CELL_WIDTH),
  transform: "translate(-50%, -92%)",
  backgroundRepeat: "no-repeat",
  backgroundSize: `${SPRITE_CELL_WIDTH * ROKU_SPRITE_SCALE * 8}px ${SPRITE_CELL_HEIGHT * ROKU_SPRITE_SCALE * 9}px`,
  imageRendering: "auto",
  filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.48)) drop-shadow(0 0 10px rgba(185,160,255,0.34))",
  transition: `left ${ROKU_MOVE_MS}ms ease, top ${ROKU_MOVE_MS}ms ease`,
  zIndex: 5,
  pointerEvents: "none",
};
const rokuSpriteNarrowStyle: CSSProperties = { filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.48)) drop-shadow(0 0 8px rgba(185,160,255,0.34))" };
const detailPanelStyle: CSSProperties = { width: "min(560px, 100%)", minHeight: 430, maxHeight: "min(82dvh, 580px)", padding: 14, boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(210,232,255,0.2)", background: "rgba(7, 10, 15, 0.9)", boxShadow: "0 18px 42px rgba(0,0,0,0.42)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", gap: 12, overflowX: "hidden", overflowY: "auto" };
const detailPanelNarrowStyle: CSSProperties = { minHeight: 340, maxHeight: "84dvh" };
const detailHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10 };
const detailEyebrowStyle: CSSProperties = { color: "#a9d7ff", fontSize: 10, fontWeight: 950 };
const detailTitleStyle: CSSProperties = { margin: "3px 0 0", color: "#ffe0a3", fontSize: 20 };
const detailSubStyle: CSSProperties = { marginTop: 4, color: "rgba(237,247,255,0.7)", fontSize: 12, fontWeight: 850 };
const areaVisualStyle: CSSProperties = { minHeight: 150, borderRadius: 12, border: "1px solid rgba(210,232,255,0.2)", backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat", boxShadow: "inset 0 -56px 68px rgba(0,0,0,0.72), inset 0 0 70px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", justifyContent: "end", gap: 4, padding: 12, boxSizing: "border-box", overflow: "hidden" };
const areaVisualLabelStyle: CSSProperties = { width: "fit-content", maxWidth: "100%", padding: "4px 9px", borderRadius: 999, border: "1px solid rgba(255,224,163,0.58)", background: "rgba(5,8,13,0.68)", color: "#ffe0a3", fontSize: 13, fontWeight: 950, textShadow: "0 1px 4px rgba(0,0,0,0.82)" };
const areaVisualSubStyle: CSSProperties = { width: "fit-content", maxWidth: "100%", padding: "3px 8px", borderRadius: 999, background: "rgba(5,8,13,0.62)", color: "rgba(237,247,255,0.86)", fontSize: 11, fontWeight: 900, textShadow: "0 1px 4px rgba(0,0,0,0.82)" };
const blueprintPanelStyle: CSSProperties = { display: "grid", gap: 10, padding: 12, borderRadius: 12, border: "1px solid rgba(255,224,163,0.24)", background: "linear-gradient(135deg, rgba(43, 34, 20, 0.72), rgba(8, 13, 19, 0.72))", boxShadow: "inset 0 0 30px rgba(255,224,163,0.08)" };
const blueprintHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: "#ffe0a3", fontSize: 13, fontWeight: 950 };
const blueprintGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7 };
const blueprintPieceStyle: CSSProperties = { minHeight: 34, padding: "6px 8px", boxSizing: "border-box", borderRadius: 8, border: "1px solid rgba(210,232,255,0.13)", background: "rgba(0,0,0,0.22)", color: "rgba(237,247,255,0.48)", display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 850 };
const blueprintPieceDoneStyle: CSSProperties = { borderColor: "rgba(126,240,200,0.5)", background: "rgba(54, 104, 84, 0.24)", color: "#dfffea", boxShadow: "0 0 14px rgba(126,240,200,0.08)" };
const blueprintNoteStyle: CSSProperties = { color: "rgba(237,247,255,0.68)", fontSize: 12, lineHeight: 1.5, fontWeight: 850 };
const kruitzPanelStyle: CSSProperties = { display: "grid", gridTemplateColumns: "132px 1fr", gap: 16, alignItems: "center", minHeight: 176, padding: 14, boxSizing: "border-box", borderRadius: 14, border: "1px solid rgba(185,160,255,0.32)", background: "linear-gradient(135deg, rgba(52, 36, 82, 0.68), rgba(12, 18, 28, 0.64))", boxShadow: "inset 0 0 34px rgba(137,95,255,0.12)" };
const kruitzPanelNarrowStyle: CSSProperties = { gridTemplateColumns: "1fr", justifyItems: "center", textAlign: "center", gap: 10 };
const kruitzFrameStyle: CSSProperties = { width: 128, height: 128, borderRadius: 18, display: "grid", placeItems: "center", background: "radial-gradient(circle, rgba(185,160,255,0.26), rgba(10,14,24,0.2))", border: "1px solid rgba(185,160,255,0.38)", boxShadow: "0 0 24px rgba(137,95,255,0.24), inset 0 0 22px rgba(0,0,0,0.28)", overflow: "hidden" };
const kruitzFrameNarrowStyle: CSSProperties = { width: 104, height: 104 };
const kruitzImageStyle: CSSProperties = { width: "132%", height: "132%", objectFit: "contain" };
const kruitzTextStyle: CSSProperties = { display: "grid", alignContent: "center", gap: 6, color: "rgba(237,247,255,0.9)", fontSize: 14, lineHeight: 1.6, fontWeight: 850 };
const kruitzNameStyle: CSSProperties = { color: "#ffe0a3", fontSize: 16, letterSpacing: 0, textShadow: "0 0 14px rgba(255,214,150,0.24)" };
const unlockNoticeStyle: CSSProperties = { width: "fit-content", padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(126,240,200,0.34)", background: "rgba(48, 100, 78, 0.24)", color: "#dfffea", fontSize: 12, fontWeight: 950 };
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
const kruitzModalStyle: CSSProperties = { width: "min(640px, 100%)", maxHeight: "min(82dvh, 560px)", overflowX: "hidden", overflowY: "auto", padding: 14, boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(210,232,255,0.26)", background: "linear-gradient(180deg, rgba(13, 16, 24, 0.96), rgba(6, 8, 13, 0.96))", boxShadow: "0 24px 72px rgba(0,0,0,0.62)", display: "grid", gap: 12 };
const kruitzModalNarrowStyle: CSSProperties = { maxHeight: "86dvh", padding: 12 };
const modalHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 };
const modalCloseButtonStyle: CSSProperties = { minHeight: 36, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(210,232,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#edf7ff", fontWeight: 950, cursor: "pointer" };
