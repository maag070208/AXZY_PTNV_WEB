import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  reportsApi,
  type DevicesPdfPayload,
  type DevicesStats,
} from "@entities/report";
import { appliedFilters, type TableQuery } from "@shared/utils/tableFilters";
import { dyn } from "@shared/i18n/dyn";

/** Orden vigente de la tabla; la columna ES una unidad física. */
export type DevicesSort = NonNullable<ITDataTableFetchParams["sort"]>;

/** Orden estable: el mismo al que cae el API cuando el `sort` no está en su allowlist. */
export const DEFAULT_DEVICES_SORT: DevicesSort = { key: "assetTag", direction: "asc" };

/** Columnas filtrables → llave i18n de su encabezado. */
const FILTER_LABELS: Record<string, string> = {
  assetTag: "devices.activeCol",
  description: "devices.colDescription",
  status: "devices.colStatus",
  custodian: "devices.colCustodian",
  department: "devices.colDept",
  area: "devices.colArea",
};

export type { DevicesPdfPayload } from "@entities/report";

export type DownloadDevicesPdf = (payload: DevicesPdfPayload) => Promise<void>;

interface Options {
  download: DownloadDevicesPdf;
}

/**
 * Estado de la pestaña "Dispositivos": tabla server-side del catálogo de
 * unidades con su estado actual, y los KPIs del conjunto filtrado que devuelve
 * el servidor.
 */
export const useDevicesReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [stats, setStats] = useState<DevicesStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /** Última consulta de la tabla; el export reutiliza su recorte y su orden. */
  const lastQuery = useRef<TableQuery>({ filters: {}, sort: DEFAULT_DEVICES_SORT });

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const filters = params.filters as Record<string, string | number | boolean>;
    const sort = params.sort ?? DEFAULT_DEVICES_SORT;
    lastQuery.current = { filters, sort };

    const res = await reportsApi.devices({ page: params.page, limit: params.limit, filters, sort });
    setStats(res.stats);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const { filters, sort } = lastQuery.current;
      const res = await reportsApi.devicesExport({ page: 1, limit: 100, filters, sort });
      await download({
        data: res.data,
        stats: res.stats,
        truncated: res.truncated,
        meta: {
          generatedAt: new Date().toISOString(),
          appliedFilters: appliedFilters(filters, FILTER_LABELS, dyn(t)),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("devices.errorLoad"));
    } finally {
      setExporting(false);
    }
  }, [download, t]);

  return {
    t,
    stats,
    error,
    setError,
    exporting,
    reloadKey,
    setReloadKey,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseDevicesReport = ReturnType<typeof useDevicesReport>;
