import { useCallback, useState } from "react";
import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuFileSpreadsheet, LuFileText } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { usersApi, type User } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { downloadReportCsv } from "@shared/lib/reportDoc";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { PanelCard } from "@shared/ui/panel-card";
import { buildReportDoc, REPORT_IDS, reportFileName, type HrReportId } from "../model/hrReports";
import type { UseHrHome } from "../model/useHrHome";

interface Props {
  fx: UseHrHome;
  /** Generador del PDF (DI: la página inyecta el del widget de reportes). */
  downloadPdf: (doc: ReportDoc, fileName: string) => Promise<void>;
}

/**
 * «Reportes principales» del inicio de RH: pre-nómina, asistencia, faltas y
 * retrasos, tiempo extra y plantilla activa, todos de la semana elegida (la
 * plantilla no depende de la semana). Cada fila descarga PDF o CSV con la misma
 * definición de columnas.
 */
export default function HrReports({ fx, downloadPdf }: Props) {
  const { t } = useTranslation("hr-home");
  const [busy, setBusy] = useState<HrReportId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<User[] | null>(null);

  const loadStaff = useCallback(async (): Promise<User[]> => {
    if (employees) return employees;
    const data = await usersApi.employees();
    setEmployees(data);
    return data;
  }, [employees]);

  const generate = useCallback(
    async (id: HrReportId, format: "pdf" | "csv") => {
      setBusy(id);
      setError(null);
      try {
        const staff = id === "staff" ? await loadStaff() : undefined;
        const doc = buildReportDoc(id, {
          report: fx.report,
          weekLabel: fx.weekLabel,
          employees: staff,
          t: dyn(t),
        });
        const fileName = reportFileName(id, fx.weekStart);
        if (format === "pdf") await downloadPdf(doc, fileName);
        else downloadReportCsv(doc, fileName);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("reports.error"));
      } finally {
        setBusy(null);
      }
    },
    [downloadPdf, fx.report, fx.weekLabel, fx.weekStart, loadStaff, t]
  );

  return (
    <PanelCard title={t("reports.title")} description={t("reports.description")}>
      {error && <ITText className="mb-2 block !text-[11.5px] text-red-600">{error}</ITText>}
      <ITFlex direction="column">
        {REPORT_IDS.map((id) => (
          <ITFlex
            key={id}
            align="center"
            justify="between"
            gap={3}
            className="min-h-[54px] border-b border-slate-100 py-2 last:border-b-0"
          >
            <ITFlex direction="column" className="min-w-0">
              <ITText className="block font-semibold !text-[12.5px] text-slate-800">{t(`reports.${id}.title`)}</ITText>
              <ITText className="block !text-[11px] text-slate-500">{t(`reports.${id}.caption`)}</ITText>
            </ITFlex>
            <ITFlex align="center" gap={2} className="shrink-0">
              <ITButton
                variant="outlined"
                color="gray"
                size="sm"
                disabled={busy !== null || (!fx.report && id !== "staff")}
                onClick={() => void generate(id, "pdf")}
              >
                <ITFlex align="center" gap={1}>
                  <LuFileText size={12} />
                  <ITText as="span" className="!text-[11px] font-semibold">PDF</ITText>
                </ITFlex>
              </ITButton>
              <ITButton
                variant="outlined"
                color="gray"
                size="sm"
                disabled={busy !== null || (!fx.report && id !== "staff")}
                onClick={() => void generate(id, "csv")}
              >
                <ITFlex align="center" gap={1}>
                  <LuFileSpreadsheet size={12} />
                  <ITText as="span" className="!text-[11px] font-semibold">CSV</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        ))}
      </ITFlex>
    </PanelCard>
  );
}
