import {
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { ASSIGNMENT_TONE, TicketChip, type KanbanAssignment } from "@entities/ticket";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const columns: Column<KanbanAssignment>[] = [
    {
      key: "title",
      label: tt("tasksTable.task"),
      type: "string",
      width: 270,
      filter: true,
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
      filter: true,
      sortable: false,
      render: (row) => (
        <ITFlex align="center" gap={2}>
          <ProfileAvatar name={row.user.name} size="sm" />
          <ITFlex direction="column" gap={0.5} className="min-w-0">
            <ITText className="truncate text-[11px] font-bold text-slate-700">{row.user.name}</ITText>
            {row.user.employeeNumber && (
              <ITText className="text-[10px] text-slate-500">{tt("tasksTable.employeeNo", { number: row.user.employeeNumber })}</ITText>
            )}
          </ITFlex>
        </ITFlex>
      ),
    },
    {
      key: "ticket",
      label: tt("tasksTable.ticket"),
      type: "string",
      width: 250,
      filter: true,
      sortable: false,
      render: (row) => (
        <ITText className="text-[11px] font-bold text-slate-600">{row.ticket.title}</ITText>
      ),
    },
    {
      key: "status",
      label: tt("tasksTable.status"),
      type: "catalog",
      width: 180,
      filter: "catalog",
      catalogOptions: {
        data: Object.keys(ASSIGNMENT_STATUS_BADGE).map((id) => ({
          id,
          name: dyn(tt)(`detail.taskStatusOptions.${id}`),
        })),
      },
      sortable: false,
      render: (row) => (
        <TicketChip tone={ASSIGNMENT_TONE[row.status]} label={dyn(tt)(`detail.taskStatusOptions.${row.status}`)} />
      ),
    },
    {
      key: "dates",
      label: tt("tasksTable.dates"),
      type: "date",
      width: 220,
      filter: "date-range",
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
              <TicketChip tone="danger" label={tt("tasksTable.overdue")} />
            )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITCard>
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fx.fetchTableData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={fx.reloadKey}
      onRowClick={(row) => navigate(`/tickets/${(row as unknown as KanbanAssignment).ticketId}`)}
      defaultItemsPerPage={25}
      itemsPerPageOptions={[25, 50, 100]}
      layout="fixed"
      density="compact"
      rowHeight={50}
      virtualized
      virtualizedMaxHeight={460}
    />
    </ITCard>
  );
}