import type { ComponentProps, CSSProperties, Dispatch, SetStateAction } from "react";
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
  initialDeployCount: number;
  battleDeployUsed: boolean;
  unitsById: Record<string, UnitDef>;
  southSkin: Skin;
  getDeckBackPath: (skin: Skin) => string;
  getHandCardSrc: (unitId: string, side: Side, skin: Skin) => string;
  getHandFallbackSrc: (unitId: string, side: Side, skin: Skin) => string;
  compactWideBoard?: boolean;
  showHandDeck?: boolean;
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
  initialDeployCount,
  battleDeployUsed,
  unitsById,
  southSkin,
  getDeckBackPath,
  getHandCardSrc,
  getHandFallbackSrc,
  compactWideBoard = false,
  showHandDeck = true,
  ...boardProps
}: GameBoardAreaProps) {
  const showSouthHandDeck = showHandDeck && phase !== "setup_draw";
  const isWideBoard = boardProps.cols >= 9;
  const areaStyle = {
    display: "flex",
    gap: "var(--game-board-area-gap, 12px)",
    flexDirection: compactWideBoard ? "column" : undefined,
    flexWrap: compactWideBoard ? "nowrap" : undefined,
    alignItems: compactWideBoard ? "center" : "flex-start",
    justifyContent: "center",
    width: compactWideBoard ? "100%" : undefined,
    maxWidth: "100%",
    "--game-board-area-gap": compactWideBoard ? "4px" : undefined,
    "--bottom-bar-space": `${bottomBarH + 12}px`,
  } as CSSProperties;

  return (
    <div
      className={`gameBoardArea${isWideBoard ? " gameBoardArea--wideBoard" : ""}${compactWideBoard ? " gameBoardArea--compactWideBoard" : ""}`}
      style={areaStyle}
    >
      {showSouthHandDeck && <SouthDeck deckSouth={deckSouth} skin={southSkin} getDeckBackPath={getDeckBackPath} />}

      <div
        className="gameBoardBoard"
        style={{
          flex: "0 0 auto",
          width: compactWideBoard ? "100%" : undefined,
          display: compactWideBoard ? "flex" : undefined,
          justifyContent: compactWideBoard ? "center" : undefined,
        }}
      >
        <Board {...boardProps} unitsById={unitsById} />
      </div>

      {showSouthHandDeck && (
        <div className="southHandDeckRail">
          <SouthHand
            phase={phase}
            handSouth={handSouth}
            selectedHandKey={selectedHandKey}
            setSelectedHandKey={setSelectedHandKey}
            selectedHandUnitId={selectedHandUnitId}
            deployPlaced={deployPlaced}
            initialDeployCount={initialDeployCount}
            battleDeployUsed={battleDeployUsed}
            unitsById={unitsById}
            skin={southSkin}
            getHandCardSrc={getHandCardSrc}
            getHandFallbackSrc={getHandFallbackSrc}
          />
        </div>
      )}
    </div>
  );
}
