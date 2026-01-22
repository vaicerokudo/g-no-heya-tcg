import type { UnitsData, UnitDef } from "./types";

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function isNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateMovePattern(mp: any, unitId: string) {
  assert(mp && typeof mp === "object", `${unitId}: movePattern missing`);
  assert(typeof mp.type === "string", `${unitId}: movePattern.type missing`);
  if (mp.type === "orthogonal") {
    assert(isNumber(mp.range), `${unitId}: orthogonal.range must be number`);
    assert(typeof mp.diagonal === "boolean", `${unitId}: orthogonal.diagonal must be boolean`);
    assert(typeof mp.canPassThroughUnits === "boolean", `${unitId}: orthogonal.canPassThroughUnits must be boolean`);
  } else if (mp.type === "custom") {
    assert(Array.isArray(mp.movesRelative), `${unitId}: custom.movesRelative must be array`);
    for (const m of mp.movesRelative) {
      assert(isNumber(m.dx) && isNumber(m.dy), `${unitId}: custom move dx/dy must be numbers`);
    }
    assert(typeof mp.canPassThroughUnits === "boolean", `${unitId}: custom.canPassThroughUnits must be boolean`);
  } else if (mp.type === "teleportFixed") {
    assert(Array.isArray(mp.destinationsRelative), `${unitId}: teleportFixed.destinationsRelative must be array`);
    for (const m of mp.destinationsRelative) {
      assert(isNumber(m.dx) && isNumber(m.dy), `${unitId}: teleportFixed dx/dy must be numbers`);
    }
    assert(typeof mp.canPassThroughUnits === "boolean", `${unitId}: teleportFixed.canPassThroughUnits must be boolean`);
  } else {
    throw new Error(`${unitId}: unknown movePattern.type = ${mp.type}`);
  }
}

function validateUnit(u: UnitDef) {
  assert(typeof u.id === "string" && u.id.length > 0, "unit.id invalid");
  assert(typeof u.name === "string" && u.name.length > 0, `${u.id}: name invalid`);
  assert(u.base && typeof u.base === "object", `${u.id}: base missing`);
  assert(isNumber(u.base.atk), `${u.id}: base.atk must be number`);
  assert(isNumber(u.base.hp), `${u.id}: base.hp must be number`);
  validateMovePattern((u as any).base.movePattern, u.id);

  if (u.skills?.skill1) {
    assert(u.skills.skill1.type === "active", `${u.id}: skill1.type must be active`);
    assert(typeof u.skills.skill1.id === "string", `${u.id}: skill1.id invalid`);
    assert(typeof u.skills.skill1.name === "string", `${u.id}: skill1.name invalid`);
    assert(typeof (u.skills.skill1 as any).targeting === "object", `${u.id}: skill1.targeting missing`);
    assert(typeof (u.skills.skill1 as any).effect === "object", `${u.id}: skill1.effect missing`);
  }
  if (u.skills?.skill2) {
    assert(u.skills.skill2.type === "active", `${u.id}: skill2.type must be active`);
    assert((u.skills.skill2 as any).requiresEvolved === true, `${u.id}: skill2.requiresEvolved should be true`);
  }

  if (u.transform) {
    assert(typeof u.transform.toUnitId === "string", `${u.id}: transform.toUnitId invalid`);
    assert(u.transform.trigger?.type === "hpThreshold", `${u.id}: transform.trigger.type must be hpThreshold`);
    assert(isNumber(u.transform.trigger.value), `${u.id}: transform.trigger.value must be number`);
    assert(u.transform.trigger.comparison === "<=", `${u.id}: transform.trigger.comparison must be <=`);
  }
}

export function validateUnitsData(data: UnitsData) {
  assert(data && typeof data === "object", "units data missing");
  assert(Array.isArray(data.units), "units must be array");
  const ids = new Set<string>();
  for (const u of data.units) {
    validateUnit(u);
    assert(!ids.has(u.id), `duplicate unit id: ${u.id}`);
    ids.add(u.id);
  }
  // Quick sanity checks
assert(ids.has("MYOUOU"), "MYOUOU must exist");

  assert(ids.has("YABUKO_NORMAL") && ids.has("YABUKO_FM"), "YABUKO_NORMAL and YABUKO_FM must exist");
  return true;
}
