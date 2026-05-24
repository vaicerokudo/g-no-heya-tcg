import { drawN, shuffle } from "./deck";

type UnitDefLike = {
  name?: string;
  enemyOnly?: boolean;
};

export type HandPick = { uid: string; idx: number };

export function buildDeckUnitIds(unitsById: Record<string, UnitDefLike>) {
  const allUnitIdsRaw = Object.keys(unitsById).filter((id) => id !== "YABUKO_FM" && !unitsById[id]?.enemyOnly);

  const uniqByName = new Map<string, string>();
  for (const id of allUnitIdsRaw) {
    const name = unitsById[id]?.name ?? id;
    if (!uniqByName.has(name)) uniqByName.set(name, id);
  }

  return [...uniqByName.values()];
}

export function buildInitialHandsAndDecks(unitsById: Record<string, UnitDefLike>, handSize = 5) {
  const allUnitIds = buildDeckUnitIds(unitsById);

  const southDeck0 = shuffle(allUnitIds);
  const { take: handSouth, rest: deckSouth } = drawN(southDeck0, handSize);

  const northDeck0 = shuffle(allUnitIds);
  const { take: handNorth, rest: deckNorth } = drawN(northDeck0, handSize);

  return {
    allUnitIds,
    deckSouth,
    handSouth,
    deckNorth,
    handNorth,
  };
}

export function parseHandKey(key: string | null): HandPick | null {
  if (!key) return null;
  const match = key.match(/^(.*)-(\d+)$/);
  if (!match) return null;
  return { uid: match[1], idx: Number(match[2]) };
}

export function getSelectedHandUnitId(hand: string[], selectedHandPick: HandPick | null) {
  if (!selectedHandPick) return null;
  return hand[selectedHandPick.idx] ?? null;
}

export function removeHandCardAtIndex(hand: string[], index: number) {
  return hand.filter((_, i) => i !== index);
}
