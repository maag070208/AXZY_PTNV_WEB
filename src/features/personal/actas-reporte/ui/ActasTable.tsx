import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaTrash } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import type { ActaAdministrativa } from "@entities/personal";

type BadgeColor = "error" | "warning" | "info" | "success" | "danger" | "primary" | "secondary" | "purple" | "gray";

const MOTIVO_COLOR: Record<string, BadgeColor> = {
  INASISTENCIA: "danger",
  RETARDO: "warning",
  EBRIEDAD: "danger",
  CONDUCTA: "warning",
  INCUMPLIMIENTO: "warning",
  OTRO: "secondary",
};

interface Props {
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (acta: ActaAdministrativa) => void;
  onDownload: (acta: ActaAdministrativa) => void;
  onDelete: (acta: ActaAdministrativa) => void;
}

export default function ActasTable({
  fetchData,
  reloadKey,
  onView,
  onDownload,
  onDelete,
}: Props) {
  const { t: tt } = useTranslation("actas");

  const columns: Column<ActaAdministrativa>[] = [
    {
      key: "fechaIncidente",
      label: tt("table.fecha"),
      type: "string",
      filter: true,
      sortable: false,
      render: (a) => (
        <ITText className="text-[11px] font-black text-slate-700">{a.fechaIncidente}</ITText>
      ),
    },
    {
      key: "motivo",
      label: tt("table.motivo"),
      type: "string",
      filter: true,
      sortable: false,
      render: (a) => (
        <ITBadget color={MOTIVO_COLOR[a.motivo] ?? "secondary"} size="lg">
          {tt(`motivos.${a.motivo}`)}
        </ITBadget>
      ),
    },
    {
      key: "user",
      label: tt("table.empleado"),
      type: "string",
      filter: true,
      sortable: false,
      render: (a) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{a.user.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {a.user.numeroEmpleado ? `#${a.user.numeroEmpleado}` : "—"}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "puesto",
      label: tt("table.puesto"),
      type: "string",
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {a.user.puesto ?? "—"}
        </ITText>
      ),
    },
    {
      key: "descripcion",
      label: tt("table.descripcion"),
      type: "string",
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[10px] text-slate-500 line-clamp-2 max-w-[260px]">
          {a.descripcion}
        </ITText>
      ),
    },
    {
      key: "sancion",
      label: tt("table.sancion"),
      type: "string",
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[10px] text-slate-500 line-clamp-2 max-w-[200px]">
          {a.sancion || "—"}
        </ITText>
      ),
    },
    {
      key: "createdBy",
      label: tt("table.creadoPor"),
      type: "string",
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[10px] font-bold text-slate-500">{a.createdBy.name}</ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string" as const,
      sortable: false,
      render: (a: ActaAdministrativa) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            onClick={() => onView(a)}
            size="lg"
            color="danger"
            title={tt("actions.ver")}
          >
            <FaFilePdf size={14} />
          </ITButton>
          <ITButton
            onClick={() => onDownload(a)}
            size="lg"
            color="secondary"
            title={tt("actions.descargar")}
          >
            <FaFilePdf size={14} />
          </ITButton>
          <ITButton
            onClick={() => onDelete(a)}
            size="lg"
            color="gray"
            title={tt("actions.eliminar")}
          >
            <FaTrash size={14} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      defaultItemsPerPage={10}
      itemsPerPageOptions={[5, 10, 50]}
      size="lg"
    />
  );
}