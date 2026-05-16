import type { ComponentProps, Dispatch, SetStateAction } from "react";
import type { Skin } from "../assets/imagePaths";
import type { Side, UnitDef } from "../game/types";
import { Board } from "./Board/Board";
import { SouthDeck, SouthHand } from "./SouthHandDeck";

type Phase = "setup_draw" | "setup_deploy" | "battle";
type BoardComponentProps = ComponentProps<typeof Board>;

type GameBoardAreaProps = BoardComponentProps & {
  phase: Phase;
  bottomBarH: number;
  deckSouth: string[];
  handSouth: string[];
  selectedHandKey: string | null;
  setSelectedHandKey: Dispatch<SetStateAction<string | null>>;
  selectedHandUnitId: string | null;
  deployPlaced: number;
  battleDeployUsed: boolean;
  unitsById: Record<string, UnitDef>;
  southSkin: Skin;
  getDeckBackPath: (skin: Skin) => string;
  getHandCardSrc: (unitId: string, side: Side, skin: Skin) => string;
  getHandFallbackSrc: (unitId: string, side: Side, skin: Skin) => string;
};

export function GameBoardArea({
  phase,
  bottomBarH,
  deckSouth,
  handSouth,
  selectedHandKey,
  setSelectedHandKey,
  selectedHandUnitId,
  deployPlaced,
  battleDeployUsed,
  unitsById,
  southSkin,
  getDeckBackPath,
  getHandCardSrc,
  getHandFallbackSrc,
  ...boardProps
}: GameBoardAreaProps) {
  const showSouthHandDeck = phase !== "setup_draw";

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        justifyContent: "center",
        maxWidth: "100%",
        paddingBottom: bottomBarH + 12,
      }}
    >
      {showSouthHandDeck && <SouthDeck deckSouth={deckSouth} skin={southSkin} getDeckBackPath={getDeckBackPath} />}

      <div style={{ flex: "0 0 auto" }}>
        <Board {...boardProps} unitsById={unitsById} />
      </div>

      {showSouthHandDeck && (
        <SouthHand
          phase={phase}
          handSouth={handSouth}
          selectedHandKey={selectedHandKey}
          setSelectedHandKey={setSelectedHandKey}
          selectedHandUnitId={selectedHandUnitId}
          deployPlaced={deployPlaced}
          battleDeployUsed={battleDeployUsed}
          unitsById={unitsById}
          skin={southSkin}
          getHandCardSrc={getHandCardSrc}
          getHandFallbackSrc={getHandFallbackSrc}
        />
      )}
    </div>
  );
}
