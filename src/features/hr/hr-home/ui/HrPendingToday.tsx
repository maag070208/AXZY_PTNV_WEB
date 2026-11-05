import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuArrowRight, LuCalendarX2, LuClockAlert, LuFileWarning, LuTimer } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { hoursDecimal } from "@entities/schedule";
import { KpiTile } from "@shared/ui/kpi-tile";
import type { AttendanceTodayWidget, HrRecordsWidget, OvertimeWeekWidget } from "@entities/dashboard";

interface Props {
  attendance: AttendanceTodayWidget | null;
  overtime: OvertimeWeekWidget | null;
  records: HrRecordsWidget | null;
  onAttendance: () => void;
  onOvertime: () => void;
  onRecords: () => void;
}

/** Enlace tenue al pie de un indicador. */
function KpiLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <ITButton variant="text" color="gray" size="sm" onClick={onClick}>
      <ITFlex align="center" gap={1}>
        <ITText as="span" className="!text-[11px] font-semibold">
          {label}
        </ITText>
        <LuArrowRight size={12} />
      </ITFlex>
    </ITButton>
  );
}

/**
 * «Pendiente hoy» del inicio de RH: faltas, retardos, tiempo extra por aprobar
 * y expedientes incompletos. Cada indicador abre la pantalla donde se atiende.
 */
export default function HrPendingToday({ attendance, overtime, records, onAttendance, onOvertime, onRecords }: Props) {
  const { t } = useTranslation("hr-home");
  const absences = attendance?.counts.NOT_ARRIVED;
  const lates = attendance?.counts.LATE;
  const pendingExtra = overtime?.pendingExtraMin ?? null;
  const pendingPeople = overtime?.topPending.length ?? 0;
  const incomplete = records?.summary.missingRequired;

  return (
    <section aria-label={t("pending.title")}>
      <ITText className="mb-2 block font-semibold !text-slate-700 !text-[13px]">{t("pending.title")}</ITText>
      <div className="grid grid-cols-1 gap-3 sm:!grid-cols-2 xl:!grid-cols-4">
        <KpiTile
          label={t("pending.absences")}
          value={absences ?? "—"}
          tone={(absences ?? 0) > 0 ? "rose" : "neutral"}
          icon={<LuCalendarX2 size={14} />}
          footer={<KpiLink label={t("pending.absencesAction")} onClick={onAttendance} />}
        />
        <KpiTile
          label={t("pending.lates")}
          value={lates ?? "—"}
          tone={(lates ?? 0) > 0 ? "amber" : "neutral"}
          icon={<LuClockAlert size={14} />}
          footer={<KpiLink label={t("pending.latesAction")} onClick={onAttendance} />}
        />
        <KpiTile
          label={t("pending.overtime")}
          value={pendingExtra === null ? "—" : `${hoursDecimal(pendingExtra)} h`}
          tone={pendingExtra ? "amber" : "neutral"}
          icon={<LuTimer size={14} />}
          footer={<KpiLink label={t("pending.overtimeAction", { people: pendingPeople })} onClick={onOvertime} />}
        />
        <KpiTile
          label={t("pending.records")}
          value={incomplete ?? "—"}
          tone={(incomplete ?? 0) > 0 ? "orange" : "neutral"}
          icon={<LuFileWarning size={14} />}
          footer={<KpiLink label={t("pending.recordsAction")} onClick={onRecords} />}
        />
      </div>
    </section>
  );
}
