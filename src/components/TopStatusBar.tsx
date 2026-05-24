import type { Skin } from "../assets/imagePaths";
import { getSkinLabel } from "../assets/skinLabels";
import { BOARD_SIZE_OPTIONS, type BoardSizeMode } from "../game/boardConfig";
import type { Side } from "../game/types";

type TopStatusBarProps = {
  southSkin: Skin;
  northSkin: Skin;
  isSkinUnlocked: (skin: Skin) => boolean;
  onSouthSkinChange: (skin: Skin) => void;
  onNorthSkinChange: (skin: Skin) => void;
  boardSizeMode: BoardSizeMode;
  onBoardSizeModeChange: (mode: BoardSizeMode) => void;
  turn: Side;
  cpuEnabled: boolean;
  onToggleCpu: () => void;
  onResetGame: () => void;
  deckSouthCount: number;
  handSouthCount: number;
  deckNorthCount: number;
  handNorthCount: number;
};

const SKIN_OPTIONS: Skin[] = ["default", "dark", "travel", "comic"];

function SkinSelect({
  label,
  value,
  isSkinUnlocked,
  onChange,
}: {
  label: string;
  value: Skin;
  isSkinUnlocked: (skin: Skin) => boolean;
  onChange: (skin: Skin) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Skin)}
        style={{
          padding: "6px 8px",
          background: "#111",
          color: "#fff",
          border: "1px solid #444",
          borderRadius: 8,
          fontWeight: 800,
        }}
      >
        {SKIN_OPTIONS.map((skin) => (
          <option key={skin} value={skin} disabled={!isSkinUnlocked(skin)}>
            {isSkinUnlocked(skin) ? getSkinLabel(skin) : `${getSkinLabel(skin)}（未解放）`}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TopStatusBar({
  southSkin,
  northSkin,
  isSkinUnlocked,
  onSouthSkinChange,
  onNorthSkinChange,
  boardSizeMode,
  onBoardSizeModeChange,
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

      <div className="topStatusControls" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <SkinSelect label="味方スキン:" value={southSkin} isSkinUnlocked={isSkinUnlocked} onChange={onSouthSkinChange} />
        <SkinSelect label="CPUスキン:" value={northSkin} isSkinUnlocked={isSkinUnlocked} onChange={onNorthSkinChange} />

        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
          盤面:
          <select
            value={boardSizeMode}
            onChange={(event) => onBoardSizeModeChange(event.target.value as BoardSizeMode)}
            style={{
              padding: "6px 8px",
              background: "#111",
              color: "#fff",
              border: "1px solid #444",
              borderRadius: 8,
              fontWeight: 800,
            }}
          >
            {BOARD_SIZE_OPTIONS.map((option) => (
              <option key={option.mode} value={option.mode}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ fontSize: 12, opacity: 0.7 }}>未作成の画像は default にフォールバック</div>
      </div>

      <div
        className="topTurnControls"
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
