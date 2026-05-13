import type { Side } from "../game/types";
import type { Skin } from "../assets/imagePaths";

type TopStatusBarProps = {
  skin: Skin;
  onSkinChange: (skin: Skin) => void;
  turn: Side;
  cpuEnabled: boolean;
  onToggleCpu: () => void;
  onResetGame: () => void;
  deckSouthCount: number;
  handSouthCount: number;
  deckNorthCount: number;
  handNorthCount: number;
};

export function TopStatusBar({
  skin,
  onSkinChange,
  turn,
  cpuEnabled,
  onToggleCpu,
  onResetGame,
  deckSouthCount,
  handSouthCount,
  deckNorthCount,
  handNorthCount,
}: TopStatusBarProps) {
  return (
    <>
      <h2>Gの部屋 TCG</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>スキン:</div>

        <select
          value={skin}
          onChange={(e) => onSkinChange(e.target.value as Skin)}
          style={{
            padding: "6px 8px",
            background: "#111",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 8,
            fontWeight: 800,
          }}
        >
          <option value="default">default</option>
          <option value="dark">dark</option>
          <option value="travel">travel</option>
        </select>

        <div style={{ fontSize: 12, opacity: 0.7 }}>未作成の画像は default にフォールバック推奨</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "nowrap",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: 14 }}>
          手番: <b>{turn.toUpperCase()}</b>
        </div>

        <button onClick={onToggleCpu} style={{ padding: "6px 10px" }}>
          CPU: {cpuEnabled ? "ON" : "OFF"}
        </button>

        <button onClick={onResetGame} style={{ padding: "6px 10px", cursor: "pointer" }}>
          ゲームリセット
        </button>

        <div style={{ fontSize: 12, opacity: 0.85 }}>
          South: deck {deckSouthCount} / hand {handSouthCount} North: deck {deckNorthCount} / hand {handNorthCount}
        </div>
      </div>
    </>
  );
}
