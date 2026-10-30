import { useMemo, useState } from "react";
import { ITButton, ITCard, ITText, ITFlex, ITStack } from "@axzydev/axzy_ui_system";
import { LuCalendarClock, LuMessageSquare, LuTicket } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";
import { ASSIGNMENT_TONE, PRIORITY_TONE, TicketChip, type KanbanAssignment } from "@entities/ticket";
import { FilterPills } from "@shared/ui/filter-pills";
import { LangostinState } from "@shared/ui/langostin";
import { DUE_GROUPS, dueGroupOf, groupByDue, type DueGroup } from "../model/groupTasks";
import type { UseAssignmentList } from "../model/useAssignmentList";

type Filter = "all" | "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";
const FILTERS: readonly Filter[] = ["all", "PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"];

interface Props {
  fx: UseAssignmentList;
  onOpenBoard: () => void;
}

/**
 * "Mis tareas" como tarjetas agrupadas por fecha límite (vencidas, hoy, esta
 * semana, más adelante, sin fecha). Filtro por estado en píldoras con su conteo.
 */
export default function MyTasksCards({ fx, onOpenBoard }: Props) {
  const { t: tt } = useTranslation("tickets");
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const countOf = (f: Filter) => (f === "all" ? fx.rows.length : fx.rows.filter((r) => r.status === f).length);
  const pills = FILTERS.map((id) => ({
    id,
    label: id === "all" ? tt("mytasks.filterAll") : dyn(tt)(`detail.taskStatusOptions.${id}`),
    count: countOf(id),
  }));

  const visible = useMemo(() => (filter === "all" ? fx.rows : fx.rows.filter((r) => r.status === filter)), [fx.rows, filter]);
  const groups = useMemo(() => groupByDue(visible), [visible]);

  if (!fx.loading && fx.rows.length === 0) {
    return (
      <ITCard>
        <LangostinState
          kind="empty"
          title={tt("mytasks.emptyTitle")}
          description={tt("mytasks.emptyDescription")}
          action={
            <ITButton variant="outlined" color="secondary" size="sm" onClick={onOpenBoard}>
              {tt("mytasks.viewBoard")}
            </ITButton>
          }
        />
      </ITCard>
    );
  }

  return (
    <ITStack spacing={5}>
      <FilterPills items={pills} value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <ITCard>
          <LangostinState kind="noResults" size="sm" />
        </ITCard>
      ) : (
        DUE_GROUPS.filter((g) => groups[g].length > 0).map((g) => (
          <section key={g} className="flex flex-col gap-2.5">
            <ITText as="h3" className="m-0 flex items-center gap-2 text-[13px] font-bold text-slate-700">
              {dyn(tt)(`mytasks.groups.${g}`)}
              <TicketChip label={String(groups[g].length)} tone={g === "overdue" ? "danger" : "neutral"} />
            </ITText>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groups[g].map((a) => (
                <TaskCard key={a.id} a={a} onOpen={() => navigate(`/tickets/${a.ticketId}`)} />
              ))}
            </div>
          </section>
        ))
      )}
    </ITStack>
  );
}

function TaskCard({ a, onOpen }: { a: KanbanAssignment; onOpen: () => void }) {
  const { t: tt } = useTranslation("tickets");
  const group: DueGroup = dueGroupOf(a);
  const comments = a.comments?.length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer rounded-[24px] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
    >
      <ITCard className="flex-1">
        <div className="flex h-full flex-col gap-3">
          <ITFlex align="center" wrap="wrap" gap={1.5}>
            <TicketChip tone={ASSIGNMENT_TONE[a.status]} label={dyn(tt)(`detail.taskStatusOptions.${a.status}`)} />
            <TicketChip tone={PRIORITY_TONE[a.ticket.priority]} label={dyn(tt)(`priorityLabels.${a.ticket.priority}`)} />
          </ITFlex>
          <ITFlex className="min-w-0 flex-1">
            <ITText className="m-0 text-[15px] font-bold leading-snug text-slate-800">{a.title}</ITText>
            {a.description && <ITText className="m-0 mt-1 line-clamp-2 text-[12.5px] text-slate-500">{a.description}</ITText>}
          </ITFlex>
          <ITText className="m-0 flex items-center gap-1.5 truncate text-[12px] text-slate-500">
            <LuTicket size={13} className="shrink-0" />
            <ITText as="span" className="truncate">{a.ticket.title}</ITText>
          </ITText>
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <ITText as="span"
              className={`flex items-center gap-1.5 font-semibold ${group === "overdue" ? "text-[color:var(--color-danger)]" : "text-slate-500"}`}
            >
              <LuCalendarClock size={14} />
              {a.dueDate
                ? group === "today"
                  ? tt("mytasks.dueToday")
                  : group === "overdue"
                    ? tt("mytasks.overdueOn", { date: formatDate(a.dueDate) })
                    : tt("mytasks.dueOn", { date: formatDate(a.dueDate) })
                : tt("mytasks.noDueDate")}
            </ITText>
            {comments > 0 && (
              <ITText as="span" className="flex items-center gap-1 text-slate-400">
                <LuMessageSquare size={13} />
                {comments}
              </ITText>
            )}
          </div>
        </div>
      </ITCard>
    </div>
  );
}
