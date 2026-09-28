import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget, ITButton, ITFlex, ITInput, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaBell, FaFolderOpen, FaIdCard } from "react-icons/fa";
import { dashboardApi, type RecordGapsRow } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { CHART_STATUS, DonutChart, HBarChart } from "@shared/ui/charts";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/** Cuenta cuántas veces aparece cada etiqueta (una persona suma 1 por etiqueta). */
const tally = (labels: string[]) => {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts].map(([label, value]) => ({ label, value }));
};

const MAX_BADGES = 4;

/**
 * Expedientes del personal: quién no tiene los documentos obligatorios (INE,
 * comprobante…), qué otros documentos y datos personales le faltan, y el botón
 * para avisarle (notificación + correo) qué debe entregar.
 */
export default function HrRecordsWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.hrRecords);
  const [search, setSearch] = useState("");
  const [onlyRequired, setOnlyRequired] = useState(false);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows ?? [])
      .filter((r) => r.missingRequired.length || r.missingDocuments.length || r.missingFields.length)
      .filter((r) => !onlyRequired || r.missingRequired.length > 0)
      .filter((r) => !q || [r.name, r.employeeNumber, r.departmentName].some((v) => (v ?? "").toLowerCase().includes(q)))
      // Primero quien no tiene obligatorios, luego quien debe más cosas.
      .sort(
        (a, b) =>
          b.missingRequired.length - a.missingRequired.length ||
          b.missingDocuments.length + b.missingFields.length - (a.missingDocuments.length + a.missingFields.length)
      );
  }, [data, search, onlyRequired]);

  // Gráficas de pendientes sobre todo el personal (no sobre el filtro de la tabla).
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

  const notify = async (row: RecordGapsRow) => {
    setNotifying(row.userId);
    try {
      const res = await dashboardApi.notifyMissingRecords(row.userId);
      setToast({ message: t(res.emailed ? "records.notifiedEmail" : "records.notified", { name: row.name }), type: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : t("records.notifyError"), type: "error" });
    } finally {
      setNotifying(null);
    }
  };

  const badges = (items: string[], color: "danger" | "warning" | "gray") => (
    <ITFlex wrap="wrap" gap={1}>
      {items.slice(0, MAX_BADGES).map((item) => (
        <ITBadget key={item} color={color} size="sm">{item}</ITBadget>
      ))}
      {items.length > MAX_BADGES && (
        <span title={items.slice(MAX_BADGES).join(", ")}>
          <ITBadget color="gray" size="sm">{t("records.moreCount", { count: items.length - MAX_BADGES })}</ITBadget>
        </span>
      )}
    </ITFlex>
  );

  const summary = data?.summary;
  return (
    <WidgetCard
      title={t("records.title")}
      icon={<FaIdCard size={14} />}
      iconClass="bg-rose-600"
      to="/employees"
      loading={loading}
      error={error}
      onRetry={reload}
      wide
    >
      {summary && (
        <ITFlex wrap="wrap" gap={2}>
          <Metric value={`${summary.complete}/${summary.employees}`} label={t("records.complete")} tone="text-emerald-700" />
          <Metric
            value={summary.missingRequired}
            label={t("records.missingRequired")}
            tone="text-rose-600"
            onClick={() => setOnlyRequired((v) => !v)}
          />
          <Metric value={summary.missingDocuments} label={t("records.missingDocuments")} tone="text-amber-600" />
          <Metric value={summary.missingFields} label={t("records.missingFields")} tone="text-amber-600" />
        </ITFlex>
      )}

      {summary && summary.employees > 0 && (
        <div className="mt-2 grid gap-x-6 gap-y-2 md:grid-cols-2">
          <div>
            <SectionLabel>{t("records.chartStatus")}</SectionLabel>
            <DonutChart segments={charts.status} size={120} />
          </div>
          <div>
            <SectionLabel>{t("records.chartDepartments")}</SectionLabel>
            <HBarChart
              rows={charts.departments}
              color={CHART_STATUS.critical}
              unit={t("records.peopleUnit")}
              moreLabel={(count) => t("records.moreCount", { count })}
            />
          </div>
          <div>
            <SectionLabel>{t("records.chartDocuments")}</SectionLabel>
            <HBarChart
              rows={charts.documents}
              color={CHART_STATUS.warning}
              unit={t("records.peopleUnit")}
              moreLabel={(count) => t("records.moreCount", { count })}
            />
          </div>
          <div>
            <SectionLabel>{t("records.chartFields")}</SectionLabel>
            <HBarChart
              rows={charts.fields}
              color={CHART_STATUS.info}
              unit={t("records.peopleUnit")}
              moreLabel={(count) => t("records.moreCount", { count })}
            />
          </div>
        </div>
      )}

      <ITFlex align="end" gap={2} className="mt-4">
        <div className="flex-1">
          <ITInput name="recordsSearch" label={t("records.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ITButton variant={onlyRequired ? "filled" : "outlined"} color="danger" onClick={() => setOnlyRequired((v) => !v)}>
          <ITText className="text-[11px] font-bold">{t("records.showOnlyRequired")}</ITText>
        </ITButton>
      </ITFlex>

      {rows.length === 0 ? (
        <ITText className="mt-4 block text-center text-[12px] font-bold text-emerald-700">{t("records.allComplete")}</ITText>
      ) : (
        <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-100 text-[9px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">{t("attendance.people")}</th>
                <th className="px-3 py-2 text-left">{t("records.required")}</th>
                <th className="px-3 py-2 text-left">{t("records.documents")}</th>
                <th className="px-3 py-2 text-left">{t("records.fields")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-t border-slate-100 align-top hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-black text-slate-800">{r.name}</div>
                    <div className="text-[9px] font-bold uppercase text-slate-400">
                      {[r.employeeNumber && `#${r.employeeNumber}`, r.departmentName].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.missingRequired.length ? badges(r.missingRequired.map((d) => d.name), "danger") : "—"}</td>
                  <td className="px-3 py-2">{r.missingDocuments.length ? badges(r.missingDocuments.map((d) => d.name), "warning") : "—"}</td>
                  <td className="px-3 py-2">
                    {r.missingFields.length ? badges(r.missingFields.map((f) => t(`profileFields.${f}`)), "gray") : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <ITFlex gap={1} justify="end">
                      <ITButton
                        variant="outlined"
                        color="primary"
                        size="sm"
                        disabled={notifying === r.userId}
                        onClick={() => void notify(r)}
                        title={t("records.notifyTitle")}
                      >
                        <ITFlex align="center" gap={1}>
                          <FaBell size={10} />
                          <ITText className="text-[10px] font-bold">{t("records.notify")}</ITText>
                        </ITFlex>
                      </ITButton>
                      <ITButton
                        variant="outlined"
                        color="secondary"
                        size="sm"
                        onClick={() => navigate(`/employees/${r.userId}`)}
                        title={t("records.openRecord")}
                      >
                        <FaFolderOpen size={11} />
                      </ITButton>
                    </ITFlex>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={3000} onClose={() => setToast(null)} />}
    </WidgetCard>
  );
}
