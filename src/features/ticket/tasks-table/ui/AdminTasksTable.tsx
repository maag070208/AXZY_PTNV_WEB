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
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";
import { ASSIGNMENT_STATUS_BADGE } from "../model/useAssignmentList";
import type { UseAssignmentList } from "../model/useAssignmentList";

interface Props {
  fx: UseAssignmentList;
}

export default function AdminTasksTable({ fx }: Props) {
  const { t: tt } = useTranslation("tickets");
  const columns: Column<KanbanAssignment>[] = [
    {
      key: "title",
      label: tt("tasksTable.task"),
      type: "string",
      width: 300,
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
      label: tt("tasksTable.employee"),
      type: "string",
      width: 240,
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">{row.user.name}</ITText>
          {row.user.employeeNumber && (
            <ITText className="text-[9px] text-slate-400">{tt("tasksTable.employeeNo", { number: row.user.employeeNumber })}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "ticket",
      label: tt("tasksTable.ticket"),
      type: "string",
      width: 300,
      sortable: false,
      render: (row) => (
        <ITText className="text-[11px] font-bold text-slate-600">{row.ticket.title}</ITText>
      ),
    },
    {
      key: "status",
      label: tt("tasksTable.status"),
      type: "string",
      width: 150,
      sortable: false,
      render: (row) => (
        <ITBadget color={(ASSIGNMENT_STATUS_BADGE[row.status]?.color as any) ?? "gray"} size="lg">
          {dyn(tt)(`detail.taskStatusOptions.${row.status}`)}
        </ITBadget>
      ),
    },
    {
      key: "dates",
      label: tt("tasksTable.dates"),
      type: "string",
      width: 220,
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          {row.startDate && (
            <ITText className="text-[9px] text-slate-500">
              {tt("tasksTable.start", { date: formatDate(row.startDate) })}
            </ITText>
          )}
          {row.dueDate && (
            <ITText className="text-[9px] text-slate-500">
              {tt("tasksTable.end", { date: formatDate(row.dueDate) })}
            </ITText>
          )}
          {row.dueDate &&
            row.status !== "COMPLETED" &&
            new Date(row.dueDate) < new Date() && (
              <ITBadget color="danger" size="lg">{tt("tasksTable.overdue")}</ITBadget>
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
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      size="lg"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
    />
  );
}