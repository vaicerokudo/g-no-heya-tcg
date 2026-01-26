type Props = {
  open: boolean;
  disabled?: boolean;
  disabledTitle?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function TurnEndConfirm({
  open,
  disabled = false,
  disabledTitle = "",
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: 360,
          maxWidth: "90vw",
          background: "#111",
          border: "1px solid #444",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
          ターン終了しますか？
        </div>

        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
          自軍ユニットの行動がすべて完了しました。
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "6px 10px" }}>
            いいえ
          </button>

          <button
            disabled={disabled}
            onClick={onConfirm}
            style={{
              padding: "6px 10px",
              fontWeight: 800,
              opacity: disabled ? 0.6 : 1,
            }}
            title={disabled ? disabledTitle : ""}
          >
            はい（ターン終了）
          </button>
        </div>
      </div>
    </div>
  );
}
