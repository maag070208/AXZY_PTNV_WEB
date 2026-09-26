import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaScroll } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { personalApi, type DisciplinaryReport } from "@entities/hr";
import { DisciplinaryReportPreview, downloadDisciplinaryReportPdf } from "@widgets/disciplinary-report";
import { i18n } from "@shared/i18n";

export default function DisciplinaryReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t: tt } = useTranslation(["disciplinary-reports", "common"]);
  const navigate = useNavigate();
  const [disciplinaryReport, setDisciplinaryReport] = useState<DisciplinaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    personalApi
      .disciplinaryReport(id)
      .then(setDisciplinaryReport)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : i18n.t("employees:disciplinary.loadError"))
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ITPage title={tt("preview.title")} loading backAction={() => navigate("/employees/disciplinary-reports")}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (error || !disciplinaryReport) {
    return (
      <ITPage
        title={tt("preview.title")}
        backAction={() => navigate("/employees/disciplinary-reports")}
        breadcrumbs={[
          { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
          { label: tt("breadcrumb"), onClick: () => navigate("/employees/disciplinary-reports") },
          { label: tt("preview.title") },
        ]}
      >
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error ?? i18n.t("employees:disciplinary.notFound")}
        </ITAlert>
      </ITPage>
    );
  }

  const area = disciplinaryReport.user.department?.name
    ? `${disciplinaryReport.user.department.name}${disciplinaryReport.user.subarea ? ` — ${disciplinaryReport.user.subarea.name}` : ""}`
    : "—";

  return (
    <ITPage
      title={tt("preview.title")}
      description={`${disciplinaryReport.user.name} · ${tt(`reasons.${disciplinaryReport.reason}`)}`}
      icon={<FaScroll size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb"), onClick: () => navigate("/employees/disciplinary-reports") },
        { label: disciplinaryReport.user.name },
      ]}
      backAction={() => navigate("/employees/disciplinary-reports")}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => void downloadDisciplinaryReportPdf(disciplinaryReport)}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{tt("preview.download")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={5}>
          <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{tt("doc.documentTitle")}</ITText>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.employee")}</ITText>
              <ITText className="text-sm font-bold text-slate-900">{disciplinaryReport.user.name}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.employeeNumber")}</ITText>
              <ITText className="text-sm text-slate-700">{disciplinaryReport.user.employeeNumber ?? "—"}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.jobTitle")}</ITText>
              <ITText className="text-sm text-slate-700">{disciplinaryReport.user.jobTitle ?? "—"}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.department")}</ITText>
              <ITText className="text-sm text-slate-700">{area}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.incidentDate")}</ITText>
              <ITText className="text-sm text-slate-700">{formatDate(disciplinaryReport.incidentDate)}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.reason")}</ITText>
              <ITText className="text-sm text-slate-700">{tt(`reasons.${disciplinaryReport.reason}`)}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.description")}</ITText>
              <ITText className="text-sm text-slate-600">{disciplinaryReport.description}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.sanction")}</ITText>
              <ITText className="text-sm text-slate-600">{disciplinaryReport.sanction || "—"}</ITText>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={7}>
          <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{tt("preview.title")}</ITText>
            <DisciplinaryReportPreview disciplinaryReport={disciplinaryReport} />
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}