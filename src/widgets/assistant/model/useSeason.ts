import { useEffect, useState } from "react";
import { seasonForDate, type Season } from "./seasons";

/**
 * Temporada vigente, **dinámica**: se calcula con la fecha local al montar, se
 * vuelve a calcular cuando la pestaña recupera el foco o se hace visible y cada
 * 15 minutos, de modo que si el sistema se queda abierto el cambio de fecha
 * (o de temporada) se refleja solo, sin recargar la página.
 */
export const useSeason = (): Season | null => {
  const [season, setSeason] = useState<Season | null>(() => seasonForDate());

  useEffect(() => {
    const refresh = () => {
      const next = seasonForDate();
      setSeason((prev) => (prev?.key === next?.key ? prev : next));
    };
    const interval = window.setInterval(refresh, 15 * 60 * 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return season;
};
