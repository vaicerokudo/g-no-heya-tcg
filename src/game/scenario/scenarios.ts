import type { BoardSizeMode } from "../boardConfig";
import type { Form, Side } from "../types";

export type ScenarioId =
  | "scenario1"
  | "scenario2"
  | "scenario3"
  | "scenario4"
  | "scenario5"
  | "scenario6"
  | "scenario7"
  | "scenario8"
  | "scenario9"
  | "scenario10"
  | "scenario11"
  | "scenario12"
  | "scenario13"
  | "scenario14"
  | "scenario15"
  | "scenario16"
  | "scenario17"
  | "scenario18"
  | "scenario19"
  | "scenario20"
  | "scenario21"
  | "scenario22"
  | "scenario23"
  | "scenario24"
  | "scenario25"
  | "scenario26"
  | "scenario27"
  | "scenario28"
  | "scenario29"
  | "scenario30"
  | "scenario31"
  | "scenario32"
  | "scenario33"
  | "scenario_plaza_monten"
  | "scenario_hidden_myouou"
  | "scenario_hidden_author";
export type ScenarioDialogKind = "intro" | "victory" | "defeat";
export type ScenarioReturnScene = "astoria" | "delta" | "dustWasteland" | "blackNoiseBay" | "isolationZone";
export type ScenarioType = "standard" | "isolationDuel" | "isolationFinalBattle";

export type ScenarioLine = {
  speaker: string;
  text: string;
};

export type ScenarioUnitPlacement = {
  unitId: string;
  side: Side;
  r: number;
  c: number;
  instanceId: string;
  form?: Form;
  hp?: number;
};

export type ScenarioConfig = {
  id: ScenarioId;
  title: string;
  stageName: string;
  boardSizeMode: BoardSizeMode;
  scenarioType?: ScenarioType;
  backgroundUrl?: string;
  returnScene?: ScenarioReturnScene;
  terrain?: {
    quicksand?: string[];
  };
  placements: ScenarioUnitPlacement[];
  dialogs: Record<ScenarioDialogKind, ScenarioLine[]>;
};

export const SCENARIO1_ID: ScenarioId = "scenario1";

function makeIsolationDuelScenario(params: {
  id: ScenarioId;
  title: string;
  stageName: string;
  allyUnitId: string;
  darkUnitId: string;
  allyName: string;
  darkName: string;
  intro: string[];
  victory: string[];
  defeat?: string[];
}): ScenarioConfig {
  return {
    id: params.id,
    title: params.title,
    stageName: params.stageName,
    boardSizeMode: "advanced11",
    scenarioType: "isolationDuel",
    backgroundUrl: "/backgrounds/scenario-isolation-zone.png",
    returnScene: "isolationZone",
    placements: [
      { unitId: params.allyUnitId, side: "south", r: 10, c: 5, instanceId: `${params.id}-ALLY` },
      { unitId: params.darkUnitId, side: "north", r: 0, c: 5, instanceId: `${params.id}-DARK` },
    ],
    dialogs: {
      intro: [
        { speaker: params.allyName, text: params.intro[0] },
        { speaker: params.darkName, text: params.intro[1] },
        { speaker: params.allyName, text: params.intro[2] },
      ],
      victory: [
        { speaker: params.allyName, text: params.victory[0] },
        { speaker: params.darkName, text: params.victory[1] },
      ],
      defeat: [
        { speaker: params.darkName, text: params.defeat?.[0] ?? "まだ、影を越えられていない。" },
        { speaker: params.allyName, text: params.defeat?.[1] ?? "もう一度、向き合う。" },
      ],
    },
  };
}

