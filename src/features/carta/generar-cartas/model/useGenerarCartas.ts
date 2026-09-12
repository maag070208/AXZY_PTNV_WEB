import { useCallback, useEffect, useState } from "react";
import { cartasApi, type GenerateCartasResult } from "@entities/carta";
import { deviceTypeApi as deviceTypesApi, type DeviceType } from "@entities/device-type";

export const useGenerarCartas = () => {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeId, setTypeId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateCartasResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    deviceTypesApi
      .list()
      .then((list) => {
        if (cancelled) return;
        const active = list.filter((t) => t.active);
        setTypes(active);
        if (active.length) setTypeId(active[0].id);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!typeId) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const data = await cartasApi.generate(typeId);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }, [typeId]);

  return {
    types,
    loading,
    error,
    setError,
    typeId,
    setTypeId,
    generating,
    handleGenerate,
    result,
  };
};