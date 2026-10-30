import {
  ITAlert,
  ITButton,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
  useITBentoCountUp,
} from "@axzydev/axzy_ui_system";
import { useMemo, useState } from "react";
import {
  LuCalendarDays,
  LuClockAlert,
  LuPlus,
  LuRotateCcw,
  LuScrollText,
  LuUserX,
} from "react-icons/lu";
import { LangostinConfirm } from "@shared/ui/langostin-confirm";
import { LangostinState } from "@shared/ui/langostin";
import { FilterPills, type FilterPillItem } from "@shared/ui/filter-pills";
import { ListSummaryStrip, type ListSummaryItem } from "@shared/ui/list-summary-strip";
import { PanelCard } from "@shared/ui/panel-card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DisciplinaryReport } from "@entities/hr";
import { useCan } from "@entities/user";
import {
  DISCIPLINARY_REASONS,
  DisciplinaryReportForm,
  DisciplinaryReportsTable,
  useDisciplinaryReports,
  type DisciplinaryQuickFilter,
  type DisciplinaryReasonFilter,
} from "@features/hr/disciplinary-reports";
import { useGoBack } from "@shared/lib/useGoBack";

/** Número grande de un mosaico: sube de 0 al valor al montar (como el Inicio). */
function Big({ value }: { value: number }) {
  const shown = useITBentoCountUp(value);
  return <>{Math.round(shown).toLocaleString("es-MX")}</>;
}

export default function HrReportsPage() {
  const { t: tt, i18n } = useTranslation(["disciplinary-reports", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const fx = useDisciplinaryReports();
  const [disciplinaryReportToDelete, setDisciplinaryReportToDelete] = useState<DisciplinaryReport | null>(null);

  // Consultar, levantar y eliminar actas piden el mismo permiso en la API.
  const canManage = useCan("hr.disciplinary_reports");

  const summary = fx.summary;
  const percentOf = (value: number) =>
    summary && summary.total > 0 ? Math.round((value / summary.total) * 100) : 0;

  const monthName = useMemo(() => {
    const locale = i18n.language?.startsWith("en") ? "en-US" : "es-MX";
    return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date());
  }, [i18n.language]);

  // Totales reales del endpoint de la lista; cada mosaico es un filtro rápido.
  const summaryItems: ListSummaryItem[] = summary
    ? [
        {
          id: "all",
          label: tt("summary.total"),
          value: <Big value={summary.total} />,
          tone: "plain",
          icon: <LuScrollText size={15} />,
        },
        {
          id: "month",
          label: tt("summary.month"),
          value: <Big value={summary.month} />,
          tone: "mint",
          icon: <LuCalendarDays size={15} />,
          caption: monthName,
        },
        {
          id: "ABSENCE",
          label: tt("summary.absences"),
          value: <Big value={summary.byReason.ABSENCE} />,
          tone: "sun",
          icon: <LuUserX size={15} />,
          caption: tt("summary.share", { percent: percentOf(summary.byReason.ABSENCE) }),
        },
        {
          id: "TARDINESS",
          label: tt("summary.tardiness"),
          value: <Big value={summary.byReason.TARDINESS} />,
          tone: "lavender",
          icon: <LuClockAlert size={15} />,
          caption: tt("summary.share", { percent: percentOf(summary.byReason.TARDINESS) }),
        },
      ]
    : [];

  const reasonPills: FilterPillItem<DisciplinaryReasonFilter>[] = [
    { id: "all", label: tt("filters.all") },
    ...DISCIPLINARY_REASONS.map((reason) => ({
      id: reason,
      label: tt(`reasons.${reason}`),
      count: summary?.byReason[reason],
    })),
  ];

  const newReportButton = canManage ? (
    <ITButton variant="filled" color="primary" onClick={() => fx.setShowForm(true)}>
      <ITFlex align="center" gap={1}>
        <LuPlus size={14} />
        <ITText className="font-bold text-[12px]">{tt("newDisciplinaryReport")}</ITText>
      </ITFlex>
    </ITButton>
  ) : undefined;

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("title")}
      description={tt("description")}
      backAction={() => goBack("/")}
      icon={<LuScrollText size={20} />}
      breadcrumbs={[
        { label: tt("common:nav.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb") },
      ]}
      actions={newReportButton}
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {!canManage ? (
        <PanelCard>
          <LangostinState kind="forbidden" />
        </PanelCard>
      ) : summary?.total === 0 ? (
        <PanelCard>
          <LangostinState
            kind="empty"
            title={tt("empty.title")}
            description={tt("empty.description")}
            action={newReportButton}
          />
        </PanelCard>
      ) : (
        <ITFlex direction="column" gap={4}>
          {summaryItems.length > 0 && (
            <ListSummaryStrip
              items={summaryItems}
              activeId={fx.quick}
              onSelect={(id) => fx.setQuick(id as DisciplinaryQuickFilter)}
              // El CSS del kit (sin capa) gana el `grid-cols` base: el override lleva `!`.
              className="lg:!grid-cols-4"
            />
          )}

          {summaryItems.length > 0 && (
            <PanelCard
              actions={
                <ITButton
                  variant="text"
                  color="gray"
                  size="sm"
                  disabled={!fx.hasFilters}
                  onClick={fx.clearFilters}
                >
                  <ITFlex align="center" gap={1}>
                    <LuRotateCcw size={12} />
                    <ITText className="font-bold text-[11px]">{tt("filters.clear")}</ITText>
                  </ITFlex>
                </ITButton>
              }
            >
              <ITFlex align="center" wrap="wrap" gap={2}>
                <FilterPills
                  items={reasonPills}
                  value={fx.reason}
                  onChange={fx.setReasonFilter}
                  className="min-w-0 flex-1"
                />
                <div className="w-full sm:w-72">
                  <ITInput
                    name="actasBuscar"
                    placeholder={tt("filters.searchPlaceholder")}
                    value={fx.search}
                    onChange={(event) => fx.setSearch(event.target.value)}
                    className="w-full min-w-0"
                  />
                </div>
              </ITFlex>
            </PanelCard>
          )}

          <PanelCard title={tt("table.title")} icon={<LuScrollText size={15} />}>
            <DisciplinaryReportsTable
              fetchData={fx.fetchTableData}
              reloadKey={fx.reloadKey}
              externalFilters={fx.externalFilters}
              tableKey={fx.tableKey}
              canDelete={canManage}
              onView={(disciplinaryReport) => navigate(`/employees/disciplinary-reports/${disciplinaryReport.id}`)}
              onDelete={(disciplinaryReport) => setDisciplinaryReportToDelete(disciplinaryReport)}
            />
          </PanelCard>
        </ITFlex>
      )}

      <DisciplinaryReportForm
        isOpen={fx.showForm}
        saving={fx.saving}
        onClose={() => fx.setShowForm(false)}
        onSave={(input) => void fx.createDisciplinaryReport(input)}
      />

      <LangostinConfirm
        isOpen={!!disciplinaryReportToDelete}
        onClose={() => setDisciplinaryReportToDelete(null)}
        onConfirm={() => {
          if (disciplinaryReportToDelete) void fx.deleteDisciplinaryReport(disciplinaryReportToDelete.id);
          setDisciplinaryReportToDelete(null);
        }}
        title={tt("actions.delete")}
        message={tt("form.deleteConfirm", {
          name: disciplinaryReportToDelete?.user.name ?? "",
        })}
        confirmLabel={tt("actions.delete")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}
