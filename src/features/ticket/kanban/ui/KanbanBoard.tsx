import {
  ITButton,
  ITFlex,
  ITSearchSelect,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaCheckCircle,
  FaSync,
  FaTicketAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/i18n";
import {
  Avatar,
  ASSIGNMENT_STATUS_META,
  PRIORITY_META,
  STATUS_META,
  Tag,
  hashTone,
  metaFor,
} from "@shared/ui/kanban";
import type { UseKanban } from "../model/useKanban";

interface Props {
  fx: UseKanban;
}

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
              {fx.uniqueAssignees.slice(0, 4).map((u) => {
                const active = fx.assigneeFilter === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      fx.setAssigneeFilter((cur) => (cur === u.id ? null : u.id))
                    }
                    className={`rounded-full transition-all hover:z-10 ${
                      active
                        ? "ring-2 ring-offset-2 ring-blue-400"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Avatar name={u.name} seed={u.id} />
                  </button>
                );
              })}
              {fx.uniqueAssignees.length > 4 && (
                <ITFlex
                  as="span"
                  align="center"
                  justify="center"
                  className="w-7 h-7 shrink-0 rounded-full bg-slate-100 border text-slate-500 text-xs font-semibold"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  +{fx.uniqueAssignees.length - 4}
                </ITFlex>
              )}
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
            <ITText className="text-xs font-medium text-red-600">
              {fx.error}
            </ITText>
          )}
          <ITButton variant="outlined" onClick={fx.reload} className="!h-9">
            <ITFlex align="center" gap={1}>
              <FaSync size={11} className={fx.loading ? "animate-spin" : ""} />
              <ITText className="text-xs font-medium">{tt("kanban.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      <ITFlex className="items-start gap-4 overflow-x-auto pb-3 -mx-2 px-2">
        {fx.COLUMNS.map((col) => {
          const statusMeta = metaFor(ASSIGNMENT_STATUS_META, col.status);
          const count = fx.byStatus[col.status].length;
          return (
            <div
              key={col.status}
              className={`flex-none w-[300px] sm:w-[320px] rounded-xl border p-3 transition-colors ${
                fx.dragOver === col.status ? "bg-blue-50" : "bg-slate-100/70"
              }`}
              style={{ borderColor: fx.dragOver === col.status ? "#93c5fd" : "#e2e8f0" }}
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
                  {col.status === "COMPLETED" && (
                    <FaCheckCircle size={12} className="text-emerald-500" />
                  )}
                  <ITText className="text-[13px] font-semibold text-slate-700">
                    {dyn(tt)(`detail.taskStatusOptions.${col.status}`)}
                  </ITText>
                </ITFlex>
                <ITText className="text-xs font-medium text-slate-400">
                  {count}
                </ITText>
              </ITFlex>

              <div className="space-y-1.5 min-h-[120px]">
                {count === 0 ? (
                  <div
                    className="rounded-md border border-dashed bg-white/60 p-3 text-center"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <ITText className="text-xs text-slate-400">
                      {tt("kanban.emptyColumn")}
                    </ITText>
                  </div>
                ) : (
                  fx.byStatus[col.status].map((a) => {
                    const deptLabel =
                      a.ticket.department?.name ?? tt("list.general");
                    const deptTone = hashTone(deptLabel);
                    const priorityMeta = metaFor(PRIORITY_META, a.ticket.priority);
                    const statusMeta = metaFor(ASSIGNMENT_STATUS_META, a.status);
                    const ticketStatusMeta = metaFor(STATUS_META, a.ticket.status);
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
                        className={`rounded-md border bg-white p-2.5 shadow-none hover:shadow-md transition-shadow cursor-pointer ${fx.draggingId === a.id ? "opacity-40" : ""}`}
                        style={{ borderColor: "#e2e8f0" }}
                      >
                        <ITFlex justify="between" align="center" gap={2} className="mb-1.5">
                          <Tag label={deptLabel} tone={deptTone} />
                          {overdue && (
                           <Tag label={tt("kanban.overdue")} tone={PRIORITY_META.URGENT.tone} />
                          )}
                        </ITFlex>

                        <ITFlex align="center" justify="between" gap={1} className="mb-1">
                          <ITFlex align="center" gap={1} className="min-w-0">
                            <FaTicketAlt size={8} className="text-slate-300 shrink-0" />
                            <ITText className="text-[10px] text-slate-400 truncate">
                              {a.ticket.title}
                            </ITText>
                          </ITFlex>
                          <Tag
                            label={dyn(tt)(`statusLabels.${a.ticket.status}`)}
                            tone={ticketStatusMeta.tone}
                          />
                        </ITFlex>

                        <ITText className="text-xs font-medium text-slate-800 leading-snug line-clamp-2 mb-1.5">
                          {a.title}
                        </ITText>

                        <ITFlex align="center" gap={1} wrap="wrap" className="mb-2">
                          <Tag
                            label={dyn(tt)(`detail.taskStatusOptions.${a.status}`)}
                            tone={statusMeta.tone}
                          />
                          <Tag
                            label={dyn(tt)(`priorityLabels.${a.ticket.priority}`)}
                            tone={priorityMeta.tone}
                          />
                        </ITFlex>

                        {(a.startDate || a.dueDate) && (
                          <ITFlex align="center" gap={3} className="mb-1.5">
                            {a.startDate && (
                              <ITText className="text-[10px] text-slate-400">
                                {tt("detail.startShort")}:{" "}
                                <span className="font-medium text-slate-500">
                                  {formatDate(a.startDate)}
                                </span>
                              </ITText>
                            )}
                            {a.dueDate && (
                              <ITText
                                className={`text-[10px] ${
                                  overdue ? "text-red-600 font-semibold" : "text-slate-400"
                                }`}
                              >
                                {tt("detail.dueShort")}:{" "}
                                <span className="font-medium">{formatDate(a.dueDate)}</span>
                              </ITText>
                            )}
                          </ITFlex>
                        )}

                        <ITFlex
                          justify="between"
                          align="center"
                          gap={2}
                          className="pt-1.5 border-t"
                          style={{ borderTopColor: "#f1f5f9" }}
                        >
                          <span className="text-[10px] text-slate-400 truncate">
                            #{a.ticketId.slice(0, 6).toUpperCase()}
                          </span>
                          <Avatar name={a.user.name} seed={a.userId} />
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