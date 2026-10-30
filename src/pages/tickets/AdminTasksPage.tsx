import { useMemo, useState } from "react";
import { ITBentoStatStrip, ITButton, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { LuKanban, LuListChecks, LuRefreshCw, LuSearch } from "react-icons/lu";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  useAssignmentList,
  AdminTasksTable,
} from "@features/ticket/tasks-table";
import { useGoBack } from "@shared/lib/useGoBack";
import { FilterPills } from "@shared/ui/filter-pills";

/** Tono bento de cada cifra (mismo lenguaje que la lista de tickets). */
const STAT_TONE: Record<string, "sea" | "rose" | "mint"> = {
  all: "sea",
  overdue: "rose",
  ok: "mint",
};

export default function AdminTasksPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canCompleteTasks = useCan("tasks.complete");

  const fx = useAssignmentList("admintasks.loadError");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "COMPLETED" | "IN_REVIEW">("all");
  const [quick, setQuick] = useState<"overdue" | "ok" | null>(null);

  const total = fx.rows.length;
  const overdue = fx.overdue;
  const ok = total - overdue;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  // Filtros de la barra: búsqueda por tarea/empleado/ticket, estado y el atajo del resumen.
  const externalFilters = useMemo(() => {
    const filters: Record<string, string | boolean> = {};
    if (query.trim()) filters.title = query.trim();
    if (status !== "all") filters.status = status;
    if (quick === "overdue") filters.overdue = true;
    if (quick === "ok") filters.overdue = false;
    return filters;
  }, [query, status, quick]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fx.rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (quick === "overdue" && !(r.status !== "COMPLETED" && r.dueDate && new Date(r.dueDate) < new Date())) return false;
      if (quick === "ok" && r.status !== "COMPLETED" && !(r.dueDate && new Date(r.dueDate) < new Date()) === false) return false;
      if (!q) return true;
      return `${r.title} ${r.description} ${r.user.name} ${r.ticket.title}`.toLowerCase().includes(q);
    }).length;
  }, [fx.rows, query, status, quick]);

  if (!canCompleteTasks) return <Navigate to="/" replace />;

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("admintasks.title")}
      description={tt("admintasks.description", { count: fx.rows.length })}
      backAction={() => goBack("/")}
      icon={<LuListChecks size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("admintasks.breadcrumb") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
            <ITFlex align="center" gap={1}>
              <LuKanban size={14} />
              <ITText className="font-bold text-[11px]">{tt("admintasks.viewBoard")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" onClick={fx.reload}>
            <ITFlex align="center" gap={1}>
              <LuRefreshCw size={13} />
              <ITText className="font-bold text-[11px]">{tt("admintasks.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      {/* Resumen de las tareas de todos los tickets: cifras clicables + barra. */}
      <ITBentoStatStrip
        className="mb-4"
        stack
        items={[
          { id: "all", label: tt("tasksTable.summaryTotal"), value: total, caption: tt("tasksTable.summaryTotalCaption"), color: "var(--color-primary-600)", tone: STAT_TONE.all },
          { id: "overdue", label: tt("tasksTable.summaryOverdue"), value: overdue, caption: tt("tasksTable.pctOfTotal", { pct: pct(overdue) }), color: "var(--color-danger)", tone: STAT_TONE.overdue },
          { id: "ok", label: tt("tasksTable.summaryOk"), value: ok, caption: tt("tasksTable.pctOfTotal", { pct: pct(ok) }), color: "var(--color-success)", tone: STAT_TONE.ok },
        ]}
        stackItems={[
          { id: "overdue", label: tt("tasksTable.summaryOverdue"), value: overdue, color: "var(--color-danger)" },
          { id: "ok", label: tt("tasksTable.summaryOk"), value: ok, color: "var(--color-success)" },
        ]}
        activeId={quick ?? "all"}
        onSelect={(id) => setQuick(id === "all" ? null : id === "overdue" ? "overdue" : "ok")}
      />

      {(fx.loading || fx.error) && (
        <ITFlex justify="end" align="center" gap={2} className="mb-2">
          {fx.loading && <ITText className="text-[12px] font-bold text-slate-400">{tt("admintasks.loading")}</ITText>}
          {fx.error && <ITText className="text-[12px] font-semibold text-[color:var(--color-danger)]">{fx.error}</ITText>}
        </ITFlex>
      )}

      <AdminTasksTable
        fx={fx}
        externalFilters={externalFilters}
        toolbar={
          <ITFlex align="center" wrap="wrap" gap={2}>
            <div className="w-full sm:w-80">
              <ITInput
                name="adminTasksSearch"
                placeholder={tt("tasksTable.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                iconLeft={<LuSearch size={14} />}
                className="w-full min-w-0"
              />
            </div>
            <FilterPills
              items={[
                { id: "all" as const, label: tt("tasksTable.filterAll") },
                { id: "COMPLETED" as const, label: tt("tasksTable.filterCompleted") },
                { id: "IN_REVIEW" as const, label: tt("tasksTable.filterInReview") },
              ]}
              value={status}
              onChange={setStatus}
            />
            <ITText muted className="ml-auto whitespace-nowrap !text-[12px]">
              {tt("tasksTable.visible", { shown, total })}
            </ITText>
          </ITFlex>
        }
      />
    </ITPage>
  );
}