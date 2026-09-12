import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ITDataTable } from "@axzydev/axzy_ui_system";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { deviceApi, DeviceCard, type Device } from "@entities/device";
import { useDeviceColumns } from "../model/useDeviceColumns";

interface DevicesTableProps {
  isAdmin: boolean;
  isMobile: boolean;
  externalFilters: Record<string, string | number | boolean>;
  reloadTrigger: number;
  onTotalChange: (total: number) => void;
  onDeleteRequest: (device: Device) => void;
}

/**
 * Encapsula ITDataTable + la vista de tarjetas para /dispositivos: columnas,
 * fetch paginado y el render móvil, todo aislado de la página que lo usa.
 */
export default function DevicesTable({
  isAdmin,
  isMobile,
  externalFilters,
  reloadTrigger,
  onTotalChange,
  onDeleteRequest,
}: DevicesTableProps) {
  const navigate = useNavigate();
  const columns = useDeviceColumns(navigate, isAdmin, onDeleteRequest);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await deviceApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      onTotalChange(res.total);
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    [onTotalChange]
  );

  const renderCard = useCallback(
    (row: Record<string, unknown>) => (
      <DeviceCard device={row as unknown as Device} onClick={(id) => navigate(`/dispositivos/${id}`)} />
    ),
    [navigate]
  );

  return (
    <ITDataTable
      columns={columns as any}
      fetchData={
        fetchTableData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      externalFilters={externalFilters}
      renderCard={renderCard}
      defaultView={isMobile ? "cards" : "table"}
      defaultItemsPerPage={20}
      size="sm"
      reloadTrigger={reloadTrigger}
    />
  );
}
