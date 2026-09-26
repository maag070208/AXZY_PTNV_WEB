import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { reportsApi, type AssignedDeviceRow } from "@entities/report";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

export type DownloadAssignedDevicesPdf = (rows: AssignedDeviceRow[]) => Promise<void>;

interface Options {
  download: DownloadAssignedDevicesPdf;
}

export const useAssignedDevicesReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [rows, setRows] = useState<AssignedDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .assigned()
      .then((res) => setRows(res.data))
      .catch((e: any) => setError(e.message ?? t("assigned.errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const averageDays = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(
      rows.reduce((acc, r) => acc + (r.daysAssigned ?? 0), 0) / rows.length
    );
  }, [rows]);

  const moreDe30 = useMemo(
    () => rows.filter((r) => (r.daysAssigned ?? 0) > 30).length,
    [rows]
  );

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      await download(rows);
    } catch (e) {
      console.error("Error al exportar PDF de asignados", e);
    } finally {
      setExporting(false);
    }
  }, [download, rows]);

  // ITDataTable exige un fetchData asíncrono (page/limit); como el universo
  // de asignados activos es acotado, paginamos en el cliente sobre `rows`.
  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<AssignedDeviceRow>> => {
      const start = (params.page - 1) * params.limit;
      return {
        data: rows.slice(start, start + params.limit),
        total: rows.length,
      };
    },
    [rows]
  );

  return {
    t,
    rows,
    loading,
    error,
    setError,
    exporting,
    reloadKey,
    setReloadKey,
    averageDays,
    moreDe30,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseAssignedDevicesReport = ReturnType<typeof useAssignedDevicesReport>;