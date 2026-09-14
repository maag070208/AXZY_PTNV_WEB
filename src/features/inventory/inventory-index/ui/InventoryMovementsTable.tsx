import {
  ITBadget,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import { formatLocation } from "@entities/location";
import type { InventoryMovement } from "@entities/inventory-movement";
import {
  CONDICION_COLORS,
  TIPO_COLORS,
  TIPO_ICONS,
} from "@entities/inventory-movement";

interface Props {
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
}

export default function InventoryMovementsTable({ fetchData, reloadKey }: Props) {
  const { t: tt } = useTranslation(["inventory"]);

  const columns: any[] = [
    {
      type: "date",
      key: "createdAt",
      label: tt("index.colFecha"),
      sortable: true,
      render: (m: InventoryMovement) => (
        <ITText className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
          {formatFechaHora(m.createdAt)}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "tipo",
      label: tt("index.colTipo"),
      sortable: true,
      render: (m: InventoryMovement) => (
        <ITFlex align="center" gap={1.5}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${TIPO_COLORS[m.tipo]}`}
          >
            {TIPO_ICONS[m.tipo]}
          </span>
          {m.condicion && (
            <ITBadget color={CONDICION_COLORS[m.condicion]} size="small">
              {tt(`conditionLabels.${m.condicion}`)}
            </ITBadget>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "search",
      label: tt("index.colDispositivo"),
      filter: true,
      render: (m: InventoryMovement) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          <ITText className="font-black text-slate-800 uppercase text-[11px] tracking-tight">
            {m.device?.controlActivos ?? "—"}
          </ITText>
          {m.device?.descripcion && (
            <ITText className="text-[10px] text-slate-400 truncate">
              {m.device.descripcion}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "ubicacion",
      label: tt("index.colUbicacion"),
      filter: true,
      render: (m: InventoryMovement) =>
        m.location ? (
          <ITText className="text-[11px] font-bold text-slate-600">
            {formatLocation(m.location)}
          </ITText>
        ) : (
          <ITText className="text-[10px] font-bold text-slate-300 uppercase">
            —
          </ITText>
        ),
    },
    {
      type: "string",
      key: "responsable",
      label: tt("index.colResponsable"),
      render: (m: InventoryMovement) => (
        <ITText className="text-[11px] font-semibold text-slate-500">
          {m.user?.name ?? "—"}
        </ITText>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as any}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      defaultItemsPerPage={10}
      size="sm"
    />
  );
}