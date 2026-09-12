import {
  ITBadget,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import type { KanbanAssignment } from "@entities/ticket";
import { ASSIGNMENT_STATUS_BADGE } from "../model/useAssignmentList";
import type { UseAssignmentList } from "../model/useAssignmentList";

interface Props {
  fx: UseAssignmentList;
}

export default function AdminTasksTable({ fx }: Props) {
  const columns: Column<KanbanAssignment>[] = [
    {
      key: "title",
      label: "Tarea",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{row.title}</ITText>
          {row.description && (
            <ITText className="text-[10px] text-slate-500 line-clamp-2">{row.description}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "employee",
      label: "Empleado",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">{row.user.name}</ITText>
          {row.user.numeroEmpleado && (
            <ITText className="text-[9px] text-slate-400">No. {row.user.numeroEmpleado}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "ticket",
      label: "Ticket",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITText className="text-[11px] font-bold text-slate-600">{row.ticket.titulo}</ITText>
      ),
    },
    {
      key: "status",
      label: "Estado",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITBadget color={(ASSIGNMENT_STATUS_BADGE[row.status]?.color as any) ?? "gray"} size="small">
          {ASSIGNMENT_STATUS_BADGE[row.status]?.label ?? row.status}
        </ITBadget>
      ),
    },
    {
      key: "dates",
      label: "Fechas",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          {row.startDate && (
            <ITText className="text-[9px] text-slate-500">
              Inicio: {new Date(row.startDate).toLocaleDateString("es-MX")}
            </ITText>
          )}
          {row.dueDate && (
            <ITText className="text-[9px] text-slate-500">
              Fin: {new Date(row.dueDate).toLocaleDateString("es-MX")}
            </ITText>
          )}
          {row.dueDate &&
            row.status !== "COMPLETADA" &&
            new Date(row.dueDate) < new Date() && (
              <ITBadget color="danger" size="small">Vencida</ITBadget>
            )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fx.fetchTableData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={fx.reloadKey}
      defaultItemsPerPage={10}
      size="sm"
    />
  );
}