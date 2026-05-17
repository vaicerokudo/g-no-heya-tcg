import type { UnitDef, UnitInstance } from "../game/types";
import { buildStatusRows } from "../game/ui/statusRows";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type SelectedUnitStatusProps = {
  selected: UnitInstance | null;
  unitsById: Record<string, UnitDef>;
  perUnitTurn: PerUnitTurn;
};

export function SelectedUnitStatus({ selected, unitsById, perUnitTurn }: SelectedUnitStatusProps) {
  const unitName = selected ? unitsById[selected.unitId]?.name ?? selected.unitId : "なし";
  const turnState = selected ? perUnitTurn[selected.instanceId] : null;
  const statusRows = buildStatusRows(selected);

  return (
    <>
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        選択中: {selected ? `${selected.instanceId} / ${unitName}` : "なし"}
      </div>

      {selected && (
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          行動: <b>{turnState?.done ? "済" : "未"}</b> / M:{turnState?.moved ? "済" : "未"} / A:
          {turnState?.attacked ? "済" : "未"}
        </div>
      )}

      {selected && statusRows.length > 0 && (
        <div
          style={{
            marginBottom: 8,
            fontSize: 13,
            opacity: 0.92,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
          }}
        >
          状態: {statusRows.join(" / ")}
        </div>
      )}

      <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.9 }}>
        緑: 移動 / 赤: 攻撃対象 / 黄: 射程・スキル対象 / ×: 遮蔽
      </div>
    </>
  );
}
