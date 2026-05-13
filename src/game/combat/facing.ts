// src/game/combat/facing.ts
import type { Side } from "../types";

type Pos = { r: number; c: number };

// 簡易版：ターゲットsideで前方を固定
export function isBackOrSideSimple(
  casterPos: Pos,
  targetPos: Pos,
  targetSide: Side
) {
  const dr = casterPos.r - targetPos.r;
  const dc = casterPos.c - targetPos.c;

  // south の前方 = -1 / north の前方 = +1（確定した簡易仕様）
  const forward = targetSide === "south" ? -1 : +1;

  const isBack = dr === -forward && dc === 0;
  const isSide = dr === 0 && Math.abs(dc) === 1;

  return isBack || isSide;
}
