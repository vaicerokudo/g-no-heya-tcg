

import boardBg from "../../assets/boards/board_bg.png";
import { Cell } from "./Cell";

import { getEffectiveMaxHp } from "../../game/stats";


type BoardProps = {
  rows: number;
  cols: number;
  cellSize: number;
  portraitSize: number;

  letters: string[];
  occ: Map<string, any>;

  selectedId: string | null;
  turn: "south" | "north";
  gameOver: boolean;

  legalMoveSet: Set<string>;
  attackRangeSet: Set<string>;
  attackBlockerSet: Set<string>;
  attackSet: Set<string>;
  skillMode: string | null;
  skillTargetSet: Set<string>;

  debugTargetId: string | null;

  unitsById: any;
  getPortrait: (unitId: string, side: "south" | "north") => string;
  posKey: (r: number, c: number) => string;

  canSelect: (inst: any) => boolean;

  onCellClick: (r: number, c: number, inst: any | null) => void;
  onLongPressUnit: (inst: any) => void;
  onShiftEnemyPick: (enemyInstanceId: string) => void;
};

export function Board(props: BoardProps) {
  const {
    rows,
    cols,
    cellSize,
    portraitSize,
    letters,
    occ,
    selectedId,
    turn,
    gameOver,
    legalMoveSet,
    attackRangeSet,
    attackBlockerSet,
    attackSet,
    skillMode,
    skillTargetSet,
    debugTargetId,
    unitsById,
    getPortrait,
    posKey,
    canSelect,
    onCellClick,
    onLongPressUnit,
    onShiftEnemyPick,
  } = props;

  return (
    <div
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        touchAction: "manipulation",
        maxWidth: "100%",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div
          style={{
            width: cols * cellSize,
            height: rows * cellSize,
            borderRadius: 12,
            overflow: "hidden",
            backgroundImage: `url(${boardBg})`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              width: cols * cellSize,
              height: rows * cellSize,
            }}
          >
            {Array.from({ length: rows * cols }).map((_, idx) => {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              const label = `${letters[c]}${r + 1}`;

              const k = posKey(r, c);
              const inst = occ.get(k) ?? null;
const form = inst?.form ?? "base";
const maxHp =
  inst && unitsById?.[inst.unitId]
    ? getEffectiveMaxHp(unitsById[inst.unitId].base.hp, form)
    : undefined;


              const isSelected = !!inst && inst.instanceId === selectedId;

              const isGateNorth = r === 0 && (c === 1 || c === 3 || c === 5);
              const isGateSouth = r === 6 && (c === 1 || c === 3 || c === 5);

              const inSkill = !!skillMode;
              const isLegalMove = legalMoveSet.has(k);
              const isAttackRange = attackRangeSet.has(k);
              const isAttackBlocker = attackBlockerSet.has(k);
              const isAttackableEnemy = !!inst && inst.side !== turn && attackSet.has(inst.instanceId);
              const isSkillTarget = inSkill && skillTargetSet.has(k);

              const baseBg = inst
                ? inst.side === "south"
                  ? "rgba(31,42,68,0.78)"
                  : "rgba(68,32,31,0.78)"
                : "transparent";

              const gateTint = isGateNorth
                ? "rgba(26,42,26,0.55)"
                : isGateSouth
                  ? "rgba(42,26,26,0.55)"
                  : "";

              const showMove = !inSkill && isLegalMove;
              const showRng = !inSkill && isAttackRange;

              const bg = isSelected
                ? "rgba(255,255,255,0.12)"
                : isSkillTarget
                  ? "rgba(90,74,0,0.70)"
                  : isAttackableEnemy
                    ? "rgba(85,34,34,0.80)"
                    : showRng
                      ? "rgba(138,122,0,0.55)"
                      : isAttackBlocker
                        ? "rgba(255,255,255,0.12)"
                        : showMove
                          ? "rgba(34,68,34,0.65)"
                          : gateTint
                            ? gateTint
                            : baseBg;

              const cursor = inSkill
                ? isSkillTarget
                  ? "pointer"
                  : "not-allowed"
                : inst
                  ? canSelect(inst)
                    ? inst.side === turn
                      ? "pointer"
                      : isAttackableEnemy
                        ? "pointer"
                        : "default"
                    : isAttackableEnemy
                      ? "pointer"
                      : "not-allowed"
                  : isLegalMove && !gameOver
                    ? "pointer"
                    : "default";

              


              return (
                <Cell
                  key={k}
                  cellSize={cellSize}
                  portraitSize={portraitSize}
getPortrait={getPortrait}
maxHp={maxHp}

                  label={label}
                  r={r}
                  c={c}
                  inst={inst}
                  bg={bg}
                  cursor={cursor}
                  showRng={showRng}
                  isAttackBlocker={isAttackBlocker}
                  isAttackableEnemy={isAttackableEnemy}
                  isDebugTarget={!!inst && inst.instanceId === debugTargetId}
                  disableInput={gameOver}
                  onClickCell={() => onCellClick(r, c, inst)}
                  enableLongPress={!!inst}
                  onLongPressUnit={() => {
                    if (!inst) return;
                    onLongPressUnit(inst);
                  }}
                  onShiftEnemyPick={
                    inst && inst.side !== turn
                      ? () => onShiftEnemyPick(inst.instanceId)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
