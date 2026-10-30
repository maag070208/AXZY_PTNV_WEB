import type { ReactNode } from "react";
import { ITBentoGauge, ITBentoGrid, ITBentoPill, ITBentoTile, ITText, ITStack } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MiniList, MiniStat, Num } from "@shared/ui/bento-bits";
import { LuCalendarX, LuClipboardList, LuIdCard, LuTimer, LuUserCheck, LuUserX } from "react-icons/lu";
import type { AttendanceTodayWidget, OvertimeWeekWidget, TodayStatus } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatMinutesAsHhMm } from "@shared/utils/dates";

/** Color de cada estado del día (identifica el estado, no la alarma). */
const STATUS_COLOR: Record<TodayStatus, string> = {
  PRESENT: "var(--color-success)",
  LATE: "var(--color-warning)",
  NOT_ARRIVED: "var(--color-danger)",
  NOT_YET: "var(--color-primary-500)",
  REST: "var(--color-text-muted)",
  NO_SCHEDULE: "var(--color-text-muted)",
  UNLINKED: "var(--color-violet-500)",
};

/**
 * Pestaña **Personal** del inicio con el mismo mosaico bento que Operación:
 * expedientes (tarjeta oscura con medidor), asistencia del día, horas extra de
 * la semana y el seguimiento de pendientes. Debajo, el tablero de expedientes
 * con filtros, tabla y detalle.
 */
export interface PersonalRecordsCounts {
  total: number;
  COMPLETE: number;
  REQUIRED: number;
  INCOMPLETE: number;
}

interface Props {
  /** Conteos de expedientes (los calcula la página con su propio hook). */
  recordsCounts: PersonalRecordsCounts;
  /** Datos de los widgets que arma la página (las features no se importan entre sí). */
  attendance: AttendanceTodayWidget | null;
  overtime: OvertimeWeekWidget | null;
  /** Tablero de expedientes que va debajo del mosaico. */
  children?: ReactNode;
}

