import { useCallback, useEffect, useState } from "react";
import { hotelLinenApi } from "../api/hotelLinenApi";
import type { HotelCategory, HotelUnit, HotelZone } from "./types";

/** Carga un catálogo completo para selects; `reload` lo vuelve a pedir. */
const useList = <T>(load: () => Promise<T[]>): { data: T[]; loading: boolean; reload: () => void } => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .then((rows) => active && setData(rows))
      .catch(() => active && setData([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, loading, reload };
};

export const useHotelUnitOptions = () => useList<HotelUnit>(() => hotelLinenApi.units());
export const useHotelCategoryOptions = () => useList<HotelCategory>(() => hotelLinenApi.categories());
export const useHotelZoneOptions = () => useList<HotelZone>(() => hotelLinenApi.zones());
