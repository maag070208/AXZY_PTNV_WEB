import { useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITInput,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBell,
  FaBusinessTime,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaFilePdf,
  FaInfoCircle,
  FaUserSlash,
  FaUsers,
} from "react-icons/fa";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { dyn } from "@shared/i18n/dyn";
import { KPI_TONES, KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import { WaveFill } from "@shared/ui/charts";
import { TabBar } from "@shared/ui/tab-bar";
import { WEEKLY_LEGEND, WEEKLY_STATUS_BADGE, hoursDecimal } from "@entities/schedule";
import type { UseWeeklyAttendance, WeeklyAttendanceMode } from "../model/useWeeklyAttendance";
import WeeklyAttendanceTable from "./WeeklyAttendanceTable";

/**
 * Reporte semanal de pre nómina.
 *
 * La pantalla se armó de arriba abajo en tres bloques, cada uno con una sola
 * responsabilidad: filtros + acciones (una fila), totales de la semana
 * (`KpiTile`) y el reporte con su selector de vista. La simbología se muestra
 * solo si se pide: antes competía con los filtros y confundía.
 */
export default function WeeklyAttendancePanel({ fx }: { fx: UseWeeklyAttendance }) {
  const t = dyn(fx.t);
  const report = fx.report;
  const summary = report?.summary;
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // Avisos de la semana: solo se muestran si hay algo que atender.
  const notices: string[] = [];
  if (summary?.unlinked) notices.push(t("unlinkedHint", { count: summary.unlinked }));
  if (summary?.withoutSchedule) notices.push(t("withoutScheduleHint", { count: summary.withoutSchedule }));
  const noticesCount = (summary?.unlinked ?? 0) + (summary?.withoutSchedule ?? 0);

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } },
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) fx.setWeekDate(value[0]);
  };

  // Totales de la semana: cada tarjeta dice el número **y contra qué se compara**
  // (vinculadas, programadas, calculadas). Sin ese contexto, en una semana en
  // cero las tarjetas se veían vacías. La barra fina del pie muestra la proporción.
  const totals: Array<{
    key: string;
    value: string;
    hint?: string;
    tone: KpiTone;
    icon: React.ReactNode;
    footer?: React.ReactNode;
    /** Proporción real (0..1): pinta la ola de fondo. Sin proporción, no se pasa. */
    ratio?: number;
  }> = summary
    ? [
        {
          key: "people",
          value: String(summary.people),
          tone: "sky",
          icon: <FaUsers size={14} />,
          footer: t("context.people", {
            linked: summary.people - summary.unlinked,
            total: summary.people,
          }),
          ratio: summary.people > 0 ? (summary.people - summary.unlinked) / summary.people : undefined,
        },
        {
          key: "worked",
          value: `${hoursDecimal(summary.workedMin)} ${t("hoursShort")}`,
          tone: "emerald",
          icon: <FaClock size={14} />,
          footer: t("context.worked", { scheduled: `${hoursDecimal(summary.scheduledMin)} ${t("hoursShort")}` }),
          ratio: summary.scheduledMin > 0 ? summary.workedMin / summary.scheduledMin : undefined,
        },
        {
          key: "overtime",
          value: `${hoursDecimal(summary.extraMin)} ${t("hoursShort")}`,
          tone: "amber",
          icon: <FaBusinessTime size={14} />,
          footer: t("context.overtime", { worked: `${hoursDecimal(summary.workedMin)} ${t("hoursShort")}` }),
          ratio: summary.workedMin > 0 ? summary.extraMin / summary.workedMin : undefined,
        },
        {
          key: "approved",
          value: `${hoursDecimal(summary.approvedExtraMin)} ${t("hoursShort")}`,
          tone: "emerald",
          icon: <FaCheckCircle size={14} />,
          footer: t("context.approved", {
            pct: summary.extraMin > 0 ? Math.round((summary.approvedExtraMin / summary.extraMin) * 100) : 0,
          }),
          ratio: summary.extraMin > 0 ? summary.approvedExtraMin / summary.extraMin : undefined,
        },
        {
          key: "absences",
          value: String(summary.absences),
          tone: summary.absences > 0 ? "rose" : "neutral",
          icon: <FaUserSlash size={14} />,
          footer: t("context.absences", { total: summary.people }),
          ratio: summary.people > 0 ? summary.absences / summary.people : undefined,
        },
      ]
    : [];

  return (
    <ITFlex direction="column" gap={4}>
      {/* Filtros de la semana y acciones, en una sola fila */}
      <ITCard>
        <div className="grid gap-3 lg:!grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-end">
          <ITFlex align="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={fx.previousWeek} title={t("filters.previousWeek")}>
              <FaChevronLeft size={12} />
            </ITButton>
            <div className="min-w-0 flex-1">
              <ITDatePicker
                name="weeklyAttendanceWeek"
                label={t("filters.week")}
                range
                value={fx.rangeValue}
                onChange={handleRange}
                className="w-full min-w-0"
              />
            </div>
            <ITButton variant="outlined" color="secondary" onClick={fx.nextWeek} title={t("filters.nextWeek")}>
              <FaChevronRight size={12} />
            </ITButton>
          </ITFlex>

          <ITSearchSelect
            name="weeklyAttendanceDepartment"
            label={t("filters.department")}
            options={[
              { value: "", label: t("filters.allDepartments") },
              ...fx.departments.data.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={fx.departmentId}
            onChange={(value) => fx.setDepartmentId(String(value))}
            className="w-full min-w-0"
          />

          <ITInput
            name="weeklyAttendanceSearch"
            label={t("filters.search")}
            placeholder={t("filters.searchPlaceholder")}
            value={fx.search}
            onChange={(e) => fx.setSearch(e.target.value)}
          />

          <ITFlex align="center" gap={1} className="lg:pb-0.5">
            {noticesCount > 0 && (
              <ITButton variant="outlined" color="warning" onClick={() => setNoticesOpen(true)} title={t("notices.title")}>
                <ITFlex align="center" gap={1}>
                  <FaBell size={13} />
                  <ITText className="text-[11px] font-bold">{noticesCount}</ITText>
                </ITFlex>
              </ITButton>
            )}
            <ITButton variant="filled" color="primary" onClick={fx.exportPdf} disabled={fx.exporting || !report || report.rows.length === 0}>
              <ITFlex align="center" gap={1}>
                <FaFilePdf size={13} />
                <ITText className="text-[11px] font-bold">{fx.exporting ? t("exporting") : t("exportPdf")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </div>

        {totals.length > 0 && (
          <div className="bento-stagger mt-4 grid grid-cols-2 gap-2.5 sm:!grid-cols-3 xl:!grid-cols-5">
            {totals.map((k) => (
              <KpiTile
                key={k.key}
                size="sm"
                tone={k.tone}
                label={t(`kpis.${k.key}`)}
                value={k.value}
                icon={k.icon}
                backdrop={
                  k.ratio !== undefined && k.ratio > 0 ? (
                    <WaveFill level={k.ratio} color={KPI_TONES[k.tone].accent} />
                  ) : undefined
                }
                footer={<span className="text-[11px] leading-snug text-slate-600">{k.footer}</span>}
              />
            ))}
          </div>
        )}
      </ITCard>

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {/* Vista del reporte y simbología (a pedido) */}
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <TabBar
          items={[
            { id: "SUMMARY" as WeeklyAttendanceMode, label: t("view.summary") },
            { id: "DETAIL" as WeeklyAttendanceMode, label: t("view.detail") },
          ]}
          value={fx.mode}
          onChange={fx.setMode}
          size="sm"
        />
        <ITButton variant="raised-text" color="secondary" onClick={() => setLegendOpen((open) => !open)}>
          <ITFlex align="center" gap={1}>
            <FaInfoCircle size={12} />
            <ITText className="text-[11px] font-bold">{t("legend")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {legendOpen && (
        <ITCard>
          <ITFlex align="center" wrap="wrap" gap={2}>
            {WEEKLY_LEGEND.map((status) => (
              <ITBadget key={status} color={WEEKLY_STATUS_BADGE[status]} size="sm">
                {t(`status.${status}`)}
              </ITBadget>
            ))}
            {report && (
              <ITText className="ml-auto text-[11px] font-semibold text-slate-400">
                {t("timezone", { tz: report.range.timezone })}
              </ITText>
            )}
          </ITFlex>
        </ITCard>
      )}

      {fx.loading && !report ? (
        <ITFlex justify="center" className="py-16">
          <LottieLoader size="lg" />
        </ITFlex>
      ) : report && report.rows.length > 0 ? (
        <div className={fx.loading ? "opacity-60 transition-opacity" : undefined}>
          <WeeklyAttendanceTable
            report={report}
            mode={fx.mode}
            groupByDepartment={!fx.departmentId}
            t={fx.t}
            onParamsChange={fx.setTableParams}
            reloadTrigger={fx.reportVersion}
            queryKey={fx.queryKey}
          />
        </div>
      ) : (
        !fx.loading && (
          <ITCard className="!p-8 text-center">
            <ITText className="text-[12px] font-bold text-slate-500">{t("empty")}</ITText>
          </ITCard>
        )
      )}

      <ITDialog isOpen={noticesOpen} onClose={() => setNoticesOpen(false)} title={t("notices.title")}>
        <ITFlex direction="column" gap={3}>
          {notices.map((notice, i) => (
            <ITFlex key={i} align="start" gap={2}>
              <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={13} />
              <ITText className="text-[12px] font-bold text-slate-600">{notice}</ITText>
            </ITFlex>
          ))}
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
