import type { Side } from "./types";

export function otherSide(side: Side): Side {
  return side === "south" ? "north" : "south";
}
