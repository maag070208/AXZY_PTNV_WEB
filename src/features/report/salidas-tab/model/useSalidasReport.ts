import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { salidasApi, type MaterialOutput, type SalidaFilters } from "@entities/salida";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

export type DownloadSalidasPdf = (rows: MaterialOutput[]) => Promise<void>;

interface Options {
  download: DownloadSalidasPdf;
}

export const useSalidasReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [total, setTotal] = useState(0);
  const [lastFilters, setLastFilters] = useState<SalidaFilters>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTableData = useCallback(
    async (
      params: ITDataTableFetchParams
    ): Promise<ITDataTableResponse<Record<string, unknown>>> => {
      const filters = params.filters as unknown as SalidaFilters;
      setLastFilters(filters);
      try {
        const res = await salidasApi.table({
          page: params.page,
          limit: params.limit,
          filters: params.filters as Record<string, string | number | boolean>,
          sort: params.sort,
        });
        setTotal(res.total);
        return {
          data: res.data as unknown as Record<string, unknown>[],
          total: res.total,
        };
      } catch (e: any) {
        setError(e.message ?? t("salidas.errorLoad"));
        return { data: [], total: 0 };
      }
    },
    [t]
  );

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      const res = await salidasApi.list(lastFilters);
      await download(res.data);
    } catch (e) {
      console.error("Error al exportar PDF de salidas", e);
    } finally {
      setExporting(false);
    }
  }, [download, lastFilters]);

  return {
    t,
    total,
    error,
    setError,
    exporting,
    reloadKey,
    setReloadKey,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseSalidasReport = ReturnType<typeof useSalidasReport>;
