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
import { FaTrello } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";
import type { KanbanAssignment } from "@entities/ticket";
import { ASSIGNMENT_STATUS_BADGE } from "../model/useAssignmentList";
import type { UseAssignmentList } from "../model/useAssignmentList";

interface Props {
  fx: UseAssignmentList;
  onOpenBoard: () => void;
}

export default function MyTasksTable({ fx, onOpenBoard }: Props) {
  const { t: tt } = useTranslation("tickets");

  const columns: Column<KanbanAssignment>[] = [
    {
      key: "title",
      label: tt("tasksTable.task"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.title}</ITText>
          {r.description && (
            <ITText className="text-[10px] text-slate-500 line-clamp-2">{r.description}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "ticket",
      label: tt("tasksTable.ticket"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.ticket.title}</ITText>
      ),
    },
    {
      key: "status",
      label: tt("tasksTable.status"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITBadget color={(ASSIGNMENT_STATUS_BADGE[r.status]?.color as any) ?? "gray"} size="lg">
          {dyn(tt)(`detail.taskStatusOptions.${r.status}`)}
        </ITBadget>
      ),
    },
    {
      key: "dates",
      label: tt("tasksTable.dates"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          {r.startDate && (
            <ITText className="text-[9px] text-slate-500">
              {tt("tasksTable.start", { date: formatDate(r.startDate) })}
            </ITText>
          )}
          {r.dueDate && (
            <ITText className="text-[9px] text-slate-500">
              {tt("tasksTable.end", { date: formatDate(r.dueDate) })}
            </ITText>
          )}
          {r.dueDate &&
            r.status !== "COMPLETED" &&
            new Date(r.dueDate) < new Date() && (
              <ITBadget color="danger" size="lg">{tt("tasksTable.overdue")}</ITBadget>
            )}
        </ITFlex>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string",
      sortable: false,
      render: () => (
        <ITFlex justify="end">
          <ITButton
            variant="outlined"
            size="lg"
            color="secondary"
            onClick={onOpenBoard}
            title={tt("mytasks.viewBoardTitle")}
          >
            <FaTrello size={12} />
          </ITButton>
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
    />
  );
}