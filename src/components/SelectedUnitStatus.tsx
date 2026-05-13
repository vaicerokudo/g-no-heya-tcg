import type { UnitDef, UnitInstance } from "../game/types";

type PerUnitTurn = Record<string, { moved: boolean; attacked: boolean; done: boolean }>;

type SelectedUnitStatusProps = {
  selected: UnitInstance | null;
  unitsById: Record<string, UnitDef>;
  perUnitTurn: PerUnitTurn;
};

export function SelectedUnitStatus({ selected, unitsById, perUnitTurn }: SelectedUnitStatusProps) {
  const unitName = selected ? unitsById[selected.unitId]?.name ?? selected.unitId : "なし";
  const turnState = selected ? perUnitTurn[selected.instanceId] : null;

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

      <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.9 }}>邱托ｼ晉ｧｻ蜍・/ 襍､・晄判謦・ｯｾ雎｡ / 鮟・ｼ晏ｰ・ｨ・/ ﾃ暦ｼ晞・阡ｽ</div>
    </>
  );
}
