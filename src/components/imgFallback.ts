import { useCallback, useEffect, useMemo, useState } from "react";

type Opts = {
  placeholder?: string;
};

export function useImgFallback(candidates: string[], opts?: Opts) {
  const list = useMemo(() => (candidates ?? []).filter(Boolean), [candidates]);
  const [idx, setIdx] = useState(0);


  useEffect(() => {
    setIdx(0);
  }, [list]);

  const src = list[idx] ?? opts?.placeholder ?? list[0] ?? "";

  const onError = useCallback(() => {
    setIdx((prev) => {
      const next = prev + 1;
      return next < list.length ? next : prev;
    });
  }, [list.length]);

  return { src, onError };
}
