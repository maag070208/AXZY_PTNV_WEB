import {
  ITButton,
  ITFlex,
  ITSearchSelect,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect } from "react";
import { LuCalendarDays, LuCircleCheck, LuMoveRight, LuRefreshCw, LuTicket } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/i18n";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { PRIORITY_TONE, TicketChip } from "@entities/ticket";
import type { UseKanban } from "../model/useKanban";

interface Props {
  fx: UseKanban;
  /** Animación guiada: cómo mover una tarjeta de columna. */
  guideOpen?: boolean;
  onGuideEnd?: () => void;
}

// Tono de cada carril: fondo pastel muy tenue (mezcla del token del tema).
const LANE_COLOR: Record<string, string> = {
  PENDING: "var(--color-slate-500)",
  IN_PROGRESS: "var(--color-secondary)",
  IN_REVIEW: "var(--color-info)",
  COMPLETED: "var(--color-success)",
};

export default function KanbanBoard({ fx, guideOpen = false, onGuideEnd }: Props) {
  const { t: tt } = useTranslation("tickets");

  // La guía se cierra sola a los 7 s o al tocar en cualquier parte.
  useEffect(() => {
    if (!guideOpen) return;
    const timer = window.setTimeout(() => onGuideEnd?.(), 7000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onGuideEnd?.();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [guideOpen, onGuideEnd]);

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
          <ITText muted className="hidden !text-[12px] lg:block">
            {tt("kanban.dragHint")}
          </ITText>
          <ITButton variant="outlined" onClick={fx.reload} className="!h-9">
            <ITFlex align="center" gap={1}>
              <LuRefreshCw size={13} className={fx.loading ? "animate-spin" : ""} />
              <ITText className="text-xs font-medium">{tt("kanban.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      <ITFlex className="relative grid grid-cols-1 items-start gap-3 pb-3 md:!grid-cols-2 xl:!grid-cols-4">
        {fx.COLUMNS.map((col) => {
          const count = fx.byStatus[col.status].length;
          const laneColor = LANE_COLOR[col.status];
          return (
            <div
              key={col.status}
              className="w-full rounded-[20px] p-3 transition-colors min-h-[280px]"
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
                <ITText as="span"
                  className="min-w-6 rounded-full px-2 py-0.5 text-center text-[11px] font-bold tabular-nums"
                  style={{
                    background: `color-mix(in srgb, ${laneColor} 16%, transparent)`,
                    color: `color-mix(in srgb, ${laneColor} 78%, #000)`,
                  }}
                >
                  {count}
                </ITText>
              </ITFlex>

              <div className="space-y-2 min-h-[160px]">
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

                        <ITFlex justify="between" align="center" gap={2}>
                          <ITText as="span"
                            className={`flex min-w-0 items-center gap-1 text-[11.5px] ${
                              overdue ? "font-semibold text-[color:var(--color-danger)]" : "text-slate-500"
                            }`}
                          >
                            {a.dueDate ? (
                              <>
                                <LuCalendarDays size={12} className="shrink-0" />
                                <ITText as="span" className="truncate">{formatDate(a.dueDate)}</ITText>
                              </>
                            ) : (
                              <ITText as="span" className="truncate text-slate-400">#{a.ticketId.slice(0, 6).toUpperCase()}</ITText>
                            )}
                          </ITText>
                          <ITFlex align="center" gap={1.5} className="shrink-0">
                            <TicketChip
                              label={dyn(tt)(`priorityLabels.${a.ticket.priority}`)}
                              tone={PRIORITY_TONE[a.ticket.priority]}
                            />
                            <ITText as="span" title={a.user.name} className="inline-flex">
                              <ProfileAvatar name={a.user.name} size="sm" />
                            </ITText>
                          </ITFlex>
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

      {/* Guía: cómo mover una tarjeta. Resalta las columnas y muestra una
          tarjeta fantasma pasando de "En progreso" a "En revisión". */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-slate-900)_45%,transparent)] px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-label={tt("kanban.guideTitle")}
          onClick={() => onGuideEnd?.()}
        >
          <ITFlex
            direction="column"
            gap={3}
            className="w-full max-w-[520px] rounded-[26px] bg-[var(--it-card-bg)] px-6 py-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ITFlex align="center" gap={2}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[color:var(--color-primary)]">
                <LuMoveRight size={16} />
              </span>
              <ITFlex direction="column" gap={0}>
                <ITText className="!text-[15px] font-bold">{tt("kanban.guideTitle")}</ITText>
                <ITText muted className="!text-[12px]">
                  {tt("kanban.guideHint")}
                </ITText>
              </ITFlex>
            </ITFlex>

            {/* Demostración: la tarjeta viaja de una columna a la siguiente */}
            <ITFlex align="center" justify="center" gap={3} className="py-2">
              <ITFlex direction="column" gap={1} className="kanban-guide-col">
                <ITText muted className="!text-[11px] font-bold uppercase tracking-wide">
                  {dyn(tt)("detail.taskStatusOptions.IN_PROGRESS")}
                </ITText>
                <ITText as="span" className="kanban-guide-card rounded-xl bg-[var(--it-card-bg)] px-3 py-2 !text-[12px] font-semibold shadow-md ring-1 ring-black/5">
                  {tt("kanban.guideCard")}
                </ITText>
              </ITFlex>
              <LuMoveRight size={18} className="kanban-guide-arrow shrink-0 text-[color:var(--color-primary)]" />
              <ITFlex direction="column" gap={1} className="kanban-guide-col kanban-guide-target">
                <ITText muted className="!text-[11px] font-bold uppercase tracking-wide">
                  {dyn(tt)("detail.taskStatusOptions.IN_REVIEW")}
                </ITText>
                <ITText as="span" className="rounded-xl border border-dashed border-[color:var(--color-primary)] px-3 py-2 !text-[12px] font-semibold text-[color:var(--color-primary)]">
                  {tt("kanban.guideDrop")}
                </ITText>
              </ITFlex>
            </ITFlex>

            <ITFlex justify="end">
              <ITButton variant="filled" color="primary" size="sm" onClick={() => onGuideEnd?.()}>
                <ITText className="!text-[11.5px] font-bold">{tt("kanban.guideDone")}</ITText>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </div>
      )}
    </>
  );
}
