import { useCallback, useEffect, useMemo, useState } from "react";
import { reportsApi, type AsignadoRow } from "@entities/report";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

export type DownloadAsignadosPdf = (rows: AsignadoRow[]) => Promise<void>;

interface Options {
  download: DownloadAsignadosPdf;
}

export const useAsignadosReport = ({ download }: Options) => {
  const [rows, setRows] = useState<AsignadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .asignados()
      .then((res) => setRows(res.data))
      .catch((e: any) => setError(e.message ?? "No se pudo cargar el reporte"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const promedioDias = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(
      rows.reduce((acc, r) => acc + (r.diasAsignado ?? 0), 0) / rows.length
    );
  }, [rows]);

  const masDe30 = useMemo(
    () => rows.filter((r) => (r.diasAsignado ?? 0) > 30).length,
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
    async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<AsignadoRow>> => {
      const start = (params.page - 1) * params.limit;
      return {
        data: rows.slice(start, start + params.limit),
        total: rows.length,
      };
    },
    [rows]
  );

  return {
    rows,
    loading,
    error,
    setError,
    exporting,
    reloadKey,
    setReloadKey,
    promedioDias,
    masDe30,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseAsignadosReport = ReturnType<typeof useAsignadosReport>;