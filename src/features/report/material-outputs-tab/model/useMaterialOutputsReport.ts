import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { materialOutputsApi, type MaterialOutput, type MaterialOutputFilters } from "@entities/material-output";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

export type DownloadMaterialOutputsPdf = (rows: MaterialOutput[]) => Promise<void>;

interface Options {
  download: DownloadMaterialOutputsPdf;
}

export const useMaterialOutputsReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [total, setTotal] = useState(0);
  const [lastFilters, setLastFilters] = useState<MaterialOutputFilters>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTableData = useCallback(
    async (
      params: ITDataTableFetchParams
    ): Promise<ITDataTableResponse<Record<string, unknown>>> => {
      const filters = params.filters as unknown as MaterialOutputFilters;
      setLastFilters(filters);
      try {
        const res = await materialOutputsApi.table({
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
        setError(e.message ?? t("exits.errorLoad"));
        return { data: [], total: 0 };
      }
    },
    [t]
  );

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      const res = await materialOutputsApi.list(lastFilters);
      await download(res.data);
    } catch (e) {
      console.error("Error exporting the material outputs PDF", e);
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

export type UseMaterialOutputsReport = ReturnType<typeof useMaterialOutputsReport>;
