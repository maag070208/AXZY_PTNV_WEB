import { useCallback, useEffect, useState } from "react";
import { turnoverApi, type TurnoverQueue } from "@entities/hotel-linen";

/** Refresco automático de la cola (no hay websockets): consulta cada ~20 s mientras la pestaña está visible. */
export const POLL_MS = 20_000;

export function useTurnoverQueue() {
  const [queue, setQueue] = useState<TurnoverQueue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setQueue(await turnoverApi.queue());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => {
      if (!document.hidden) void reload();
    }, POLL_MS);
    const onVisible = () => !document.hidden && void reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  return { queue, error, reload };
}
