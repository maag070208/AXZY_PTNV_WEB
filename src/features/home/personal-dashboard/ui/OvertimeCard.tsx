import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { OvertimeWeekWidget } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatMinutesAsHhMm } from "@shared/utils/dates";
import { CardShell, DotRow } from "@shared/ui/dashboard-card";

/** Tarjeta "Horas extra · semana": total calculado y su decisión. */
export default function OvertimeCard({ overtime }: { overtime: OvertimeWeekWidget | null }) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const toApproval = () => navigate("/schedules/overtime/approval");

  const rows = [
    { key: "approved", label: t("overtime.approved"), min: overtime?.approvedExtraMin ?? 0, color: "var(--color-success)" },
    { key: "pending", label: t("overtime.toApprove"), min: overtime?.pendingExtraMin ?? 0, color: "var(--color-warning)" },
    { key: "rejected", label: t("overtime.rejected"), min: overtime?.rejectedExtraMin ?? 0, color: "var(--color-danger)" },
  ];

  return (
    <CardShell
      title={t("overtime.titleWeek")}
      className="xl:basis-[27%]"
      right={
        <button type="button" onClick={toApproval} className="cursor-pointer text-[13px] font-semibold text-slate-900 underline">
          {t("overtime.report")}
        </button>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[34px] font-bold leading-none tabular-nums text-slate-900">{formatMinutesAsHhMm(overtime?.extraMin ?? 0)}</span>
        <span className="text-[13px] lowercase text-slate-500">{t("overtime.calculated")}</span>
      </div>
      <div className="mt-3">
        {rows.map((r) => (
          <DotRow key={r.key} label={r.label} value={formatMinutesAsHhMm(r.min)} color={r.color} />
        ))}
      </div>
    </CardShell>
  );
}
