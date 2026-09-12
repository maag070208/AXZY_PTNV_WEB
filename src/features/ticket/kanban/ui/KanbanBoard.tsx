import {
  ITButton,
  ITFlex,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBookmark,
  FaCheckCircle,
  FaSearch,
  FaSync,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import {
  Avatar,
  PRIORITY_META,
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
      {/* Barra de herramientas: búsqueda, filtro de departamento, avatares y refrescar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <ITFlex align="center" gap={3} className="flex-wrap">
          <div className="w-60">
            <ITInput
              name="kanbanSearch"
              value={fx.search}
              onChange={(e) => fx.setSearch(e.target.value)}
              placeholder={tt("kanban.searchPlaceholder")}
              iconLeft={<FaSearch size={11} className="text-slate-400" />}
            />
          </div>
          <div className="w-48">
            <ITSelect
              name="kanbanDepartmentFilter"
              value={fx.departmentFilter}
              onChange={(e) => fx.setDepartmentFilter(e.target.value)}
              options={[
                { value: "", label: tt("kanban.allDepartments") },
                ...fx.departmentOptions.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
          {fx.uniqueAssignees.length > 0 && (
            <div className="flex items-center -space-x-2">
              {fx.uniqueAssignees.slice(0, 4).map((u) => {
                const active = fx.assigneeFilter === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      fx.setAssigneeFilter((cur) => (cur === u.id ? null : u.id))
                    }
                    className={`rounded-full transition-all hover:z-10 hover:-translate-y-0.5 ${
                      active ? "ring-2 ring-offset-2 ring-blue-400 rounded-full" : ""
                    }`}
                  >
                    <Avatar name={u.name} seed={u.id} />
                  </button>
                );
              })}
              {fx.uniqueAssignees.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-black border-2 border-white shadow-sm">
                  +{fx.uniqueAssignees.length - 4}
                </div>
              )}
            </div>
          )}
          {fx.hasActiveFilters && (
            <button
              type="button"
              onClick={fx.clearFilters}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              {tt("kanban.clearFilters")}
            </button>
          )}
        </ITFlex>
        <ITFlex align="center" gap={2}>
          {fx.loading && (
            <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {tt("kanban.loading")}
            </ITText>
          )}
          {fx.error && (
            <ITText className="text-[11px] font-bold text-red-600">
              {fx.error}
            </ITText>
          )}
          <ITButton variant="outlined" onClick={fx.reload}>
            <ITFlex align="center" gap={1}>
              <FaSync size={11} />
              <ITText className="font-bold text-[11px]">{tt("kanban.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </div>

      {/* Tablero: columnas planas estilo Jira, scroll horizontal en pantallas angostas */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 -mx-2 px-2">
        {fx.COLUMNS.map((col) => (
          <div
            key={col.status}
            className={`flex-none w-[300px] sm:w-[320px] rounded-2xl bg-slate-200/60 border border-slate-300/60 p-3 transition-colors ${
              fx.dragOver === col.status ? "bg-blue-100 border-blue-400" : ""
            }`}
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
                {col.status === "COMPLETADA" && (
                  <FaCheckCircle size={12} className="text-emerald-500" />
                )}
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  {col.label}
                </ITText>
              </ITFlex>
              <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <span className="text-[9px] font-black text-slate-500">
                  {fx.byStatus[col.status].length}
                </span>
              </div>
            </ITFlex>

            <div className="space-y-2 min-h-[140px]">
              {fx.byStatus[col.status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <ITText className="text-[10px] text-slate-400 italic">
                    {tt("kanban.emptyColumn")}
                  </ITText>
                </div>
              ) : (
                fx.byStatus[col.status].map((a) => {
                  const deptLabel = a.ticket.department?.name ?? "General";
                  const deptTone = hashTone(deptLabel);
                  const priorityMeta = metaFor(PRIORITY_META, a.ticket.priority);
                    const priorityLabel = dyn(tt)(`priorityLabels.${a.ticket.priority}`);
                  const overdue = Boolean(
                    a.dueDate &&
                      a.status !== "COMPLETADA" &&
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
                      className={`rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-3 cursor-pointer ${
                        fx.draggingId === a.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Tag label={deptLabel} tone={deptTone} />
                        {overdue && (
                          <Tag label={tt("kanban.overdue")} tone={{ bg: "#e11d48", text: "#ffffff" }} />
                        )}
                      </div>

                      <ITText className="text-[12.5px] font-bold text-slate-800 leading-snug line-clamp-2 mb-1">
                        {a.title}
                      </ITText>
                      <ITText className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate mb-2">
                        {a.ticket.titulo}
                      </ITText>

                      {a.description ? (
                        <div className="text-[11px] text-slate-500 leading-snug mb-2 line-clamp-2">
                          {a.description}
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <ITFlex align="center" gap={1.5} className="min-w-0">
                          <FaBookmark size={10} className="text-emerald-500 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            #{a.ticketId.slice(0, 8).toUpperCase()}
                          </span>
                        </ITFlex>
                        <ITFlex align="center" gap={2} className="shrink-0">
                          <span
                            title={priorityLabel}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: priorityMeta.tone.bg }}
                          />
                          <Avatar name={a.user.name} seed={a.userId} />
                        </ITFlex>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}