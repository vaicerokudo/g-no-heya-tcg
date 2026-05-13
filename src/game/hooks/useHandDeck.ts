import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSelectedHandUnitId, parseHandKey } from "../handDeck";
import type { Side } from "../types";

type Phase = "setup_draw" | "setup_deploy" | "battle";
type CurrentRef<T> = { current: T };

type UseHandDeckArgs = {
  lastDrawKeyRef: CurrentRef<string>;
  turnRef: CurrentRef<Side>;
  phaseRef: CurrentRef<Phase>;
};

export function useHandDeck({ lastDrawKeyRef, turnRef, phaseRef }: UseHandDeckArgs) {
  const [deckSouth, setDeckSouth] = useState<string[]>([]);
  const [handSouth, setHandSouth] = useState<string[]>([]);
  const [deckNorth, setDeckNorth] = useState<string[]>([]);
  const [handNorth, setHandNorth] = useState<string[]>([]);
  const [selectedHandKey, setSelectedHandKey] = useState<string | null>(null);

  const deckSouthRef = useRef<string[]>(deckSouth);
  useEffect(() => {
    deckSouthRef.current = deckSouth;
  }, [deckSouth]);

  const deckNorthRef = useRef<string[]>(deckNorth);
  useEffect(() => {
    deckNorthRef.current = deckNorth;
  }, [deckNorth]);

  const handNorthRef = useRef<string[]>(handNorth);
  useEffect(() => {
    handNorthRef.current = handNorth;
  }, [handNorth]);

  const selectedHandPick = useMemo(() => parseHandKey(selectedHandKey), [selectedHandKey]);

  const selectedHandUnitId = useMemo(() => {
    return getSelectedHandUnitId(handSouth, selectedHandPick);
  }, [selectedHandPick, handSouth]);

  const drawAtStartOfTurn = useCallback(
    (side: Side, turnKey: string) => {
      const key = `${turnKey}:draw`;
      if (lastDrawKeyRef.current === key) return;
      lastDrawKeyRef.current = key;

      const deck = side === "south" ? deckSouthRef.current : deckNorthRef.current;
      if (!deck || deck.length === 0) return;

      const [top, ...rest] = deck;

      console.log("[DRAW]", key, "side", side, "turn", turnRef.current, "phase", phaseRef.current);
      console.log("[DRAW CARD]", side, top);

      if (side === "south") {
        setDeckSouth(rest);
        setHandSouth((hand) => [...hand, top]);
      } else {
        setDeckNorth(rest);
        setHandNorth((hand) => [...hand, top]);
      }
    },
    [lastDrawKeyRef, phaseRef, turnRef]
  );

  return {
    deckSouth,
    setDeckSouth,
    handSouth,
    setHandSouth,
    deckNorth,
    setDeckNorth,
    handNorth,
    setHandNorth,
    selectedHandKey,
    setSelectedHandKey,
    deckSouthRef,
    deckNorthRef,
    handNorthRef,
    selectedHandPick,
    selectedHandUnitId,
    drawAtStartOfTurn,
  };
}
