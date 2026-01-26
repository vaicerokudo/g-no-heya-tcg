import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

type UseLongPressOptions = {
  longPressMs?: number;
  moveCancelPx?: number;
  onLongPress: (e: PointerEvent) => void;
  onClick?: (e: PointerEvent) => void;
  disabled?: boolean;
};

export function useLongPress({
  longPressMs = 420,
  moveCancelPx = 10,
  onLongPress,
  onClick,
  disabled = false,
}: UseLongPressOptions) {
  const [pressPct, setPressPct] = useState(0);
  const isPressingRef = useRef(false);
  const firedRef = useRef(false);
  const startPtRef = useRef<Point | null>(null);
  const startTsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    isPressingRef.current = false;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startPtRef.current = null;
    setPressPct(0);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      firedRef.current = false;
      isPressingRef.current = true;
      startPtRef.current = { x: e.clientX, y: e.clientY };
      startTsRef.current = performance.now();

      e.currentTarget.setPointerCapture?.(e.pointerId);

      const tick = () => {
        if (!isPressingRef.current) return;
        const t = performance.now() - startTsRef.current;
        const pct = Math.max(0, Math.min(1, t / longPressMs));
        setPressPct(Math.floor(pct * 100));
        if (pct < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      timerRef.current = window.setTimeout(() => {
        if (!isPressingRef.current) return;
        firedRef.current = true;
        stop();
        onLongPress(e.nativeEvent);
      }, longPressMs);
    },
    [disabled, longPressMs, onLongPress, stop]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPressingRef.current || !startPtRef.current) return;
      const s = startPtRef.current;
      const dist = Math.hypot(e.clientX - s.x, e.clientY - s.y);
      if (dist > moveCancelPx) stop();
    },
    [moveCancelPx, stop]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      const wasFired = firedRef.current;
      stop();
      if (!wasFired) onClick?.(e.nativeEvent);
      firedRef.current = false;
    },
    [disabled, onClick, stop]
  );

  const onPointerCancel = useCallback(() => stop(), [stop]);
  const onPointerLeave = useCallback(() => stop(), [stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    pressPct,
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave },
  };
}
