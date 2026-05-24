import type { BoardSizeMode } from "../boardConfig";
import type { Form, Side } from "../types";

export type ScenarioId = "scenario1";
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
  placements: ScenarioUnitPlacement[];
  dialogs: Record<ScenarioDialogKind, ScenarioLine[]>;
};

export const SCENARIO1_ID: ScenarioId = "scenario1";

export const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  scenario1: {
    id: SCENARIO1_ID,
    title: "シナリオ1：初めてのボア戦",
    stageName: "街の門前",
    boardSizeMode: "starter7",
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
};

export function getScenarioConfig(scenarioId: ScenarioId) {
  return SCENARIOS[scenarioId] ?? null;
}