export default function PersonalDashboard({ recordsCounts, attendance, overtime, children }: Props) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  // Cada número lleva a la pantalla donde se revisa (pre nómina, bitácora, vínculos del reloj).
  const toPayroll = () => navigate("/schedules/payroll");

  const a = attendance;
  const o = overtime;
  const counts = a?.counts;

  const arrived = (counts?.PRESENT ?? 0) + (counts?.LATE ?? 0);


  const notArrived = a?.rows.filter((r) => r.status === "NOT_ARRIVED") ?? [];
  const late = a?.rows.filter((r) => r.status === "LATE").sort((x, y) => y.lateMin - x.lateMin) ?? [];
  const pending = [...(o?.topPending ?? [])].slice(0, 4);

  const total = recordsCounts.total;
  const complete = recordsCounts.COMPLETE;
  const required = recordsCounts.REQUIRED;
  const incomplete = recordsCounts.INCOMPLETE;

  return (
    <ITStack spacing={4}>
      <ITBentoGrid>
        {/* Expedientes: tarjeta oscura con medidor y chips */}
        <ITBentoTile
          tone="sea"
          cols={4}
          rows={4}
          wide
          icon={<LuIdCard size={15} />}
          label={t("records.title")}
          value={<Num value={total} />}
          caption={t("records.missingOf", { total })}
          onClick={() => navigate("/employees/records")}
        >
          <div className="relative z-[1] my-1 flex min-h-0 flex-1 flex-col justify-center">
            {total > 0 && <ITBentoGauge value={complete / total} color="var(--color-warning)" trackColor="rgb(255 255 255 / 0.14)" />}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <ITBentoPill dot="var(--color-warning)">{t("records.kpis.missingRequired")} {required}</ITBentoPill>
              <ITBentoPill dot="var(--color-success)">{t("records.kpis.complete")} {complete}</ITBentoPill>
              <ITBentoPill dot="color-mix(in srgb,currentColor 40%,transparent)">{t("records.kpis.incomplete")} {incomplete}</ITBentoPill>
            </div>
          </div>
        </ITBentoTile>

        {/* Asistencia de hoy: seis celdas en una fila */}
        <ITBentoTile cols={8} rows={2} wide icon={<LuUserCheck size={15} />} label={t("attendance.title")}>
          <div className="mt-1 flex items-center justify-end">
            <ITText as="span" className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}>
              {t("records.haveArrived", { count: arrived })}
            </ITText>
          </div>
          <div className="mt-2 grid flex-1 !grid-cols-6 gap-2">
            <MiniStat
              label={t("attendance.status.PRESENT")}
              value={<Num value={counts?.PRESENT ?? 0} />}
              color={STATUS_COLOR.PRESENT}
              onClick={toPayroll}
              hint={t("attendance.viewReport")}
            />
            <MiniStat
              label={t("attendance.status.LATE")}
              value={<Num value={counts?.LATE ?? 0} />}
              color={STATUS_COLOR.LATE}
              onClick={toPayroll}
              hint={t("attendance.viewReport")}
            />
            <MiniStat
              label={t("attendance.status.NOT_ARRIVED")}
              value={<Num value={counts?.NOT_ARRIVED ?? 0} />}
              color={STATUS_COLOR.NOT_ARRIVED}
              onClick={toPayroll}
              hint={t("attendance.viewReport")}
            />
            <MiniStat
              label={t("attendance.status.NOT_YET")}
              value={<Num value={counts?.NOT_YET ?? 0} />}
              color={STATUS_COLOR.NOT_YET}
              onClick={toPayroll}
              hint={t("attendance.viewReport")}
            />
            <MiniStat
              label={t("attendance.onSite")}
              value={<Num value={counts?.onSite ?? 0} />}
              color="var(--color-violet-500)"
              onClick={() => navigate("/access")}
              hint={t("attendance.viewAccess")}
            />
            <MiniStat
              outline
              label={t("attendance.status.UNLINKED")}
              value={<Num value={counts?.UNLINKED ?? 0} />}
              color="var(--color-warning)"
              onClick={() => navigate("/hr/time-clock/employees")}
              hint={t("attendance.linkClocks")}
            />
          </div>
        </ITBentoTile>

        {/* Horas extra: total y decisión */}
        <ITBentoTile tone="sun" cols={4} rows={2} wide icon={<LuTimer size={15} />} label={t("overtime.title")}>
          <div className="mt-1 flex cursor-pointer items-baseline gap-2" onClick={() => navigate("/schedules/overtime/approval")}>
            <ITText as="span" className="it-bento-tile__value !text-[34px]">{formatMinutesAsHhMm(o?.extraMin ?? 0)}</ITText>
            <ITText as="span" className="it-bento-tile__caption">{t("overtime.calculated")}</ITText>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2">
            <MiniStat
              label={t("overtime.approved")}
              value={<ITText as="span" className="!text-[16px]">{formatMinutesAsHhMm(o?.approvedExtraMin ?? 0)}</ITText>}
              color="var(--color-success)"
              onClick={() => navigate("/schedules/overtime/approval")}
              hint={t("overtime.review")}
            />
            <MiniStat
              label={t("overtime.notApproved")}
              value={<ITText as="span" className="!text-[16px]">{formatMinutesAsHhMm(o?.pendingExtraMin ?? 0)}</ITText>}
              color="var(--color-warning)"
              onClick={() => navigate("/schedules/overtime/approval")}
              hint={t("overtime.review")}
            />
            <MiniStat
              label={t("overtime.rejected")}
              value={<ITText as="span" className="!text-[16px]">{formatMinutesAsHhMm(o?.rejectedExtraMin ?? 0)}</ITText>}
              color="var(--color-danger)"
              onClick={() => navigate("/schedules/overtime/approval")}
              hint={t("overtime.review")}
            />
          </div>
        </ITBentoTile>

        {/* Seguimiento: tres listas cortas */}
        <ITBentoTile cols={4} rows={2} wide icon={<LuClipboardList size={15} />} label={t("attendance.followUp")}>
          <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1">
            <MiniList
              icon={<LuUserX size={13} />}
              title={t("attendance.notArrivedList")}
              emptyLabel={t("empty")}
              items={notArrived.map((r) => ({ id: r.userId, name: r.name, right: r.shift ?? "—" }))}
              onClick={toPayroll}
            />
            <MiniList
              icon={<LuCalendarX size={13} />}
              title={t("attendance.lateList")}
              emptyLabel={t("empty")}
              items={late.map((r) => ({ id: r.userId, name: r.name, right: `${r.lateMin} min` }))}
              onClick={toPayroll}
            />
            <MiniList
              icon={<LuTimer size={13} />}
              title={t("overtime.topPending")}
              emptyLabel={t("empty")}
              items={pending.map((r) => ({ id: r.userId, name: r.name, right: formatMinutesAsHhMm(r.pendingExtraMin) }))}
              onClick={() => navigate("/schedules/overtime/approval")}
            />
          </div>
        </ITBentoTile>

      </ITBentoGrid>

      {/* Expedientes: filtros, tabla y detalle (lo arma la página) */}
      {children}
    </ITStack>
  );
}
