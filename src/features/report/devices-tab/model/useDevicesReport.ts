import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { reportsApi, type DeviceReportRow } from "@entities/report";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

export type DownloadDevicesPdf = (rows: DeviceReportRow[]) => Promise<void>;

interface Options {
  download: DownloadDevicesPdf;
}

export const useDevicesReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [rows, setRows] = useState<DeviceReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .devices()
      .then((res) => setRows(res.data))
      .catch((e: any) => setError(e.message ?? t("devices.errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      await download(rows);
    } catch (e) {
      console.error("Error al exportar PDF de dispositivos", e);
    } finally {
      setExporting(false);
    }
  }, [download, rows]);

  const stats = useMemo(() => {
    const asignados = rows.filter((r) => r.estado === "ASIGNADO").length;
    const disponibles = rows.filter((r) => r.estado === "DISPONIBLE").length;
    const bajas = rows.filter((r) => r.estado === "BAJA").length;
    const masDe30 = rows.filter((r) => (r.diasAsignado ?? 0) > 30).length;
    return { asignados, disponibles, bajas, masDe30 };
  }, [rows]);

  // ITDataTable exige fetchData asíncrono (page/limit); el universo de
  // dispositivos es acotado, así que paginamos en el cliente sobre `rows`.
  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<DeviceReportRow>> => {
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
    stats,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseDevicesReport = ReturnType<typeof useDevicesReport>;