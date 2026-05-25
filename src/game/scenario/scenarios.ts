import type { BoardSizeMode } from "../boardConfig";
import type { Form, Side } from "../types";

export type ScenarioId = "scenario1" | "scenario2" | "scenario3";
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
};

export function getScenarioConfig(scenarioId: ScenarioId) {
  return SCENARIOS[scenarioId] ?? null;
}
