import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import {
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaLayerGroup,
  FaLock,
  FaTrash,
  FaTrashRestore,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { DeviceStatusBadge, type Device } from "@entities/device";

/**
 * Definición de columnas de ITDataTable para /dispositivos. Vive en el
 * widget (no en la página) porque conoce detalles de presentación de la
 * tabla — routing incluido — que no le importan a quien orquesta la página.
 */
export function useDeviceColumns(
  navigate: NavigateFunction,
  isAdmin: boolean,
  onDeleteRequest: (device: Device) => void
) {
  const { t } = useTranslation("device");

  return useMemo<any[]>(
    () => [
      {
        type: "string",
        key: "controlActivos",
        label: t("table.columnAsset"),
        sortable: false,
        filter: true,
        render: (row: Device) => (
          <ITFlex direction="column" gap={0.5}>
            <Link to={`/dispositivos/${row.id}`} className="text-[12px] font-black text-emerald-700 hover:underline">
              {row.controlActivos}
            </Link>
            {!!row.loteSize && row.loteSize > 1 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700">
                <FaLayerGroup size={9} />
                {t("status.loteOf", { count: row.loteSize })}
              </span>
            )}
          </ITFlex>
        ),
      },
      {
        type: "string",
        key: "descripcion",
        label: t("table.columnDescription"),
        sortable: false,
        filter: true,
        render: (row: Device) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800">{row.descripcion}</ITText>
            <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {row.marca} {row.modelo}
            </ITText>
          </ITFlex>
        ),
      },
      {
        type: "string",
        key: "typeId",
        label: t("table.columnType"),
        sortable: false,
        render: (row: Device) => (
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{row.type?.name}</ITText>
        ),
      },
      {
        type: "string",
        key: "estado",
        label: t("table.columnStatus"),
        sortable: false,
        render: (row: Device) => (
          <DeviceStatusBadge estado={row.estado} loteCount={(row as any).loteCount} />
        ),
      },
      {
        type: "string",
        key: "loteSize",
        label: t("table.columnQuantity"),
        sortable: false,
        render: (row: Device) =>
          row.loteSize && row.loteSize > 1 ? (
            <ITFlex align="center" gap={2}>
              <ITText className="text-[14px] font-black text-slate-800">{row.loteSize}</ITText>
              <Link
                to={`/dispositivos/${row.id}/editar`}
                className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:underline"
                title={t("actions.editLote")}
              >
                {t("actions.editDevice")}
              </Link>
            </ITFlex>
          ) : (
            <ITText className="text-[10px] font-bold text-slate-300">1</ITText>
          ),
      },
      {
        type: "actions",
        key: "actions",
        label: "",
        align: "right",
        render: (row: Device) => {
          const isLoaned = row.estado === "ASIGNADO";
          return (
            <ITFlex gap={1}>
              <ITButton
                variant="outlined"
                size="small"
                color="secondary"
                onClick={() => navigate(`/dispositivos/${row.id}`)}
                title={t("actions.viewDetail")}
              >
                <FaEye size={14} />
              </ITButton>
              <ITButton
                variant="outlined"
                size="small"
                color="secondary"
                onClick={() => !isLoaned && navigate(`/dispositivos/${row.id}/editar`)}
                disabled={isLoaned}
                title={isLoaned ? t("actions.editLocked", { code: row.controlActivos }) : t("actions.editDevice")}
              >
                {isLoaned ? <FaLock size={14} /> : <FaEdit size={14} />}
              </ITButton>
              <ITButton
                variant="outlined"
                size="small"
                color="danger"
                onClick={() => onDeleteRequest(row)}
                disabled={row.estado === "ASIGNADO" && !isAdmin}
                title={
                  row.estado === "ASIGNADO"
                    ? isAdmin
                      ? t("actions.forceDeleteWithCode", { code: row.controlActivos })
                      : t("actions.returnFirst", { code: row.controlActivos })
                    : row.estado === "BAJA"
                    ? t("actions.deletePermanent")
                    : t("actions.decommission")
                }
              >
                {row.estado === "ASIGNADO" && isAdmin ? (
                  <FaExclamationTriangle size={12} />
                ) : row.estado === "BAJA" ? (
                  <FaTrashRestore size={12} />
                ) : (
                  <FaTrash size={12} />
                )}
              </ITButton>
            </ITFlex>
          );
        },
      },
    ],
    [navigate, isAdmin, onDeleteRequest, t]
  );
}
