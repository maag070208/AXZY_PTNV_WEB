import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AttendanceTodayWidget, OvertimeWeekWidget } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { toTitleCase } from "@shared/utils/text";
import { AttentionBlock as Block, CardShell } from "@shared/ui/dashboard-card";

const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <span>
    {label}: <b className="font-bold text-slate-900">{value}</b>
  </span>
);

/** Tarjeta "Requieren atención": lo que hoy necesita una acción de RH. */
export default function AttentionCard({
  attendance,
  overtime,
}: {
  attendance: AttendanceTodayWidget | null;
  overtime: OvertimeWeekWidget | null;
}) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();

  const notArrivedRows = attendance?.rows.filter((r) => r.status === "NOT_ARRIVED") ?? [];
  const notArrived = attendance?.counts.NOT_ARRIVED ?? 0;
  const unlinked = attendance?.counts.UNLINKED ?? 0;
  const late = attendance?.counts.LATE ?? 0;
  const pendingHours = overtime?.topPending.length ?? 0;
  const pending = (notArrived > 0 ? 1 : 0) + (unlinked > 0 ? 1 : 0);

  const first = notArrivedRows[0];
  const firstLabel = first ? `${toTitleCase(first.name)}${first.shift ? ` (${first.shift})` : ""}` : "";
  const subtitle = first && notArrived > 1 ? `${firstLabel} ${t("attention.andMore", { count: notArrived - 1 })}` : firstLabel;

  return (
    <CardShell
      title={t("attention.title")}
      className="xl:basis-[29%]"
      right={
        pending > 0 ? (
          <span className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: "#fbeaea", color: "var(--color-danger)" }}>
            {t("attention.pending", { count: pending })}
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-1 flex-col gap-2.5">
        {notArrived > 0 && (
          <Block
            value={notArrived}
            title={t("attendance.notArrivedList")}
            subtitle={subtitle}
            action={t("attention.view")}
            onAction={() => navigate("/schedules/payroll")}
            bg="#fbeaea"
            color="var(--color-danger)"
          />
        )}
        {unlinked > 0 && (
          <Block
            value={unlinked}
            title={t("attendance.status.UNLINKED")}
            subtitle={t("attention.unlinkedHint")}
            action={t("attention.link")}
            onAction={() => navigate("/hr/time-clock/employees")}
            bg="#fef1e3"
            color="#f97316"
          />
        )}
        {pending === 0 && <div className="py-3 text-[13px] text-slate-500">{t("attention.allClear")}</div>}
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[12px] text-slate-600">
          <Stat label={t("attention.late")} value={late} />
          <Stat label={t("attention.unapproved")} value={pendingHours} />
        </div>
      </div>
    </CardShell>
  );
}
