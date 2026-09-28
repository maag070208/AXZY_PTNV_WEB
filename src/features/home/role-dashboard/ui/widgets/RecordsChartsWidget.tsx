import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaChartBar } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { CHART_STATUS, DonutChart, HBarChart } from "@shared/ui/charts";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { SectionLabel } from "../WidgetCard";

/** Cuenta cuántas veces aparece cada etiqueta (una persona suma 1 por etiqueta). */
const tally = (labels: string[]) => {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts].map(([label, value]) => ({ label, value }));
};

/** Gráficas de los pendientes de expedientes: estado general, por departamento, documentos y datos que más faltan. */
export default function RecordsChartsWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.hrRecords);

  const charts = useMemo(() => {
    const all = data?.rows ?? [];
    const required = all.filter((r) => r.missingRequired.length > 0);
    const documents = all.filter((r) => !r.missingRequired.length && r.missingDocuments.length > 0);
    const fields = all.filter((r) => !r.missingRequired.length && !r.missingDocuments.length && r.missingFields.length > 0);
    return {
      status: [
        { label: t("records.statusComplete"), value: all.length - required.length - documents.length - fields.length, color: CHART_STATUS.good },
        { label: t("records.statusFields"), value: fields.length, color: CHART_STATUS.info },
        { label: t("records.statusDocuments"), value: documents.length, color: CHART_STATUS.warning },
        { label: t("records.statusRequired"), value: required.length, color: CHART_STATUS.critical },
      ],
      documents: tally(all.flatMap((r) => [...r.missingRequired, ...r.missingDocuments].map((d) => d.name))),
      fields: tally(all.flatMap((r) => r.missingFields.map((f) => t(`profileFields.${f}`)))),
      departments: tally(required.map((r) => r.departmentName ?? t("records.noDepartment"))),
    };
  }, [data, t]);

  const more = (count: number) => t("records.moreCount", { count });
  return (
    <WidgetCard
      title={t("records.chartsTitle")}
      icon={<FaChartBar size={13} />}
      iconClass="bg-rose-600"
      to="/employees/records"
      loading={loading}
      error={error}
      onRetry={reload}
      wide
    >
      <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        <div>
          <SectionLabel>{t("records.chartStatus")}</SectionLabel>
          <DonutChart segments={charts.status} size={120} />
        </div>
        <div>
          <SectionLabel>{t("records.chartDepartments")}</SectionLabel>
          <HBarChart rows={charts.departments} color={CHART_STATUS.critical} unit={t("records.peopleUnit")} moreLabel={more} />
        </div>
        <div>
          <SectionLabel>{t("records.chartDocuments")}</SectionLabel>
          <HBarChart rows={charts.documents} color={CHART_STATUS.warning} unit={t("records.peopleUnit")} moreLabel={more} />
        </div>
        <div>
          <SectionLabel>{t("records.chartFields")}</SectionLabel>
          <HBarChart rows={charts.fields} color={CHART_STATUS.info} unit={t("records.peopleUnit")} moreLabel={more} />
        </div>
      </div>
    </WidgetCard>
  );
}
