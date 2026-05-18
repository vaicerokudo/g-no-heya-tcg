import boardBg from "../../assets/boards/board_bg.png";
import { Cell } from "./Cell";

import { getEffectiveMaxHp } from "../../game/stats";
import { getGateCols, getNorthGateRow, getSouthGateRow } from "../../game/boardConfig";

type BoardProps = {
  rows: number;
  cols: number;
  cellSize: number;

  letters: string[];
  occ: Map<string, any>;

  selectedId: string | null;
  turn: "south" | "north";
  gameOver: boolean;

  legalMoveSet: Set<string>;
  initialDeploySet: Set<string>;
  attackRangeSet: Set<string>;
  attackBlockerSet: Set<string>;
  attackSet: Set<string>;
  skillMode: string | null;
  skillTargetSet: Set<string>;

  // ★追加：増援で置けるマス（Appから渡す）
  reinforceSet?: Set<string>;

  debugTargetId: string | null;

  unitsById: any;
  getPortrait: (unitId: string, side: "south" | "north", form?: "base" | "g") => string;

  getPortraitCandidates?: (
    unitId: string,
    side: "south" | "north",
    form?: "base" | "g"
  ) => string[];

  posKey: (r: number, c: number) => string;

  canSelect: (inst: any) => boolean;

  onCellClick: (r: number, c: number, inst: any | null) => void;
  onLongPressUnit: (inst: any) => void;
  onShiftEnemyPick: (enemyInstanceId: string) => void;

  dmgByInstanceId: Map<string, { id: string; amount: number }>;
  skillEventIdByInstanceId: Map<string, string>;
  attackMotionByInstanceId: Map<string, { id: string; dr: number; dc: number }>;
  moveEventIdByInstanceId: Map<string, string>;
  impactFxByCellKey: Map<string, { id: string; targetId: string }>;
  skillImpactFxByCellKey: Map<
    string,
    { id: string; skillId: string; variant: string; casterId: string; targetId: string }
  >;
};

export function Board(props: BoardProps) {
  const {
    rows,
    cols,
    cellSize,
    letters,
    occ,
    selectedId,
    turn,
    gameOver,
    legalMoveSet,
    initialDeploySet,
    attackRangeSet,
    attackBlockerSet,
    attackSet,
    skillMode,
    skillTargetSet,
    reinforceSet, // ★追加

    debugTargetId,
    unitsById,
    getPortrait,
    getPortraitCandidates,
    posKey,
    canSelect,
    onCellClick,
    onLongPressUnit,
    onShiftEnemyPick,
    dmgByInstanceId,
    skillEventIdByInstanceId,
    attackMotionByInstanceId,
    moveEventIdByInstanceId,
    impactFxByCellKey,
    skillImpactFxByCellKey,
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

              const form = (inst?.form ?? "base") as "base" | "g";
              const maxHp =
                inst && unitsById?.[inst.unitId]
                  ? getEffectiveMaxHp(unitsById[inst.unitId].base.hp, form)
                  : undefined;

              const isSelected = !!inst && inst.instanceId === selectedId;

              const gateCols = getGateCols(cols);
              const isGateCol = gateCols.includes(c);
              const isGateNorth = r === getNorthGateRow() && isGateCol;
              const isGateSouth = r === getSouthGateRow(rows) && isGateCol;

              const inSkill = !!skillMode;
              const isLegalMove = legalMoveSet.has(k);
              const isInitialDeploy = initialDeploySet.has(k);
              const isAttackRange = attackRangeSet.has(k);
              const isAttackBlocker = attackBlockerSet.has(k);
              const isAttackableEnemy = !!inst && inst.side !== turn && attackSet.has(inst.instanceId);
              const isSkillTarget = inSkill && skillTargetSet.has(k);

              // ★増援ハイライト（空きマス前提）
              const isReinforce = !inSkill && !inst && !!reinforceSet && reinforceSet.has(k);

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

              const showInitialDeploy = !inSkill && isInitialDeploy;
              const showMove = !inSkill && isLegalMove;
              const showRng = !inSkill && isAttackRange;

              const bg = isSelected
                ? "rgba(255,255,255,0.12)"
                : isSkillTarget
                  ? "rgba(90,74,0,0.70)"          // 黄：スキル対象
                  : isAttackableEnemy
                    ? "rgba(85,34,34,0.80)"       // 赤：攻撃可能
                    : showRng
                      ? "rgba(138,122,0,0.55)"    // 黄：射程
                      : isAttackBlocker
                        ? "rgba(255,255,255,0.12)" // ×遮蔽
                        : showMove
                          ? "rgba(34,68,34,0.65)" // 緑：移動
                          : isReinforce
                            ? "rgba(80,180,255,0.20)" // ★青：増援置ける
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
                  : (showInitialDeploy || isReinforce) && !gameOver
                    ? "pointer"
                    : isLegalMove && !gameOver
                      ? "pointer"
                      : "default";

              return (
                <Cell
                  key={k}
                  cellSize={cellSize}
                  getPortrait={getPortrait}
                  getPortraitCandidates={getPortraitCandidates}
                  maxHp={maxHp}
                  label={label}
                  r={r}
                  c={c}
                  inst={inst}
                  bg={bg}
                  cursor={cursor}
                  showInitialDeploy={showInitialDeploy}
                  showRng={showRng}
                  isAttackBlocker={isAttackBlocker}
                  isAttackableEnemy={isAttackableEnemy}
                  isSelected={isSelected}
                  dmgFx={inst ? dmgByInstanceId.get(inst.instanceId) ?? null : null}
                  skillEventId={inst ? skillEventIdByInstanceId.get(inst.instanceId) ?? null : null}
                  attackMotion={inst ? attackMotionByInstanceId.get(inst.instanceId) ?? null : null}
                  moveEventId={inst ? moveEventIdByInstanceId.get(inst.instanceId) ?? null : null}
                  impactFx={impactFxByCellKey.get(k) ?? null}
                  skillImpactFx={skillImpactFxByCellKey.get(k) ?? null}
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
