import { useCallback, useEffect, useState } from "react";

/** Carga de un widget: datos, estado y recarga (cada widget pide su endpoint). */
export const useWidgetData = <T,>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetcher()
      .then((res) => {
        if (!active) return;
        setData(res);
        setError(null);
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // `fetcher` es estable (métodos de `dashboardApi`); se recarga con `reload`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, error, reload };
};
