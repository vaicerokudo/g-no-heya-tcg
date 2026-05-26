import type { BoardSizeMode } from "../boardConfig";
import type { Form, Side } from "../types";

export type ScenarioId = "scenario1" | "scenario2" | "scenario3" | "scenario_hidden_myouou";
export type ScenarioDialogKind = "intro" | "victory" | "defeat";

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
  backgroundUrl?: string;
  placements: ScenarioUnitPlacement[];
  dialogs: Record<ScenarioDialogKind, ScenarioLine[]>;
};

export const SCENARIO1_ID: ScenarioId = "scenario1";

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
      { unitId: "BOAR", side: "north", r: 2, c: 3, instanceId: "SC1-BOAR", hp: 8 },
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
};

export function getScenarioConfig(scenarioId: ScenarioId) {
  return SCENARIOS[scenarioId] ?? null;
}
