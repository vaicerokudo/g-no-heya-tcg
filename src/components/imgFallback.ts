import { useCallback, useEffect, useMemo, useState } from "react";

type Opts = {
  placeholder?: string;
};

const failedImagePaths = new Set<string>();

export function useImgFallback(candidates: string[], opts?: Opts) {
  const list = useMemo(
    () => (candidates ?? []).filter((src) => src && !failedImagePaths.has(src)),
    [candidates]
  );
  const [idx, setIdx] = useState(0);


  useEffect(() => {
    setIdx(0);
  }, [list]);

  const src = list[idx] ?? opts?.placeholder ?? list[0] ?? "";

  const onError = useCallback(() => {
    if (src) failedImagePaths.add(src);

    setIdx((prev) => {
      let next = prev + 1;
      while (next < list.length && failedImagePaths.has(list[next])) {
        next += 1;
      }
      return next < list.length ? next : list.length;
    });
  }, [list, src]);

  return { src, onError };
}