export const SCENARIOS: Partial<Record<ScenarioId, ScenarioConfig>> = {
  scenario1: {
    id: SCENARIO1_ID,
    title: "シナリオ1：初めてのボア戦",
    stageName: "街の門前",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-gate.png",
    placements: [
      { unitId: "SOCHO", side: "south", r: 5, c: 3, instanceId: "SC1-SOCHO" },
      { unitId: "USHIMARU", side: "south", r: 5, c: 2, instanceId: "SC1-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 4, instanceId: "SC1-HIBIKI" },
      { unitId: "BOAR", side: "north", r: 0, c: 3, instanceId: "SC1-BOAR", hp: 8 },
    ],
    dialogs: {
      intro: [
        { speaker: "総長", text: "……ここが、はじまりの道です。" },
        { speaker: "うしまる", text: "なんか出そうっすねぇ。こういう場所、だいたい出るっす。" },
        { speaker: "hibiki", text: "ふん、何が来ても俺の盾があれば問題ない。" },
        { speaker: "総長", text: "来ます。構えてください。" },
        { speaker: "ボア", text: "ブオオオオッ！" },
      ],
      victory: [
        { speaker: "うしまる", text: "やったっす！初戦にしては上出来っすね！" },
        { speaker: "hibiki", text: "当然だ。俺が前に立ったからな。" },
        { speaker: "総長", text: "二人とも、よくやりました。……では、先へ進みましょう。" },
      ],
      defeat: [
        { speaker: "hibiki", text: "くっ……こんなはずでは……！" },
        { speaker: "うしまる", text: "総長！一度立て直すっす！" },
        { speaker: "総長", text: "大丈夫です。もう一度、行きましょう。" },
      ],
    },
  },
  scenario2: {
    id: "scenario2",
    title: "第2話 森の卵",
    stageName: "森",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-forest.png",
    placements: [
      { unitId: "SOCHO", side: "south", r: 5, c: 3, instanceId: "SC2-SOCHO" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 5, c: 2, instanceId: "SC2-YABUKO" },
      { unitId: "DELI", side: "south", r: 5, c: 4, instanceId: "SC2-DELI" },
      { unitId: "LESSER_WYVERN", side: "north", r: 2, c: 3, instanceId: "SC2-LESSER-WYVERN", hp: 10 },
    ],
    dialogs: {
      intro: [
        { speaker: "明王", text: "森に、少々厄介な気配があるのじゃ。" },
        { speaker: "総長", text: "卵の回収ですね。承知しました。" },
        { speaker: "やぶこ", text: "卵って、食べるやつなの？" },
        { speaker: "Deli", text: "いや、たぶんそういう依頼じゃないと思う……。" },
        { speaker: "レッサーワイバーン", text: "ギャアアッ！" },
      ],
      victory: [
        { speaker: "やぶこ", text: "卵、割れなくてよかったの。" },
        { speaker: "Deli", text: "ふぅ……持って帰るまでが依頼だよ。" },
        { speaker: "総長", text: "戻りましょう。明王様に報告します。" },
      ],
      defeat: [
        { speaker: "Deli", text: "まずい……一度下がろう。" },
        { speaker: "やぶこ", text: "卵どころじゃないの……！" },
        { speaker: "総長", text: "立て直します。撤退です。" },
      ],
    },
  },
  scenario3: {
    id: "scenario3",
    title: "第3話 ゴブリン討伐",
    stageName: "森",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-forest.png",
    placements: [
      { unitId: "SOCHO", side: "south", r: 5, c: 3, instanceId: "SC3-SOCHO" },
      { unitId: "TSUTSU", side: "south", r: 5, c: 2, instanceId: "SC3-TSUTSU" },
      { unitId: "DELI", side: "south", r: 5, c: 4, instanceId: "SC3-DELI" },
      { unitId: "GOBLIN", side: "north", r: 2, c: 2, instanceId: "SC3-GOBLIN-1", hp: 4 },
      { unitId: "GOBLIN", side: "north", r: 2, c: 3, instanceId: "SC3-GOBLIN-2", hp: 4 },
      { unitId: "GOBLIN", side: "north", r: 2, c: 4, instanceId: "SC3-GOBLIN-3", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "総長", text: "森の奥に、ゴブリンの群れが出たようです。" },
        { speaker: "つつ", text: "しょうがねぇなぁ。近づかせねぇよ。" },
        { speaker: "Deli", text: "数は三体。油断しないでいこう。" },
        { speaker: "ゴブリン", text: "ギギッ！" },
      ],
      victory: [
        { speaker: "つつ", text: "見えてんだよ。あの程度の動きはな。" },
        { speaker: "Deli", text: "周囲の反応も消えた。討伐完了だね。" },
        { speaker: "総長", text: "よくやりました。これで森もしばらく落ち着くでしょう。" },
      ],
      defeat: [
        { speaker: "Deli", text: "囲まれた……！一度下がろう！" },
        { speaker: "つつ", text: "くそっ、数で押してきやがる。" },
        { speaker: "総長", text: "立て直します。撤退です。" },
      ],
    },
  },
  scenario4: {
    id: "scenario4",
    title: "第4話 パン屋を探して",
    stageName: "街中",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-town.png",
    placements: [
      { unitId: "HIBIKI", side: "south", r: 5, c: 2, instanceId: "SC4-HIBIKI" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 5, c: 4, instanceId: "SC4-YABUKO" },
    ],
    dialogs: {
      intro: [
        { speaker: "受付", text: "ギルドに、少し変わった依頼が届いています。" },
        { speaker: "hibiki", text: "ふん。どんな依頼でも俺にかかれば余裕だ。" },
        { speaker: "やぶこ", text: "パン屋さんを探すの？いいにおいがしそうなの。" },
        { speaker: "受付", text: "街の中で場所が分からなくなっているようです。落ち着いて探してください。" },
        { speaker: "hibiki", text: "……場所が分からないパン屋とは何だ。" },
      ],
      victory: [
        { speaker: "やぶこ", text: "見つけたの！ここ、いいにおいがするの！" },
        { speaker: "hibiki", text: "当然だ。俺は最初から分かっていた。" },
        { speaker: "明王", text: "落ち着いて周りを見ることが大事じゃ。" },
        { speaker: "hibiki", text: "……べ、別に迷ってなどいない。" },
        { speaker: "やぶこ", text: "パン、買って帰るの？" },
      ],
      defeat: [
        { speaker: "受付", text: "焦らず、もう一度探してみましょう。" },
      ],
    },
  },
  scenario5: {
    id: "scenario5",
    title: "第5話 釣り場の大騒ぎ",
    stageName: "川辺",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-forest.png",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 3, instanceId: "SC5-USHIMARU" },
      { unitId: "ROCKEL", side: "north", r: 2, c: 3, instanceId: "SC5-ROCKEL" },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "今日はのんびり釣り日和っすねぇ。" },
        { speaker: "ROCKEL", text: "うおおお！この木、いい感じに倒れそうっす！" },
        { speaker: "うしまる", text: "……魚、全部逃げたっす。" },
        { speaker: "ROCKEL", text: "え？なんか言ったっすか？" },
        { speaker: "うしまる", text: "ちょっと止まるっす。止まらないなら、止めるっす。" },
      ],
      victory: [
        { speaker: "ROCKEL", text: "うわー！負けたっす！でも楽しかったっす！" },
        { speaker: "うしまる", text: "楽しいじゃないっす。魚が一匹もいないっす。" },
        { speaker: "ROCKEL", text: "じゃあ、次は魚を切ればいいっすか？" },
        { speaker: "うしまる", text: "絶対ダメっす。" },
      ],
      defeat: [
        { speaker: "ROCKEL", text: "やったっす！まだまだ切れるっす！" },
        { speaker: "うしまる", text: "だめっす……釣り場が更地になるっす……。" },
      ],
    },
  },
  scenario6: {
    id: "scenario6",
    title: "第6話 にたものどうし",
    stageName: "街中",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-town.png",
    placements: [
      { unitId: "SOCHO", side: "south", r: 5, c: 3, instanceId: "SC6-SOCHO" },
      { unitId: "ROKUDO", side: "north", r: 2, c: 3, instanceId: "SC6-ROKUDO" },
    ],
    dialogs: {
      intro: [
        { speaker: "総長", text: "ROKUDOさん、少し付き合ってもらえますか。" },
        { speaker: "ROKUDO", text: "鍛錬だね！いいよ！" },
        { speaker: "総長", text: "あなたは、仲間のために一人で背負いすぎるところがあります。" },
        { speaker: "ROKUDO", text: "……へぇ～、よく視てるね。" },
        { speaker: "総長", text: "そうですね。だからこそ、似たものどうしです。" },
        { speaker: "ROKUDO", text: "総長は、こうなっちゃダメだよっ！" },
      ],
      victory: [
        { speaker: "ROKUDO", text: "……。総長は、つよいなぁ～。" },
        { speaker: "総長", text: "本気だしてないでしょ！" },
        { speaker: "ROKUDO", text: "まぁ、それぞれの役割があるからね。" },
        { speaker: "総長", text: "それでいいです。私たちは、一人で戦っているわけではありません。" },
      ],
      defeat: [
        { speaker: "ROKUDO", text: "総長……大丈夫？" },
        { speaker: "総長", text: "大丈夫です。少し、油断しました。" },
        { speaker: "ROKUDO", text: "もう一度やってみようか！" },
        { speaker: "総長", text: "はい！お願いします！" },
      ],
    },
  },
  scenario7: {
    id: "scenario7",
    title: "第7話 サッグからの依頼",
    stageName: "鉱山",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-mine.png",
    placements: [
      { unitId: "SOCHO", side: "south", r: 5, c: 3, instanceId: "SC7-SOCHO" },
      { unitId: "USHIMARU", side: "south", r: 5, c: 2, instanceId: "SC7-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 4, instanceId: "SC7-HIBIKI" },
      { unitId: "BEAR", side: "north", r: 0, c: 3, instanceId: "SC7-BEAR", hp: 8 },
      { unitId: "GOBLIN", side: "north", r: 1, c: 2, instanceId: "SC7-GOBLIN-1", hp: 4 },
      { unitId: "GOBLIN", side: "north", r: 1, c: 3, instanceId: "SC7-GOBLIN-2", hp: 4 },
      { unitId: "GOBLIN", side: "north", r: 1, c: 4, instanceId: "SC7-GOBLIN-3", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "明王", text: "サッグからの依頼じゃ！すぐに鉱山へ向かうのじゃ！" },
        { speaker: "総長", text: "えっ？ 明王様、何かあったんですか？" },
        { speaker: "うしまる", text: "そんなに慌てて、どうしたんすか？" },
        { speaker: "明王", text: "いいから、はやく行くのじゃ！鉱山に魔物が出たそうじゃ！" },
        { speaker: "hibiki", text: "は、はぃぃぃぃ……！お、おれは準備できてるぞ！" },
      ],
      victory: [
        { speaker: "総長", text: "討伐完了です。これで鉱山の安全は確保できましたね。" },
        { speaker: "うしまる", text: "思ったより数が多かったっすけど、なんとかなったっす！" },
        { speaker: "hibiki", text: "ふ、ふん。このくらい当然だ。多少騒がしかったがな。" },
        { speaker: "明王", text: "うむ。サッグもこれで安心じゃろう。" },
        { speaker: "総長", text: "戻って報告しましょう。" },
      ],
      defeat: [
        { speaker: "hibiki", text: "む、無理だ……数が多すぎる……！" },
        { speaker: "うしまる", text: "いったん引くっす！立て直すっす！" },
        { speaker: "総長", text: "すみません、明王様……もう一度準備を整えて向かいます。" },
        { speaker: "明王", text: "うむ。焦らず態勢を立て直すのじゃ。" },
      ],
    },
  },
  scenario8: {
    id: "scenario8",
    title: "第8話 厄介な訳解",
    stageName: "研究施設デルタ",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-delta.png",
    returnScene: "delta",
    placements: [
      { unitId: "DELI", side: "south", r: 5, c: 3, instanceId: "SC8-DELI" },
      { unitId: "ZIMA", side: "north", r: 1, c: 3, instanceId: "SC8-ZIMA", hp: 5 },
    ],
    dialogs: {
      intro: [
        { speaker: "ジーマ", text: "よう！Deli。おいしい話を持ってきたぜ！" },
        { speaker: "Deli", text: "ほんとに～？ あやしい……。" },
        { speaker: "ジーマ", text: "この施設に隠されたパーツを全部集めたら、お宝がもらえるらしいぜ！" },
        { speaker: "Deli", text: "お宝？ こないだもそんなこと言って……ﾌﾞﾂﾌﾞﾂ……" },
        { speaker: "ジーマ", text: "証拠がこれだ！俺を捕まえたら、やるよ！" },
        { speaker: "Deli", text: "待ってください！そういうところが信用できないんですよ！" },
      ],
      victory: [
        { speaker: "ジーマ", text: "へへっ、やるじゃねぇか。ほら、約束の証拠だ。" },
        { speaker: "Deli", text: "これは……メタルマシーンの完成図の一部？" },
        { speaker: "ジーマ", text: "な？ 言っただろ。おいしい話だって。" },
        { speaker: "Deli", text: "……おいしいかどうかは、まだ判断保留です。" },
        { speaker: "ジーマ", text: "ま、そう言うなって。残りも探そうぜ。" },
      ],
      defeat: [
        { speaker: "ジーマ", text: "おっと、そこまでだ。まだ俺には追いつけないか？" },
        { speaker: "Deli", text: "逃げ足だけは本当に一級品ですね……！" },
        { speaker: "ジーマ", text: "褒め言葉として受け取っとくぜ。" },
        { speaker: "Deli", text: "褒めてません！" },
      ],
    },
  },
  scenario9: {
    id: "scenario9",
    title: "第9話 誤起動",
    stageName: "研究施設デルタ",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-delta.png",
    returnScene: "delta",
    placements: [
      { unitId: "DELI", side: "south", r: 5, c: 2, instanceId: "SC9-DELI" },
      { unitId: "PLAYER", side: "south", r: 5, c: 4, instanceId: "SC9-PLAYER" },
      { unitId: "PROTO_ROBOT", side: "north", r: 2, c: 2, instanceId: "SC9-PROTO-ROBOT-1", hp: 6 },
      { unitId: "PROTO_ROBOT", side: "north", r: 2, c: 4, instanceId: "SC9-PROTO-ROBOT-2", hp: 6 },
    ],
    dialogs: {
      intro: [
        { speaker: "ジーマ", text: "おっ、こいつまだ動くんじゃねぇか？" },
        { speaker: "Deli", text: "ちょ、勝手に触らないでください！" },
        { speaker: "ジーマ", text: "……あ。" },
        { speaker: "試作ロボ", text: "SYSTEM REBOOT... TARGET CONFIRMED." },
        { speaker: "Deli", text: "ほら！絶対こうなると思ってましたよ！" },
        { speaker: "ジーマ", text: "悪い！あとは頼んだぜ、Deli！" },
        { speaker: "Deli", text: "逃げるの早すぎませんか！？" },
        { speaker: "Player", text: "……かっこいい。" },
        { speaker: "Deli", text: "えっ、誰ですか！？" },
        { speaker: "Player", text: "援護します。Deliさん、かっこいいです。" },
        { speaker: "Deli", text: "今それどころじゃないんですけど！助かります！" },
      ],
      victory: [
        { speaker: "Deli", text: "なんとか止まりましたね……。" },
        { speaker: "Player", text: "すごい……Deliさん、かっこいい。" },
        { speaker: "Deli", text: "いや、あの、そんな真顔で言われると困るんですが……。" },
        { speaker: "ジーマ", text: "いやー、助かった助かった！" },
        { speaker: "Deli", text: "ジーマさん？あとで説明してもらいますからね。" },
        { speaker: "ジーマ", text: "おっと、そうだ。これ、見つけたんだった。" },
        { speaker: "Player", text: "完成図の欠片……？" },
        { speaker: "Deli", text: "またパーツですか。これで少しは信用……できるんですかね？" },
      ],
      defeat: [
        { speaker: "Deli", text: "制御が……間に合いません！" },
        { speaker: "Player", text: "Deliさん、下がってください。" },
        { speaker: "ジーマ", text: "こりゃ一回逃げた方がよさそうだな！" },
        { speaker: "Deli", text: "最初に逃げた人が言わないでください！" },
      ],
    },
  },
  scenario10: {
    id: "scenario10",
    title: "第10話 ROKUDOとロク",
    stageName: "研究施設デルタ",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-delta.png",
    returnScene: "delta",
    placements: [
      { unitId: "DELI", side: "south", r: 5, c: 2, instanceId: "SC10-DELI" },
      { unitId: "PLAYER", side: "south", r: 5, c: 4, instanceId: "SC10-PLAYER" },
      { unitId: "ROKU_CLONE", side: "north", r: 2, c: 2, instanceId: "SC10-ROKU-CLONE-1", hp: 2 },
      { unitId: "ROKU_CLONE", side: "north", r: 1, c: 3, instanceId: "SC10-ROKU-CLONE-2", hp: 2 },
      { unitId: "ROKU_CLONE", side: "north", r: 2, c: 4, instanceId: "SC10-ROKU-CLONE-3", hp: 2 },
    ],
    dialogs: {
      intro: [
        { speaker: "Deli", text: "あれ？ ROKUDOさん？" },
        { speaker: "ロク", text: "ロクだよ～♪ 特技は、分身の術。" },
        { speaker: "Deli", text: "？？？" },
        { speaker: "ロク", text: "ROKUDOが、稽古つけてあげてって言ってたから。いくよ～！" },
        { speaker: "Deli", text: "えええ～～！" },
        { speaker: "Player", text: "ロクさん……かっこいい……。" },
        { speaker: "Deli", text: "Playerさん！？今そこに感心するところですか！？" },
      ],
      victory: [
        { speaker: "ロク", text: "おお～。Deli、強くなってるね～♪" },
        { speaker: "Deli", text: "はぁ……はぁ……分身3体は反則じゃないですか……？" },
        { speaker: "Player", text: "Deliさん、かっこよかったです。" },
        { speaker: "Deli", text: "ありがとうございます……でも、もう少し普通の稽古がよかったです。" },
        { speaker: "ロク", text: "ROKUDOから預かってたやつ、渡すね～♪" },
        { speaker: "Deli", text: "これは……完成図のパーツ？" },
        { speaker: "ロク", text: "ロクだよ～♪" },
      ],
      defeat: [
        { speaker: "ロク", text: "まだまだだね～♪ もう一回いく？" },
        { speaker: "Deli", text: "少し休ませてください……！" },
        { speaker: "Player", text: "Deliさん、大丈夫ですか？" },
        { speaker: "Deli", text: "大丈夫です……たぶん……。" },
      ],
    },
  },
  scenario11: {
    id: "scenario11",
    title: "第11話 ブラックノイズ",
    stageName: "研究施設デルタ",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-delta.png",
    returnScene: "delta",
    placements: [
      { unitId: "DELI", side: "south", r: 5, c: 2, instanceId: "SC11-DELI" },
      { unitId: "PLAYER", side: "south", r: 5, c: 3, instanceId: "SC11-PLAYER" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC11-ROKUDO" },
      { unitId: "BLACK_NOISE_ROKU", side: "north", r: 2, c: 2, instanceId: "SC11-BLACK-NOISE-ROKU-1", form: "g", hp: 5 },
      { unitId: "BLACK_NOISE_ROKU", side: "north", r: 1, c: 3, instanceId: "SC11-BLACK-NOISE-ROKU-2", form: "g", hp: 5 },
      { unitId: "BLACK_NOISE_ROKU", side: "north", r: 2, c: 4, instanceId: "SC11-BLACK-NOISE-ROKU-3", form: "g", hp: 5 },
    ],
    dialogs: {
      intro: [
        { speaker: "Deli", text: "隔離ゲート、開きましたね……。" },
        { speaker: "Player", text: "この先、何かいます。" },
        { speaker: "ロク", text: "ロクだよ～♪ ……あれ？" },
        { speaker: "Deli", text: "ロクさん？" },
        { speaker: "Player", text: "……危ない！" },
        { speaker: "ロク", text: "…………。" },
        { speaker: "ロク", text: "ロクだよ～♪ ……コワレロ。" },
        { speaker: "Deli", text: "えっ！？" },
        { speaker: "Deli", text: "分身まで！？ なんなんですかこれ！" },
        { speaker: "ROKUDO", text: "……いやな予感したんだよね。" },
        { speaker: "Deli", text: "ROKUDOさん！" },
        { speaker: "ROKUDO", text: "そこは、似なくいいのに・・。" },
        { speaker: "Player", text: "……かっこいい。" },
        { speaker: "Deli", text: "いまは感心してる場合じゃありません！" },
      ],
      victory: [
        { speaker: "ロク", text: "……ロク、だよ～……？" },
        { speaker: "Deli", text: "戻った……？" },
        { speaker: "Player", text: "大丈夫そうです。" },
        { speaker: "ROKUDO", text: "……間に合ったね。" },
        { speaker: "Deli", text: "この黒いモヤが、ブラックノイズ……。" },
        { speaker: "ROKUDO", text: "これも必要な存在なんだよね・・。" },
        { speaker: "ロク", text: "ごめんね～……。" },
        { speaker: "Deli", text: "いえ、ロクさんのせいじゃありません。" },
        { speaker: "Player", text: "Deliさん、かっこいいです。" },
        { speaker: "Deli", text: "ありがとうございます。……でも本当に疲れました。" },
      ],
      defeat: [
        { speaker: "ROKUDO", text: "つよいね……。" },
        { speaker: "Deli", text: "このままじゃ、ロクさんが……！" },
        { speaker: "Player", text: "立て直しましょう。" },
      ],
    },
  },
  scenario12: {
    id: "scenario12",
    title: "第12話 荒野の入口",
    stageName: "砂塵の荒野",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-dust-wasteland.png",
    returnScene: "dustWasteland",
    placements: [
      { unitId: "TSUTSU", side: "south", r: 5, c: 2, instanceId: "SC12-TSUTSU" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 5, c: 4, instanceId: "SC12-YABUKO" },
      { unitId: "SCORPION", side: "north", r: 2, c: 2, instanceId: "SC12-SCORPION-1", hp: 5 },
      { unitId: "SCORPION", side: "north", r: 2, c: 4, instanceId: "SC12-SCORPION-2", hp: 5 },
    ],
    dialogs: {
      intro: [
        { speaker: "つつ", text: "ここから先が砂塵の荒野だ。足場も視界も信用しすぎるなよ。" },
        { speaker: "やぶこ", text: "砂がいっぱいなの。さらさらで、ちょっと楽しそうなの。" },
        { speaker: "つつ", text: "楽しむ前に進路確認だ。……って、おい、もう歩き出すな。" },
        { speaker: "やぶこ", text: "あっちに何か動いたの。先に見に行くの。" },
        { speaker: "つつ", text: "スコーピオンだ。入口から歓迎が荒いな。まずはこいつらをどかすぞ。" },
      ],
      victory: [
        { speaker: "つつ", text: "よし、入口は抜けたな。次は地面をよく見て進むぞ。" },
        { speaker: "やぶこ", text: "スコーピオン、砂から出てきたの。砂って隠し上手なの。" },
        { speaker: "つつ", text: "そういう感想で済むなら苦労しねぇよ。次はもっと足元に気をつけろ。" },
      ],
      defeat: [
        { speaker: "つつ", text: "一回戻るぞ。荒野を甘く見ると足元から持っていかれる。" },
        { speaker: "やぶこ", text: "砂、思ったより強いの。" },
      ],
    },
  },
  scenario13: {
    id: "scenario13",
    title: "第13話 流砂地帯",
    stageName: "砂塵の荒野・流砂地帯",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-dust-wasteland.png",
    returnScene: "dustWasteland",
    terrain: {
      quicksand: ["C3", "D4", "E5"],
    },
    placements: [
      { unitId: "TSUTSU", side: "south", r: 5, c: 2, instanceId: "SC13-TSUTSU" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 5, c: 4, instanceId: "SC13-YABUKO" },
      { unitId: "SCORPION", side: "north", r: 2, c: 1, instanceId: "SC13-SCORPION-1", hp: 5 },
      { unitId: "SCORPION", side: "north", r: 2, c: 5, instanceId: "SC13-SCORPION-2", hp: 5 },
      { unitId: "ROCK_GOLEM", side: "north", r: 1, c: 3, instanceId: "SC13-ROCK-GOLEM", hp: 8 },
    ],
    dialogs: {
      intro: [
        { speaker: "やぶこ", text: "あっち、ふかふかしてるの。歩きやすそうなの。" },
        { speaker: "つつ", text: "しょうがねぇなぁ……そっちは危ねぇって言ってんだろ。" },
        { speaker: "やぶこ", text: "えー？でも、こっちのほうが近そうなの？" },
        { speaker: "つつ", text: "近いかどうかじゃねぇ。沈むかどうかだ。止まったら足を取られる、流砂だ。" },
        { speaker: "つつ", text: "流砂マスでターンを終えるとスタンする。通るだけならまだ何とかなる。" },
        { speaker: "やぶこ", text: "止まらなければいいの。やぶこ、覚えたの。" },
        { speaker: "つつ", text: "覚えたやつは今まさに流砂へ向かって歩かねぇんだよ。" },
      ],
      victory: [
        { speaker: "つつ", text: "足元を見る癖、少しはついたか？" },
        { speaker: "やぶこ", text: "ふかふかは危ない、覚えたの。あと、石のひとは硬いの。" },
        { speaker: "つつ", text: "ロックゴーレムまで出るとはな。荒野の奥は、思ったより厄介そうだ。" },
      ],
      defeat: [
        { speaker: "つつ", text: "無理に踏み込むな。流砂は待ってくれねぇ。" },
        { speaker: "やぶこ", text: "次は、沈まない砂を選ぶの。" },
      ],
    },
  },
  scenario14: {
    id: "scenario14",
    title: "第14話 砂嵐の抜け道",
    stageName: "砂塵の荒野・砂嵐の抜け道",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-dust-wasteland.png",
    returnScene: "dustWasteland",
    terrain: {
      quicksand: ["B4", "F4"],
    },
    placements: [
      { unitId: "TSUTSU", side: "south", r: 5, c: 2, instanceId: "SC14-TSUTSU" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 5, c: 4, instanceId: "SC14-YABUKO" },
      { unitId: "LESSER_WYVERN", side: "north", r: 1, c: 2, instanceId: "SC14-WYVERN-1", hp: 7 },
      { unitId: "LESSER_WYVERN", side: "north", r: 2, c: 3, instanceId: "SC14-WYVERN-2", hp: 7 },
      { unitId: "LESSER_WYVERN", side: "north", r: 1, c: 4, instanceId: "SC14-WYVERN-3", hp: 7 },
    ],
    dialogs: {
      intro: [
        { speaker: "つつ", text: "砂嵐で視界が悪い。派手に動くより、抜け道を読む。" },
        { speaker: "やぶこ", text: "じゃあ、やぶこは風の気分で行くの。" },
        { speaker: "つつ", text: "その気分を俺の指示と同じ方向にしてくれ。" },
        { speaker: "やぶこ", text: "風は自由なの。右に行ったり、左に行ったりするの。" },
        { speaker: "つつ", text: "だからジグザグに進むんだよ。まっすぐ突っ切るより、砂が浅い場所を拾う。" },
        { speaker: "やぶこ", text: "つつ、砂の道を読めるの。すごいの。" },
        { speaker: "つつ", text: "褒めるなら、まずは俺より前に出すぎるな。" },
      ],
      victory: [
        { speaker: "つつ", text: "抜け道は見えた。奥地までもう少しだ。" },
        { speaker: "やぶこ", text: "砂だらけだけど、進めるの。つつの言うジグザグ、ちょっと楽しいの。" },
        { speaker: "つつ", text: "楽しいで済んでるうちはいい。次は奥地だ、気を締めろ。" },
      ],
      defeat: [
        { speaker: "つつ", text: "視界が悪い時ほど、立て直しだ。" },
        { speaker: "やぶこ", text: "砂嵐、目に入るとしょんぼりなの。" },
      ],
    },
  },
  scenario15: {
    id: "scenario15",
    title: "第15話 荒野の奥地",
    stageName: "砂塵の荒野・奥地",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-dust-wasteland.png",
    returnScene: "dustWasteland",
    terrain: {
      quicksand: ["C4", "D3", "E4"],
    },
    placements: [
      { unitId: "TSUTSU", side: "south", r: 5, c: 1, instanceId: "SC15-TSUTSU" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 5, c: 3, instanceId: "SC15-YABUKO" },
      { unitId: "7171", side: "south", r: 5, c: 5, instanceId: "SC15-7171" },
      { unitId: "GIANT_SCORPION", side: "north", r: 1, c: 3, instanceId: "SC15-GIANT-SCORPION", hp: 14 },
      { unitId: "ROCK_GOLEM", side: "north", r: 2, c: 1, instanceId: "SC15-ROCK-GOLEM-1", hp: 8 },
      { unitId: "ROCK_GOLEM", side: "north", r: 2, c: 3, instanceId: "SC15-ROCK-GOLEM-2", hp: 8 },
      { unitId: "ROCK_GOLEM", side: "north", r: 2, c: 5, instanceId: "SC15-ROCK-GOLEM-3", hp: 8 },
    ],
    dialogs: {
      intro: [
        { speaker: "つつ", text: "奥地だ。ここからは判断を間違えられねぇ。" },
        { speaker: "7171", text: "助っ人にゃ。足元を見るにゃ。あと、砂をなめるのはおすすめしないにゃ。" },
        { speaker: "やぶこ", text: "7171も来たの。これで近道できるの？" },
        { speaker: "つつ", text: "近道じゃなくて、安全な道だ。" },
        { speaker: "7171", text: "あの大きいスコーピオン、普通のより目つきが悪いにゃ。" },
        { speaker: "やぶこ", text: "じゃあ、やさしく声をかけるの。" },
        { speaker: "つつ", text: "やめとけ。返事の代わりにハサミが飛んでくる。" },
        { speaker: "7171", text: "つつ、作戦は？" },
        { speaker: "つつ", text: "ゴーレムを流砂に誘導しつつ、巨大スコーピオンを囲む。焦らず削るぞ。" },
      ],
      victory: [
        { speaker: "つつ", text: "荒野の奥地、到達だ。ひとまず調査完了だな。" },
        { speaker: "7171", text: "砂まみれにゃ。でも無事なら勝ちにゃ。" },
        { speaker: "やぶこ", text: "つつのジグザグ、役に立ったの。" },
        { speaker: "つつ", text: "やっと分かったか。道は短さじゃなくて、生きて抜けられるかで選ぶんだ。" },
        { speaker: "やぶこ", text: "じゃあ、次は砂じゃないところがいいの。" },
        { speaker: "7171", text: "それは全員一致にゃ。" },
      ],
      defeat: [
        { speaker: "つつ", text: "奥地は簡単じゃねぇ。進路を読み直すぞ。" },
        { speaker: "7171", text: "撤退も立派な足元確認にゃ。" },
      ],
    },
  },
  scenario16: {
    id: "scenario16",
    title: "第16話 黒い潮",
    stageName: "ブラックノイズ湾・湾岸",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-black-noise-bay.png",
    returnScene: "blackNoiseBay",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 2, instanceId: "SC16-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 3, instanceId: "SC16-HIBIKI" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC16-ROKUDO" },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 1, instanceId: "SC16-FISH-1", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 3, instanceId: "SC16-FISH-2", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 5, instanceId: "SC16-FISH-3", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 2, c: 2, instanceId: "SC16-FISH-4", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 2, c: 4, instanceId: "SC16-FISH-5", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "湾の魚が荒れてるっす。釣り場の空気じゃないっすね。" },
        { speaker: "hibiki", text: "魚ごときで騒ぐな。……いや、五匹は多いな。かなり多いな。" },
        { speaker: "ROKUDO", text: "黒い潮で活性化しています。岸に上がる前に抑えましょう。" },
        { speaker: "うしまる", text: "海が黒いっすね……魚の気配まで変っす。" },
        { speaker: "hibiki", text: "ふん、この程度の潮など俺が見極めてやる。……近づきすぎるなよ？" },
        { speaker: "ROKUDO", text: "黒いノイズの気配が混ざっています。まずは湾岸の魔物を抑えましょう。" },
      ],
      victory: [
        { speaker: "ROKUDO", text: "湾岸の異変は確認できました。潮の流れは湾の奥へ向かっています。" },
        { speaker: "うしまる", text: "小魚がこれなら、奥にはもっとでかいのがいるっす。" },
        { speaker: "hibiki", text: "ふん。でかいだけなら俺の威厳でどうにかなる。たぶんな。" },
        { speaker: "ROKUDO", text: "湾岸の異変は確認できました。奥に、もっと大きな気配があります。" },
        { speaker: "うしまる", text: "釣り場としては最悪っす。でも、奥の影は気になるっす。" },
      ],
      defeat: [
        { speaker: "hibiki", text: "撤退ではない。これは潮の様子を見るための高度な判断だ。" },
        { speaker: "ROKUDO", text: "立て直しましょう。黒い潮に長く触れるのは危険です。" },
      ],
    },
  },
  scenario17: {
    id: "scenario17",
    title: "第17話 漂着する影",
    stageName: "ブラックノイズ湾・漂着地",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-black-noise-bay.png",
    returnScene: "blackNoiseBay",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 2, instanceId: "SC17-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 3, instanceId: "SC17-HIBIKI" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC17-ROKUDO" },
      { unitId: "KRAKEN", side: "north", r: 0, c: 2, instanceId: "SC17-KRAKEN-1", hp: 16 },
      { unitId: "OCTOPUS", side: "north", r: 0, c: 4, instanceId: "SC17-OCTOPUS-1", hp: 8 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 1, instanceId: "SC17-FISH-1", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 3, instanceId: "SC17-FISH-2", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 5, instanceId: "SC17-FISH-3", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "触手の影が見えたっす。魚だけじゃなくて、海の底から来てるっす。" },
        { speaker: "hibiki", text: "クラーケンだと？ 名前からして偉そうだな。俺ほどではないが。" },
        { speaker: "ROKUDO", text: "オクトパスと魚群もいます。黒い潮に侵された群れの動きを調べます。" },
        { speaker: "うしまる", text: "漂着物に黒いモヤが絡んでるっす。普通の海じゃないっすね。" },
        { speaker: "hibiki", text: "俺は別に怖くない。でかい影が動いたように見えただけだ。" },
        { speaker: "ROKUDO", text: "魔物がノイズに侵されています。倒して、気配の流れを追いましょう。" },
      ],
      victory: [
        { speaker: "ROKUDO", text: "群れの反応はすべて湾の中心へ収束しています。" },
        { speaker: "hibiki", text: "中心という言い方をやめろ。一番危ない場所と言っているようなものだ。" },
        { speaker: "うしまる", text: "危ないなら、ちゃんと準備して行くっす。" },
        { speaker: "ROKUDO", text: "黒い潮は湾の中心へ向かっています。" },
        { speaker: "hibiki", text: "中心だと？ つまり一番危ない場所ではないか。" },
        { speaker: "うしまる", text: "危ないなら、準備して行くっす。" },
      ],
      defeat: [
        { speaker: "うしまる", text: "潮の流れが読みにくいっす。もう一回、岸から見直すっす。" },
      ],
    },
  },
  scenario18: {
    id: "scenario18",
    title: "第18話 湾の中心へ",
    stageName: "ブラックノイズ湾・中心遠望",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-black-noise-bay.png",
    returnScene: "blackNoiseBay",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 2, instanceId: "SC18-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 3, instanceId: "SC18-HIBIKI" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC18-ROKUDO" },
      { unitId: "MIST_LEVIATHAN", side: "north", r: 1, c: 3, instanceId: "SC18-MIST-LEVIATHAN-1", hp: 24 },
    ],
    dialogs: {
      intro: [
        { speaker: "ROKUDO", text: "霧の中に巨大な輪郭があります。倒すのではなく、反応を測るだけで十分です。" },
        { speaker: "うしまる", text: "あれがリヴァイアサンなら、陸から釣る相手じゃないっす。まずは手応えを見るっす。" },
        { speaker: "hibiki", text: "つまり軽くつついて逃げる作戦だな。俺向きの、非常に賢い作戦だ。" },
        { speaker: "ROKUDO", text: "湾の中心に巨大な影があります。ブラックノイズの核に近い反応です。" },
        { speaker: "うしまる", text: "あのサイズ……釣るなら船がいるっす。" },
        { speaker: "hibiki", text: "釣る前提なのか！？ いや、俺もそう思っていたがな。" },
      ],
      victory: [
        { speaker: "ROKUDO", text: "十分です。霧のリヴァイアサンの反応を記録できました。" },
        { speaker: "うしまる", text: "あの引き、船がないと勝負にならないっす。" },
        { speaker: "ROCKEL", text: "木材なら任せるっす！でっかいの持ってくるっす！" },
        { speaker: "ROKUDO", text: "影の名は、おそらくリヴァイアサン。今の装備では近づけません。" },
        { speaker: "うしまる", text: "船を作るっす。湾の中心まで行ける、でっかいやつっす。" },
        { speaker: "ROCKEL", text: "木材なら任せるっす！でっかいの持ってくるっす！" },
      ],
      defeat: [
        { speaker: "hibiki", text: "巨大な影を見たのは作戦上の収穫だ。撤退も作戦のうちだ。" },
        { speaker: "ROKUDO", text: "もう一度、湾岸から気配を追いましょう。" },
      ],
    },
  },
  scenario19: {
    id: "scenario19",
    title: "第19話 船出",
    stageName: "ブラックノイズ湾・船出",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-black-noise-bay.png",
    returnScene: "blackNoiseBay",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 1, instanceId: "SC19-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 2, instanceId: "SC19-HIBIKI" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC19-ROKUDO" },
      { unitId: "ROCKEL", side: "south", r: 5, c: 5, instanceId: "SC19-ROCKEL" },
      { unitId: "OCTOPUS", side: "north", r: 0, c: 3, instanceId: "SC19-OCTOPUS-1", hp: 8 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 1, instanceId: "SC19-FISH-1", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 3, instanceId: "SC19-FISH-2", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 5, instanceId: "SC19-FISH-3", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "船、ちゃんと浮いてるっすね！ これなら湾の中心まで行けそうっす！" },
        { speaker: "ROCKEL", text: "木材はバッチリっす！ ちょっとやそっとじゃ壊れないっす！" },
        { speaker: "hibiki", text: "ふん。当然だ。俺が乗る船だからな。……おい、今けっこう揺れなかったか？" },
        { speaker: "ROKUDO", text: "黒い潮の奥から、強い気配がします。ミストリヴァイアサンよりも、さらに深い場所です。" },
        { speaker: "うしまる", text: "じゃあ、そこにいるんすね。リヴァイアサンが。" },
        { speaker: "hibiki", text: "べ、別に怖くはないぞ。調査だ。これは冷静な調査だ。" },
        { speaker: "ROCKEL", text: "出航っす！ 邪魔するやつはぶっ飛ばすっす！" },
        { speaker: "ROKUDO", text: "来ます。海面の下に、敵影があります。" },
      ],
      victory: [
        { speaker: "うしまる", text: "湾の奥、魚の動きが変わってきたっす。" },
        { speaker: "ROKUDO", text: "近づいています。次は、こちらから誘い出す必要がありそうです。" },
        { speaker: "hibiki", text: "誘い出す？ まさか、あの巨大な影をか？" },
        { speaker: "うしまる", text: "釣るっす。" },
        { speaker: "hibiki", text: "……釣る？" },
        { speaker: "うしまる", text: "リヴァイアサンを、釣り上げるっす。" },
      ],
      defeat: [
        { speaker: "hibiki", text: "船出で沈むわけにはいかん。これは戦略的な寄港だ。" },
        { speaker: "ROKUDO", text: "潮の流れを読み直しましょう。船はまだ進めます。" },
      ],
    },
  },
  scenario20: {
    id: "scenario20",
    title: "第20話 リヴァイアサンを釣れ",
    stageName: "ブラックノイズ湾・湾中央",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-black-noise-bay.png",
    returnScene: "blackNoiseBay",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 1, instanceId: "SC20-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 2, instanceId: "SC20-HIBIKI" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC20-ROKUDO" },
      { unitId: "ROCKEL", side: "south", r: 5, c: 5, instanceId: "SC20-ROCKEL" },
      { unitId: "KRAKEN", side: "north", r: 0, c: 3, instanceId: "SC20-KRAKEN-1", hp: 16 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 1, instanceId: "SC20-FISH-1", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 2, instanceId: "SC20-FISH-2", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 2, c: 4, instanceId: "SC20-FISH-3", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 5, instanceId: "SC20-FISH-4", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "潮の流れが変わったっす。ここ、かなり深いっすね。" },
        { speaker: "hibiki", text: "ふん。深かろうが浅かろうが、俺がいれば問題ない。" },
        { speaker: "ROKUDO", text: "気をつけてください。黒い気配が、真下から上がってきています。" },
        { speaker: "ROCKEL", text: "船はまだ大丈夫っす！ でも、下から押されてる感じがするっす！" },
        { speaker: "うしまる", text: "いるっすね。リヴァイアサン。" },
        { speaker: "hibiki", text: "い、いると分かっているなら慎重にだな……。" },
        { speaker: "うしまる", text: "釣るっす。" },
        { speaker: "hibiki", text: "だから、その発想が怖いんだ！" },
        { speaker: "ROKUDO", text: "うしまるさん。湾の中心、あの潮目まで進めば届くはずです。" },
        { speaker: "うしまる", text: "了解っす。針を落とす場所まで行くっす！" },
      ],
      victory: [
        { speaker: "うしまる", text: "……かかったっす！" },
        { speaker: "ROCKEL", text: "船ごと引っ張られてるっす！" },
        { speaker: "hibiki", text: "おいおいおい！ これ本当に釣りなのか！？" },
        { speaker: "ROKUDO", text: "来ます。黒い潮の奥から、本体が上がってきます。" },
        { speaker: "うしまる", text: "引き上げるっす！ リヴァイアサン、こっちに来るっす！" },
        { speaker: "hibiki", text: "盾を構えろ！ 来るぞ！" },
      ],
      defeat: [
        { speaker: "ROKUDO", text: "潮目まで届きませんでした。敵影を退けて、もう一度進みましょう。" },
        { speaker: "うしまる", text: "引きは感じたっす。次は針を落とす場所まで行くっす。" },
      ],
    },
  },
  scenario21: {
    id: "scenario21",
    title: "第21話 黒潮の主",
    stageName: "ブラックノイズ湾・黒潮の主",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-black-noise-bay.png",
    returnScene: "blackNoiseBay",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 5, c: 1, instanceId: "SC21-USHIMARU" },
      { unitId: "HIBIKI", side: "south", r: 5, c: 2, instanceId: "SC21-HIBIKI" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 4, instanceId: "SC21-ROKUDO" },
      { unitId: "ROCKEL", side: "south", r: 5, c: 5, instanceId: "SC21-ROCKEL" },
      { unitId: "LEVIATHAN", side: "north", r: 0, c: 3, instanceId: "SC21-LEVIATHAN-1", hp: 22 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 2, instanceId: "SC21-FISH-1", hp: 4 },
      { unitId: "KILLER_FISH", side: "north", r: 1, c: 4, instanceId: "SC21-FISH-2", hp: 4 },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "引き上げたっす……あれが、リヴァイアサンっすね。" },
        { speaker: "hibiki", text: "で、でかすぎるだろ！ あんなもの、魚の範囲を超えている！" },
        { speaker: "ROCKEL", text: "でも釣れたっす！ なら倒せるっす！" },
        { speaker: "ROKUDO", text: "黒い潮が、あの体に集まっています。ブラックノイズの残滓を核にしていますね。" },
        { speaker: "うしまる", text: "海を荒らしてるなら、放っておけないっす。" },
        { speaker: "hibiki", text: "ふん。俺が前に立つ。お前たちは、好きに動け。" },
        { speaker: "ROCKEL", text: "かっこいいっすね！" },
        { speaker: "hibiki", text: "べ、別に怖くないからな！" },
        { speaker: "ROKUDO", text: "来ます。黒潮の主、リヴァイアサンです。" },
      ],
      victory: [
        { speaker: "うしまる", text: "……潮が、静かになってきたっす。" },
        { speaker: "ROKUDO", text: "ブラックノイズの気配も薄れています。完全ではありませんが、この湾は落ち着くはずです。" },
        { speaker: "hibiki", text: "当然だ。俺たちが来たからな。" },
        { speaker: "ROCKEL", text: "船も最後まで持ったっす！ 俺の木材、最高っす！" },
        { speaker: "うしまる", text: "みんなのおかげっす。……でも、あれを釣るのは、しばらく遠慮したいっすね。" },
        { speaker: "hibiki", text: "二度と釣るな！" },
        { speaker: "ROKUDO", text: "帰りましょう。湾の風が、少しだけ軽くなりました。" },
      ],
      defeat: [
        { speaker: "ROKUDO", text: "黒潮の圧が強すぎます。立て直して、リヴァイアサンだけを狙いましょう。" },
        { speaker: "hibiki", text: "撤退ではない。盾を構え直すだけだ。" },
      ],
    },
  },
  scenario22: {
    id: "scenario22",
    title: "第22話 影のうしまる",
    stageName: "隔離区域・うしまるの影",
    boardSizeMode: "advanced11",
    scenarioType: "isolationDuel",
    backgroundUrl: "/backgrounds/scenario-isolation-zone.png",
    returnScene: "isolationZone",
    placements: [
      { unitId: "USHIMARU", side: "south", r: 10, c: 5, instanceId: "SC22-USHIMARU" },
      { unitId: "DARK_USHIMARU", side: "north", r: 0, c: 5, instanceId: "SC22-DARK-USHIMARU", hp: 8 },
    ],
    dialogs: {
      intro: [
        { speaker: "うしまる", text: "ここが隔離区域っすか……空気が重いっすね。" },
        { speaker: "闇落ちうしまる", text: "釣り上げたもの全部、背負えると思ってるっすか？" },
        { speaker: "うしまる", text: "……自分の声なのに、ぜんぜん落ち着かないっす。" },
        { speaker: "闇落ちうしまる", text: "明るくしてれば、怖くないふりができるっすもんね。" },
        { speaker: "うしまる", text: "それでも、前に進むっす。怖いものがあっても、逃げっぱなしにはしないっす。" },
      ],
      victory: [
        { speaker: "うしまる", text: "……怖くないわけじゃないっす。でも、怖いままでも進めるっす。" },
        { speaker: "闇落ちうしまる", text: "……それなら、行くといいっす。" },
        { speaker: "うしまる", text: "ありがとうっす。これも、自分なんすね。" },
      ],
      defeat: [
        { speaker: "闇落ちうしまる", text: "まだ、背負うには重すぎるっすね。" },
        { speaker: "うしまる", text: "……もう一回っす。逃げっぱなしにはしないっす。" },
      ],
    },
  },
  scenario23: makeIsolationDuelScenario({
    id: "scenario23",
    title: "第23話 影の総長",
    stageName: "隔離区域・総長の影",
    allyUnitId: "SOCHO",
    darkUnitId: "DARK_SOCHO",
    allyName: "総長",
    darkName: "闇落ち総長",
    intro: [
      "……これが、自分の影ですね。OKです、向き合います。",
      "人を導くふりをして、迷いを隠してきただけでしょう。",
      "迷いがあるから、確認して進むんです。ここで止まりません。",
    ],
    victory: ["これも、自分の一部なんですね。受け止めて進みます。", "……ならば、先へ行きなさい。"],
  }),
  scenario24: makeIsolationDuelScenario({
    id: "scenario24",
    title: "第24話 影のつつ",
    stageName: "隔離区域・つつの影",
    allyUnitId: "TSUTSU",
    darkUnitId: "DARK_TSUTSU",
    allyName: "つつ",
    darkName: "闇落ちつつ",
    intro: [
      "しょうがねぇなぁ……自分の影まで面倒見ろってか。",
      "読めてるふりをして、外した時が怖いだけだろ。",
      "怖くても読む。外したら、次を考える。それだけだ。",
    ],
    victory: ["面倒な影だったな。けど、置いてはいかねぇよ。", "……その調子で、先も読んでみろ。"],
  }),
  scenario25: makeIsolationDuelScenario({
    id: "scenario25",
    title: "第25話 影のROKUDO",
    stageName: "隔離区域・ROKUDOの影",
    allyUnitId: "ROKUDO",
    darkUnitId: "DARK_ROKUDO",
    allyName: "ROKUDO",
    darkName: "闇落ちROKUDO",
    intro: [
      "大丈夫？ ……いえ、自分に聞くのも変ですね。",
      "大丈夫じゃないことを、ずっと分かっていたはずです。",
      "それでも、分かっているなら向き合えます。",
    ],
    victory: ["弱さも気配のひとつです。見落とさずに進みます。", "……見えているなら、もう行けますね。"],
  }),
  scenario26: makeIsolationDuelScenario({
    id: "scenario26",
    title: "第26話 影の7171",
    stageName: "隔離区域・7171の影",
    allyUnitId: "7171",
    darkUnitId: "DARK_7171",
    allyName: "7171",
    darkName: "闇落ち7171",
    intro: [
      "自分の影にゃ。見た目より面倒そうにゃ。",
      "平気な顔で、いつも距離を取ってるだけにゃ。",
      "距離を取るのも手にゃ。でも今日は、近づいて見るにゃ。",
    ],
    victory: ["これも7171にゃ。忘れずに持っていくにゃ。", "……勝手にするにゃ。"],
  }),
  scenario27: makeIsolationDuelScenario({
    id: "scenario27",
    title: "第27話 影の明王",
    stageName: "隔離区域・明王の影",
    allyUnitId: "MYOUOU",
    darkUnitId: "DARK_MYOUOU",
    allyName: "明王",
    darkName: "闇落ち明王",
    intro: [
      "ふむ。己の影とは、なかなか趣味が悪いのう。",
      "強き者の顔をして、失うことを恐れておるだけじゃ。",
      "恐れもまた火種じゃ。ならば、焼き払わず抱えてみせよう。",
    ],
    victory: ["影よ、見事じゃ。わしもまだ進めるようじゃな。", "……ならば行くがよい。"],
  }),
  scenario28: makeIsolationDuelScenario({
    id: "scenario28",
    title: "第28話 影のhibiki",
    stageName: "隔離区域・hibikiの影",
    allyUnitId: "HIBIKI",
    darkUnitId: "DARK_HIBIKI",
    allyName: "hibiki",
    darkName: "闇落ちhibiki",
    intro: [
      "ふん。俺の影だと？ 当然、強いに決まっている。",
      "強がっていれば、震えている手を見られずに済むからな。",
      "う、うるさい！ 震えていても盾は構えられる！",
    ],
    victory: ["怖くないとは言わん。だが、俺は前に立つ。", "……それなら、守ってみせろ。"],
  }),
  scenario29: makeIsolationDuelScenario({
    id: "scenario29",
    title: "第29話 影のDeli",
    stageName: "隔離区域・Deliの影",
    allyUnitId: "DELI",
    darkUnitId: "DARK_DELI",
    allyName: "Deli",
    darkName: "闇落ちDeli",
    intro: [
      "……自分の影まで、抱え込んでいたんですね。",
      "誰にも言わず、全部ひとりで済ませようとしただけだ。",
      "それでも、ここで向き合います。ひとりで終わらせないために。",
    ],
    victory: ["弱さを見たから、少しだけ軽くなりました。", "……なら、もう隠すな。"],
  }),
  scenario30: makeIsolationDuelScenario({
    id: "scenario30",
    title: "第30話 影のやぶこ",
    stageName: "隔離区域・やぶこの影",
    allyUnitId: "YABUKO_NORMAL",
    darkUnitId: "DARK_YABUKO",
    allyName: "やぶこ",
    darkName: "闇落ちやぶこ",
    intro: [
      "これが、やぶこの影なの？ なんだか近そうなの。",
      "近い道ばかり選んで、大事なものを見落としてきたの。",
      "じゃあ、ちゃんと見るの。近くても、遠くても。",
    ],
    victory: ["これもやぶこなの。いっしょに行くの。", "……迷子にならないなら、行くの。"],
  }),
  scenario31: makeIsolationDuelScenario({
    id: "scenario31",
    title: "第31話 影のROCKEL",
    stageName: "隔離区域・ROCKELの影",
    allyUnitId: "ROCKEL",
    darkUnitId: "DARK_ROCKEL",
    allyName: "ROCKEL",
    darkName: "闇落ちROCKEL",
    intro: [
      "影でもなんでも、正面から行くっす！",
      "壊せば済むって思ってるから、守りたいものまで壊すっす。",
      "それは違うっす。壊すためじゃなく、支えるために振るうっす！",
    ],
    victory: ["力の使い方、忘れないっす。", "……なら、その腕で支えるっす。"],
  }),
  scenario32: makeIsolationDuelScenario({
    id: "scenario32",
    title: "第32話 影のPlayer",
    stageName: "隔離区域・Playerの影",
    allyUnitId: "PLAYER",
    darkUnitId: "DARK_PLAYER",
    allyName: "Player",
    darkName: "闇落ちPlayer",
    intro: [
      "かっこいい・・。でも、これが自分の影なんだ。",
      "見ているだけなら、傷つかずに済むと思っていた。",
      "もう見ているだけじゃない。ここで向き合う。",
    ],
    victory: ["これも、自分の一部なんだな。", "……進め。次は自分で選べ。"],
  }),
  scenario33: {
    id: "scenario33",
    title: "第33話 最終決戦",
    stageName: "隔離区域・最終決戦",
    boardSizeMode: "advanced11",
    scenarioType: "isolationFinalBattle",
    backgroundUrl: "/backgrounds/scenario-isolation-zone.png",
    returnScene: "isolationZone",
    placements: [
      { unitId: "SOCHO", side: "south", r: 10, c: 1, instanceId: "SC33-SOCHO" },
      { unitId: "TSUTSU", side: "south", r: 10, c: 3, instanceId: "SC33-TSUTSU" },
      { unitId: "MYOUOU", side: "south", r: 10, c: 5, instanceId: "SC33-MYOUOU" },
      { unitId: "7171", side: "south", r: 10, c: 7, instanceId: "SC33-7171" },
      { unitId: "ROKUDO", side: "south", r: 10, c: 9, instanceId: "SC33-ROKUDO" },
      { unitId: "HIBIKI", side: "south", r: 9, c: 0, instanceId: "SC33-HIBIKI" },
      { unitId: "USHIMARU", side: "south", r: 9, c: 2, instanceId: "SC33-USHIMARU" },
      { unitId: "DELI", side: "south", r: 9, c: 4, instanceId: "SC33-DELI" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 9, c: 6, instanceId: "SC33-YABUKO" },
      { unitId: "ROCKEL", side: "south", r: 9, c: 8, instanceId: "SC33-ROCKEL" },
      { unitId: "PLAYER", side: "south", r: 9, c: 10, instanceId: "SC33-PLAYER" },
      { unitId: "DARK_SOCHO", side: "north", r: 0, c: 1, instanceId: "SC33-DARK-SOCHO" },
      { unitId: "DARK_TSUTSU", side: "north", r: 0, c: 3, instanceId: "SC33-DARK-TSUTSU" },
      { unitId: "DARK_MYOUOU", side: "north", r: 0, c: 5, instanceId: "SC33-DARK-MYOUOU" },
      { unitId: "DARK_7171", side: "north", r: 0, c: 7, instanceId: "SC33-DARK-7171" },
      { unitId: "DARK_ROKUDO", side: "north", r: 0, c: 9, instanceId: "SC33-DARK-ROKUDO" },
      { unitId: "DARK_HIBIKI", side: "north", r: 1, c: 0, instanceId: "SC33-DARK-HIBIKI" },
      { unitId: "DARK_USHIMARU", side: "north", r: 1, c: 2, instanceId: "SC33-DARK-USHIMARU" },
      { unitId: "DARK_DELI", side: "north", r: 1, c: 4, instanceId: "SC33-DARK-DELI" },
      { unitId: "DARK_YABUKO", side: "north", r: 1, c: 6, instanceId: "SC33-DARK-YABUKO" },
      { unitId: "DARK_ROCKEL", side: "north", r: 1, c: 8, instanceId: "SC33-DARK-ROCKEL" },
      { unitId: "DARK_PLAYER", side: "north", r: 1, c: 10, instanceId: "SC33-DARK-PLAYER" },
    ],
    dialogs: {
      intro: [
        { speaker: "明王", text: "ここが最後の試練じゃ。皆、己の影を越えよ。" },
        { speaker: "総長", text: "OKです！ ここを越えれば、みんなで前に進めます！" },
        { speaker: "つつ", text: "しょうがねぇなぁ……最後まで付き合うしかねぇか。" },
        { speaker: "ROKUDO", text: "大丈夫？ でも、ここはもう逃げる場所ではありません。" },
        { speaker: "7171", text: "全員まとめて来るにゃ。見ものだにゃ。" },
        { speaker: "hibiki", text: "ふん……相手が影だろうが、本物が負ける道理はない。" },
        { speaker: "うしまる", text: "釣り上げる相手が増えたみたいっすね。" },
        { speaker: "Deli", text: "ここで止まるわけにはいかない……やるしかない。" },
        { speaker: "やぶこ", text: "ちょっとこわいけど、みんな一緒なら大丈夫なの？" },
        { speaker: "ROCKEL", text: "全部まとめてぶっ壊すっす！" },
        { speaker: "Player", text: "かっこいい・・。僕も、負けない・・。" },
        { speaker: "明王", text: "来るぞ。闇の軍勢……最終決戦開始じゃ！" },
      ],
      victory: [
        { speaker: "総長", text: "OKです！ みんな、乗り越えました！" },
        { speaker: "ROKUDO", text: "闇の気配が、静かにほどけていきます。" },
        { speaker: "7171", text: "これで終わりにゃ。ようやく片付いたにゃ。" },
        { speaker: "hibiki", text: "当然だ。俺たちが負けるわけないだろう。" },
        { speaker: "うしまる", text: "怖いものがあっても、進めるって分かったっす。" },
        { speaker: "Deli", text: "……これで、背負い込むだけじゃなくて済みそうだ。" },
        { speaker: "やぶこ", text: "みんなの影も、ちゃんと前に進めたの？" },
        { speaker: "ROCKEL", text: "最高の決着っす！" },
        { speaker: "Player", text: "かっこいい・・。みんな、本当にかっこいい・・。" },
        { speaker: "明王", text: "見事じゃ。己の影を越えし者たちよ、その証を受け取るがよい。" },
        { speaker: "システム", text: "闇スキンを解放しました。" },
      ],
      defeat: [
        { speaker: "明王", text: "影は濃い。じゃが、ここで終わりではない。" },
        { speaker: "総長", text: "OKです……もう一度、全員で立て直しましょう。" },
      ],
    },
  },
  scenario_plaza_monten: {
    id: "scenario_plaza_monten",
    title: "Monten Trial",
    stageName: "Astoria Plaza",
    boardSizeMode: "starter7",
    backgroundUrl: "/backgrounds/scenario-town.png",
    placements: [
      { unitId: "MYOUOU", side: "south", r: 5, c: 3, instanceId: "SPM-MYOUOU" },
      { unitId: "MONTEN", side: "north", r: 2, c: 3, instanceId: "SPM-MONTEN", hp: 7 },
    ],
    dialogs: {
      intro: [
        { speaker: "門天", text: "ここは力を試す広場だ。" },
        { speaker: "明王", text: "ふむ。相手に不足はなさそうじゃ。" },
        { speaker: "門天", text: "勝てば、奥に眠る気配を感じ取れるだろう。" },
        { speaker: "明王", text: "面白い。ならば、少し遊んでやるかのう。" },
      ],
      victory: [
        { speaker: "門天", text: "見事だ。その力、確かに見届けた。" },
        { speaker: "明王", text: "当然じゃ。……だが、この先の気配は少し厄介そうじゃな。" },
        { speaker: "門天", text: "Gの部屋の左上。そこに、赤い気配が残る。" },
        { speaker: "明王", text: "ほう。隠しきれておらぬようじゃな。" },
      ],
      defeat: [
        { speaker: "門天", text: "まだ届かぬ。出直してくるがいい。" },
        { speaker: "明王", text: "ふん……少し油断しただけじゃ。" },
        { speaker: "門天", text: "ならば次は、本気で来ることだ。" },
      ],
    },
  },
  scenario_hidden_myouou: {
    id: "scenario_hidden_myouou",
    title: "隠し試練 明王",
    stageName: "明王の隠し部屋",
    boardSizeMode: "starter7",
    placements: [
      { unitId: "SOCHO", side: "south", r: 5, c: 3, instanceId: "SCH-SOCHO" },
      { unitId: "ROKUDO", side: "south", r: 5, c: 2, instanceId: "SCH-ROKUDO" },
      { unitId: "7171", side: "south", r: 5, c: 4, instanceId: "SCH-7171" },
      { unitId: "HIDDEN_MYOUOU", side: "north", r: 2, c: 3, instanceId: "SCH-HIDDEN-MYOUOU", hp: 18 },
    ],
    dialogs: {
      intro: [
        { speaker: "明王", text: "……よくぞ、この場所を見つけたのじゃ。" },
        { speaker: "ROKUDO", text: "明王様……これは、試練ですか？" },
        { speaker: "7171", text: "嫌な予感しかしないにゃ。" },
        { speaker: "総長", text: "行きましょう。ここまで来たなら、退けません。" },
      ],
      victory: [
        { speaker: "明王", text: "見事じゃ。少しは、未来を託せそうじゃな。" },
        { speaker: "ROKUDO", text: "……ありがとうございます。" },
        { speaker: "7171", text: "もう二度とやりたくないにゃ。" },
        { speaker: "総長", text: "まだまだ、先へ進めそうです。" },
      ],
      defeat: [
        { speaker: "明王", text: "まだ早い。出直すのじゃ。" },
        { speaker: "総長", text: "……修行が足りませんでした。" },
        { speaker: "ROKUDO", text: "次こそは……。" },
      ],
    },
  },
  scenario_hidden_author: {
    id: "scenario_hidden_author",
    title: "創造主の試練",
    stageName: "作者の間",
    boardSizeMode: "intermediate9",
    placements: [
      { unitId: "TSUTSU", side: "south", r: 7, c: 1, instanceId: "SCA-TSUTSU" },
      { unitId: "ROKUDO", side: "south", r: 7, c: 2, instanceId: "SCA-ROKUDO" },
      { unitId: "SOCHO", side: "south", r: 7, c: 3, instanceId: "SCA-SOCHO" },
      { unitId: "MYOUOU", side: "south", r: 7, c: 4, instanceId: "SCA-MYOUOU" },
      { unitId: "7171", side: "south", r: 7, c: 5, instanceId: "SCA-7171" },
      { unitId: "HIBIKI", side: "south", r: 7, c: 6, instanceId: "SCA-HIBIKI" },
      { unitId: "USHIMARU", side: "south", r: 7, c: 7, instanceId: "SCA-USHIMARU" },
      { unitId: "DELI", side: "south", r: 8, c: 2, instanceId: "SCA-DELI" },
      { unitId: "YABUKO_NORMAL", side: "south", r: 8, c: 3, instanceId: "SCA-YABUKO" },
      { unitId: "ROCKEL", side: "south", r: 8, c: 5, instanceId: "SCA-ROCKEL" },
      { unitId: "PLAYER", side: "south", r: 8, c: 6, instanceId: "SCA-PLAYER" },
      { unitId: "ROKUDO_AUTHOR", side: "north", r: 2, c: 4, instanceId: "SCA-ROKUDO-AUTHOR", hp: 69 },
    ],
    dialogs: {
      intro: [
        { speaker: "作者ロクド", text: "……ここまで来たんだね。" },
        { speaker: "明王", text: "ふむ。ついに、この場所まで辿り着いたか。" },
        { speaker: "ROKUDO", text: "ロクドさん……あなたが、最後の相手なのですね。" },
        { speaker: "7171", text: "作者と戦うとか、聞いてないにゃ。" },
        { speaker: "総長", text: "それでも、進みます。これが最後の試練なら。" },
      ],
      victory: [
        { speaker: "作者ロクド", text: "すごいね。ここまで育ったんだ。" },
        { speaker: "明王", text: "見事じゃ。Gの部屋は、もうおぬしら自身の物語じゃ。" },
        { speaker: "ROKUDO", text: "……ありがとうございます。これからも、進みます。" },
        { speaker: "総長", text: "これが終わりではありません。ここからが、始まりです。" },
      ],
      defeat: [
        { speaker: "作者ロクド", text: "まだ早いかな。でも、ここまで来たことは誇っていい。" },
        { speaker: "明王", text: "鍛え直してくるのじゃ。" },
        { speaker: "7171", text: "次は勝つにゃ……たぶん。" },
        { speaker: "総長", text: "もう一度、挑みましょう。" },
      ],
    },
  },
};

export function getScenarioConfig(scenarioId: ScenarioId) {
  return SCENARIOS[scenarioId] ?? null;
}
