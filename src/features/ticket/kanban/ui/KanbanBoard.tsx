import {
  ITButton,
  ITFlex,
  ITSearchSelect,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { LuCalendarDays, LuCircleCheck, LuRefreshCw, LuTicket } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/i18n";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { ASSIGNMENT_TONE, PRIORITY_TONE, STATUS_TONE, TicketChip } from "@entities/ticket";
import type { UseKanban } from "../model/useKanban";

interface Props {
  fx: UseKanban;
}

// Tono de cada carril: fondo pastel muy tenue (mezcla del token del tema).
const LANE_COLOR: Record<string, string> = {
  PENDING: "var(--color-slate-500)",
  IN_PROGRESS: "var(--color-secondary)",
  IN_REVIEW: "var(--color-info)",
  COMPLETED: "var(--color-success)",
};

export default function KanbanBoard({ fx }: Props) {
  const { t: tt } = useTranslation("tickets");

  return (
    <>
      <ITFlex
        justify="between"
        align="center"
        wrap="wrap"
        gap={3}
        className="mb-5"
      >
        <ITFlex align="center" gap={3} wrap="wrap" className="min-w-0">
          <ITFlex className="w-64">
            <ITSearchSelect
              name="kanbanTaskSearch"
              options={fx.taskOptions}
              value={fx.taskFilter}
              onChange={(value) => fx.setTaskFilter(String(value))}
              onClear={() => fx.setTaskFilter("")}
              placeholder={tt("kanban.searchPlaceholder")}
              className="w-full"
              clearable
            />
          </ITFlex>
          <ITFlex className="w-44 sm:w-52">
            <ITSelect
              name="kanbanDepartmentFilter"
              value={fx.departmentFilter}
              onChange={(e) => fx.setDepartmentFilter(e.target.value)}
              options={[
                { value: "", label: tt("kanban.allDepartments") },
                ...fx.departmentOptions.map((d) => ({ value: d, label: d })),
              ]}
            />
          </ITFlex>
          {fx.uniqueAssignees.length > 0 && (
            <ITFlex align="center" gap={1} className="pl-1">
              <ITFlex align="center" className="-space-x-2.5">
                {fx.uniqueAssignees.slice(0, 4).map((u) => {
                  const active = fx.assigneeFilter === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      title={u.name}
                      aria-pressed={active}
                      onClick={() =>
                        fx.setAssigneeFilter((cur) => (cur === u.id ? null : u.id))
                      }
                      className={`cursor-pointer rounded-full !border-0 !bg-transparent p-0 transition-all hover:z-10 ${
                        active
                          ? "z-10 ring-2 ring-[color:var(--color-primary)] ring-offset-2"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <ProfileAvatar name={u.name} size="sm" className="ring-2 ring-[color:var(--it-card-bg)]" />
                    </button>
                  );
                })}
                {fx.uniqueAssignees.length > 4 && (
                  <ITFlex
                    as="span"
                    align="center"
                    justify="center"
                    className="relative z-0 h-8 w-8 shrink-0 rounded-full bg-slate-100 text-xs font-semibold text-slate-500 ring-2 ring-[color:var(--it-card-bg)]"
                  >
                    +{fx.uniqueAssignees.length - 4}
                  </ITFlex>
                )}
              </ITFlex>
            </ITFlex>
          )}
          {fx.hasActiveFilters && (
            <button
              type="button"
              onClick={fx.clearFilters}
              className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              {tt("kanban.clearFilters")}
            </button>
          )}
        </ITFlex>
        <ITFlex align="center" gap={2}>
          {fx.loading && (
            <ITText className="text-xs text-slate-400">
              {tt("kanban.loading")}
            </ITText>
          )}
          {fx.error && (
            <ITText className="text-xs font-medium text-[color:var(--color-danger)]">
              {fx.error}
            </ITText>
          )}
          <ITButton variant="outlined" onClick={fx.reload} className="!h-9">
            <ITFlex align="center" gap={1}>
              <LuRefreshCw size={13} className={fx.loading ? "animate-spin" : ""} />
              <ITText className="text-xs font-medium">{tt("kanban.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      <ITFlex className="items-start gap-4 overflow-x-auto pb-3 -mx-2 px-2">
        {fx.COLUMNS.map((col) => {
          const count = fx.byStatus[col.status].length;
          const laneColor = LANE_COLOR[col.status];
          return (
            <div
              key={col.status}
              className="flex-none w-[300px] sm:w-[320px] rounded-[20px] p-3 transition-colors"
              style={{
                background: `color-mix(in srgb, ${fx.dragOver === col.status ? "var(--color-primary)" : laneColor} ${fx.dragOver === col.status ? 12 : 7}%, transparent)`,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                fx.setDragOver(col.status);
              }}
              onDragLeave={() =>
                fx.setDragOver((s) => (s === col.status ? null : s))
              }
              onDrop={fx.handleDrop(col.status)}
            >
              <ITFlex justify="between" align="center" className="mb-3 px-1">
                <ITFlex align="center" gap={1.5}>
                  {col.status === "COMPLETED" ? (
                    <LuCircleCheck size={14} style={{ color: laneColor }} />
                  ) : (
                    <span className="h-2 w-2 rounded-full" style={{ background: laneColor }} />
                  )}
                  <ITText className="text-[13px] font-bold text-slate-700">
                    {dyn(tt)(`detail.taskStatusOptions.${col.status}`)}
                  </ITText>
                </ITFlex>
                <span
                  className="min-w-6 rounded-full px-2 py-0.5 text-center text-[11px] font-bold tabular-nums"
                  style={{
                    background: `color-mix(in srgb, ${laneColor} 16%, transparent)`,
                    color: `color-mix(in srgb, ${laneColor} 78%, #000)`,
                  }}
                >
                  {count}
                </span>
              </ITFlex>

              <div className="space-y-2 min-h-[120px]">
                {count === 0 ? (
                  <div className="p-4 text-center">
                    <ITText className="text-xs text-slate-400">
                      {tt("kanban.emptyColumn")}
                    </ITText>
                  </div>
                ) : (
                  fx.byStatus[col.status].map((a) => {
                    const deptLabel =
                      a.ticket.department?.name ?? tt("list.general");
                    const overdue = Boolean(
                      a.dueDate &&
                        a.status !== "COMPLETED" &&
                        new Date(a.dueDate) < new Date()
                    );
                    return (
                      <div
                        key={a.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", a.id);
                          e.dataTransfer.effectAllowed = "move";
                          fx.setDraggingId(a.id);
                        }}
                        onDragEnd={() => fx.setDraggingId(null)}
                        onClick={() => fx.openTicket(a.ticketId)}
                        className={`cursor-pointer rounded-2xl bg-[var(--it-card-bg)] p-3 transition-all hover:-translate-y-0.5 ${fx.draggingId === a.id ? "opacity-40" : ""}`}
                      >
                        <ITFlex justify="between" align="center" gap={2} className="mb-2">
                          <TicketChip label={deptLabel} tone="primary" className="min-w-0 truncate" />
                          {overdue && <TicketChip label={tt("kanban.overdue")} tone="danger" />}
                        </ITFlex>

                        <ITText className="mb-1.5 text-[13px] font-semibold leading-snug text-slate-800 line-clamp-2">
                          {a.title}
                        </ITText>

                        <ITFlex align="center" gap={1} className="mb-2 min-w-0">
                          <LuTicket size={12} className="shrink-0 text-slate-400" />
                          <ITText className="text-[11.5px] text-slate-500 truncate">
                            {a.ticket.title}
                          </ITText>
                        </ITFlex>

                        <ITFlex align="center" gap={1} wrap="wrap" className="mb-2">
                          <TicketChip
                            label={dyn(tt)(`detail.taskStatusOptions.${a.status}`)}
                            tone={ASSIGNMENT_TONE[a.status]}
                          />
                          <TicketChip
                            label={dyn(tt)(`priorityLabels.${a.ticket.priority}`)}
                            tone={PRIORITY_TONE[a.ticket.priority]}
                          />
                          <TicketChip
                            label={dyn(tt)(`statusLabels.${a.ticket.status}`)}
                            tone={STATUS_TONE[a.ticket.status]}
                          />
                        </ITFlex>

                        <ITFlex justify="between" align="center" gap={2}>
                          <span
                            className={`flex min-w-0 items-center gap-1 text-[11.5px] ${
                              overdue ? "font-semibold text-[color:var(--color-danger)]" : "text-slate-500"
                            }`}
                          >
                            {a.dueDate ? (
                              <>
                                <LuCalendarDays size={12} className="shrink-0" />
                                <span className="truncate">{formatDate(a.dueDate)}</span>
                              </>
                            ) : (
                              <span className="truncate text-slate-400">#{a.ticketId.slice(0, 6).toUpperCase()}</span>
                            )}
                          </span>
                          <span title={a.user.name} className="inline-flex shrink-0">
                            <ProfileAvatar name={a.user.name} size="sm" />
                          </span>
                        </ITFlex>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </ITFlex>
    </>
  );
}
