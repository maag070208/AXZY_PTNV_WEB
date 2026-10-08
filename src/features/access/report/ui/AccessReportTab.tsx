import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITChip,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITProgress,
  ITSearchSelect,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaDoorOpen,
  FaExclamationTriangle,
  FaRegCircle,
} from "react-icons/fa";
import {
  type AccessReportPeriod,
  type AttendanceDayStatus,
  type PeopleAttendanceDay,
  type PeopleAttendanceRow,
  type PeopleAttendanceView,
} from "@entities/access";
import { punchTime, workedTime } from "@entities/schedule";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { dyn } from "@shared/i18n/dyn";
import { dateLocale } from "@shared/i18n";
import type { UseAccessReport } from "../model/useAccessReport";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const PERIODS: AccessReportPeriod[] = ["DAY", "WEEK", "FORTNIGHT", "MONTH"];
const VIEWS: PeopleAttendanceView[] = ["ALL", "INCIDENTS", "ON_SITE", "WITHOUT_RECORDS"];

/** Zona del navegador mientras llega la del servidor en `summary.range`. */
const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Ancho de la columna de días según el periodo. */
const DAYS_COLUMN_WIDTH: Record<"WEEK" | "FORTNIGHT" | "MONTH", number> = {
  WEEK: 210,
  FORTNIGHT: 250,
  MONTH: 380,
};

/** Color del marcador de cada día (hex exactos: el tema redefine las paletas de Tailwind). */
const DAY_STYLE: Record<AttendanceDayStatus, string> = {
  ATTENDED: "!bg-[#0D5777] text-white",
  LATE: "!bg-[#f97316] text-white",
  ABSENCE: "border-[1.5px] border-dashed border-slate-400 !bg-white text-slate-500",
  REST: "!bg-slate-100 text-slate-400",
  PENDING: "!bg-slate-100 text-slate-400",
  NO_INFO: "!bg-slate-100 text-slate-400",
};

/** Anillo del día de hoy. */
const TODAY_RING = "ring-2 ring-[#0D5777]/30 ring-offset-1";

/** Iniciales para el avatar: primera letra de la primera y de la última palabra. */
const initialsOf = (name: string): string => {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0].charAt(0);
  return words.length === 1 ? first : first + words[words.length - 1].charAt(0);
};

/** Fecha de una clave de día (`YYYY-MM-DD`) con las opciones dadas, sin corrimiento de zona. */
const formatDay = (dayKey: string, options: Intl.DateTimeFormatOptions): string =>
  new Date(`${dayKey}T12:00:00Z`).toLocaleDateString(dateLocale(), { ...options, timeZone: "UTC" });

export default function AccessReportTab({ fx }: { fx: UseAccessReport }) {
  const { t, period, summary, view, setView } = fx;
  const tt = dyn(t);

  const days = summary?.range.days ?? [];
  const today = summary?.range.today;
  const tz = summary?.range.timezone || BROWSER_TIMEZONE;
  const multiDay = period !== "DAY";
  // Día "foco": el de hoy dentro del periodo (o el único día en la vista diaria).
  const focusIndex = !summary ? -1 : period === "DAY" ? 0 : days.indexOf(today ?? "");
  const focusIsToday = focusIndex >= 0 && days[focusIndex] === today;

  const periodOptions = useMemo(
    () => PERIODS.map((value) => ({ value, label: dyn(t)(`periodTabs.${value}`) })),
    [t]
  );

  const departmentOptions = useMemo(
    () => [
      { value: "", label: t("filters.allDepartments") },
      ...fx.departments.data.map((d) => ({ value: d.id, label: d.name })),
    ],
    [fx.departments, t]
  );

  const handleDate = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (value instanceof Date) fx.setDate(value);
  };

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) fx.setDate(value[0]);
  };

  /** Texto flotante de un día: "mié 07 oct · Asistió · 07:58–16:10 · 8:12". */
  const dayTooltip = (day: PeopleAttendanceDay): string => {
    const parts = [
      formatDay(day.date, { weekday: "short", day: "2-digit", month: "short" }).replace(/[.,]/g, ""),
      tt(`dayStatus.${day.status}`),
    ];
    if (day.entryAt) {
      parts.push(`${punchTime(day.entryAt, day.date, tz)}–${punchTime(day.exitAt, day.date, tz)}`);
    }
    if (day.workedMinutes > 0) parts.push(workedTime(day.workedMinutes));
    return parts.join(" · ");
  };

  /** Una marca por día del periodo: letra en semana, barra delgada en quincena y mes. */
  const renderDays = (r: PeopleAttendanceRow) => (
    <div className={`flex items-center ${period === "WEEK" ? "gap-1" : "gap-0.5"}`}>
      {r.days.map((day) => (
        <span
          key={day.date}
          title={dayTooltip(day)}
          className={`inline-flex shrink-0 items-center justify-center ${
            period === "WEEK" ? "h-6 w-6 rounded-md text-[10px] font-bold" : "h-5 w-2 rounded-sm"
          } ${DAY_STYLE[day.status]} ${day.date === today ? TODAY_RING : ""}`}
        >
          {period === "WEEK"
            ? formatDay(day.date, { weekday: "narrow" }).toUpperCase()
            : null}
        </span>
      ))}
    </div>
  );

  const renderPunch = (iso: string | null | undefined, day: PeopleAttendanceDay | undefined) =>
    iso && day ? (
      <ITText className="text-[12px] font-semibold tabular-nums text-slate-700">
        {punchTime(iso, day.date, tz)}
      </ITText>
    ) : (
      <ITText className="text-[12px] text-slate-300">—</ITText>
    );

  /** Estado del día foco, la primera condición que aplique. */
  const focusState = (r: PeopleAttendanceRow, d: PeopleAttendanceDay): { color: BadgeColor; text: string } => {
    if (d.incident === "ENTRY_WITHOUT_EXIT") return { color: "warning", text: t("state.withoutExit") };
    if (d.incident === "EXIT_WITHOUT_ENTRY") return { color: "danger", text: t("state.withoutEntry") };
    if (d.status === "LATE") return { color: "warning", text: t("state.late", { minutes: d.lateMinutes }) };
    if (r.onSite) return { color: "success", text: t("state.onSite") };
    switch (d.status) {
      case "ATTENDED":
        return { color: "gray", text: t("state.closed") };
      case "ABSENCE":
        return { color: "danger", text: t("state.absence") };
      case "REST":
        return { color: "gray", text: t("state.rest") };
      case "PENDING":
        return { color: "gray", text: t("state.pending") };
      default:
        return { color: "gray", text: t("state.noInfo") };
    }
  };

  /** Sin día foco (periodos pasados): un badge por cada contador con incidencias. */
  const counterStates = (r: PeopleAttendanceRow): Array<{ color: BadgeColor; text: string }> => {
    const list: Array<{ color: BadgeColor; text: string }> = [];
    if (r.absences > 0) list.push({ color: "danger", text: t("counts.absences", { count: r.absences }) });
    if (r.lateDays > 0) list.push({ color: "warning", text: t("counts.late", { count: r.lateDays }) });
    if (r.withoutExit > 0) list.push({ color: "warning", text: t("counts.withoutExit", { count: r.withoutExit }) });
    if (r.withoutEntry > 0) list.push({ color: "danger", text: t("counts.withoutEntry", { count: r.withoutEntry }) });
    if (list.length > 0) return list;
    return r.hasRecords
      ? [{ color: "success", text: t("state.noIncidents") }]
      : [{ color: "gray", text: t("state.noRecords") }];
  };

  const renderState = (r: PeopleAttendanceRow) => {
    const focusDay = focusIndex >= 0 ? r.days[focusIndex] : undefined;
    const badges = focusDay ? [focusState(r, focusDay)] : counterStates(r);
    return (
      <ITFlex wrap="wrap" gap={1}>
        {badges.map((b) => (
          <ITBadget key={b.text} color={b.color} size="sm">
            {b.text}
          </ITBadget>
        ))}
      </ITFlex>
    );
  };

  const columns: Column<PeopleAttendanceRow>[] = [
    {
      key: "employeeName",
      label: t("columns.employee"),
      type: "string",
      width: 280,
      sortable: false,
      render: (r) => {
        const subtitle = [
          r.employeeNumber ? `#${r.employeeNumber}` : null,
          r.departmentName ?? t("noDepartment"),
          r.jobTitle,
          !r.active ? t("status.inactive") : null,
          !r.linked ? t("unlinked") : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <ITFlex align="center" gap={3}>
            <ProfileAvatar
              initials={initialsOf(r.employeeName)}
              size="md"
              className="!bg-slate-100 !text-slate-600"
            />
            <div className="min-w-0">
              <ITText className="truncate text-[13px] font-bold text-slate-800">{r.employeeName}</ITText>
              <ITText className="truncate text-[11px] text-slate-500">{subtitle}</ITText>
            </div>
          </ITFlex>
        );
      },
    },
    ...(multiDay
      ? [
          {
            key: "days",
            label: dyn(t)(`dayColumn.${period}`),
            type: "string" as const,
            width: DAYS_COLUMN_WIDTH[period as "WEEK" | "FORTNIGHT" | "MONTH"],
            sortable: false,
            render: renderDays,
          },
        ]
      : []),
    ...(focusIndex >= 0
      ? [
          {
            key: "focusEntry",
            label: focusIsToday ? t("focus.entryToday") : t("focus.entry"),
            type: "string" as const,
            width: 110,
            sortable: false,
            render: (r: PeopleAttendanceRow) => renderPunch(r.days[focusIndex]?.entryAt, r.days[focusIndex]),
          },
          {
            key: "focusExit",
            label: focusIsToday ? t("focus.exitToday") : t("focus.exit"),
            type: "string" as const,
            width: 110,
            sortable: false,
            render: (r: PeopleAttendanceRow) => renderPunch(r.days[focusIndex]?.exitAt, r.days[focusIndex]),
          },
        ]
      : []),
    {
      key: "workedMinutes",
      label: t("columns.hours"),
      type: "number",
      width: 90,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] font-bold tabular-nums text-slate-700">
          {r.workedMinutes > 0 ? workedTime(r.workedMinutes) : "—"}
        </ITText>
      ),
    },
    {
      key: "state",
      label: t("columns.status"),
      type: "string",
      width: 200,
      sortable: false,
      render: renderState,
    },
  ];

  // Indicadores del periodo (sobre todas las personas del filtro, no solo la página).
  const people = summary?.people ?? 0;
  const withRecords = summary?.withRecords ?? 0;
  const withoutRecords = summary?.withoutRecords ?? 0;
  const workedMinutes = summary?.workedMinutes ?? 0;
  const recordsPercent = people > 0 ? Math.round((withRecords * 100) / people) : 0;
  const hoursValue = `${Math.floor(workedMinutes / 60).toLocaleString(dateLocale())}:${String(
    workedMinutes % 60
  ).padStart(2, "0")}`;

  const incidentParts: string[] = [];
  const lateDays = summary?.lateDays ?? 0;
  const absences = summary?.absences ?? 0;
  const withoutExit = summary?.withoutExit ?? 0;
  const withoutEntry = summary?.withoutEntry ?? 0;
  if (lateDays > 0) incidentParts.push(t("counts.late", { count: lateDays }));
  if (absences > 0) incidentParts.push(t("counts.absences", { count: absences }));
  if (withoutExit > 0) incidentParts.push(t("counts.withoutExit", { count: withoutExit }));
  if (withoutEntry > 0) incidentParts.push(t("counts.withoutEntry", { count: withoutEntry }));
  const incidentsTotal = lateDays + absences + withoutExit + withoutEntry;

  return (
    <ITFlex direction="column" gap={4}>
      {/* Filtros */}
      <ITCard className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={4}>
          <ITFlex align="end" wrap="wrap" gap={3}>
            <ITSegmentedControl
              options={periodOptions}
              value={period}
              onChange={(value) => fx.changePeriod(value as AccessReportPeriod)}
            />
            <ITFlex align="end" gap={2} className="min-w-[280px] flex-1">
              <ITButton variant="outlined" color="gray" onClick={fx.previousPeriod} title={t("filters.previous")}>
                <FaChevronLeft size={11} />
              </ITButton>
              <div className="min-w-0 flex-1">
                {period === "DAY" ? (
                  <ITDatePicker
                    name="accessReportDate"
                    label={t("filters.date")}
                    value={fx.date}
                    onChange={handleDate}
                    className="w-full min-w-0"
                  />
                ) : (
                  <ITDatePicker
                    name="accessReportDateRange"
                    label={t("filters.date")}
                    range
                    value={fx.periodRange}
                    onChange={handleRange}
                    className="w-full min-w-0"
                  />
                )}
              </div>
              <ITButton variant="outlined" color="gray" onClick={fx.nextPeriod} title={t("filters.next")}>
                <FaChevronRight size={11} />
              </ITButton>
            </ITFlex>
            <div className="min-w-[200px] flex-1">
              <ITSearchSelect
                name="accessReportDepartment"
                label={t("filters.department")}
                options={departmentOptions}
                value={fx.departmentId}
                onChange={(value) => fx.setDepartmentId(String(value))}
                className="w-full min-w-0"
              />
            </div>
            <div className="min-w-[220px] flex-1">
              <ITInput
                name="accessReportEmployee"
                label={t("filters.employee")}
                placeholder={t("filters.employeePlaceholder")}
                value={fx.search}
                onChange={(e) => fx.setSearch(e.target.value)}
                className="w-full min-w-0"
              />
            </div>
          </ITFlex>
          <ITCheckbox
            name="accessReportIncludeInactive"
            label={t("filters.includeInactive")}
            checked={fx.includeInactive}
            onChange={fx.setIncludeInactive}
          />
        </ITFlex>
      </ITCard>

      {/* Indicadores */}
      <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2 lg:!grid-cols-5">
        <KpiTile
          label={t("tiles.onSite")}
          value={summary?.onSite ?? 0}
          hint={t("tiles.onSiteHint")}
          tone="emerald"
          icon={<FaDoorOpen size={16} />}
          onClick={() => setView("ON_SITE")}
        />
        <KpiTile
          label={t("tiles.withRecords")}
          value={
            <>
              {withRecords}
              <span className="ml-1.5 !text-[12px] font-semibold text-slate-400">
                {t("tiles.ofTotal", { total: people })}
              </span>
            </>
          }
          footer={<ITProgress value={recordsPercent} size="sm" color="info" />}
          tone="sky"
          icon={<FaCheckCircle size={16} />}
        />
        <KpiTile
          label={t("tiles.withoutRecords")}
          value={withoutRecords}
          hint={withoutRecords > 0 ? t("tiles.viewWho") : t("tiles.allRecorded")}
          tone="neutral"
          icon={<FaRegCircle size={16} />}
          onClick={() => setView("WITHOUT_RECORDS")}
        />
        <KpiTile
          label={t("tiles.hours")}
          value={hoursValue}
          hint={t("tiles.hoursHint")}
          tone="neutral"
          icon={<FaClock size={16} />}
        />
        <KpiTile
          label={t("tiles.incidents")}
          value={incidentsTotal}
          hint={incidentsTotal > 0 ? incidentParts.join(" · ") : t("tiles.allClear")}
          tone={incidentsTotal > 0 ? "amber" : "neutral"}
          icon={<FaExclamationTriangle size={16} />}
          onClick={() => setView("INCIDENTS")}
        />
      </div>

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <PanelCard
        title={t("table.title", { count: fx.total })}
        actions={VIEWS.map((value) => (
          <ITChip
            key={value}
            label={tt(`views.${value}`)}
            selected={view === value}
            onClick={() => setView(value)}
            color="primary"
            variant="outlined"
            size="sm"
          />
        ))}
      >
        <ITDataTable
          key={fx.tableKey}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={
            fx.fetchTableData as unknown as (
              p: Parameters<typeof fx.fetchTableData>[0]
            ) => Promise<{ data: Record<string, unknown>[]; total: number }>
          }
          externalFilters={fx.externalFilters}
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
        />

        {multiDay && (
          <ITFlex wrap="wrap" align="center" gap={4} className="mt-4">
            <LegendSwatch style={DAY_STYLE.ATTENDED} label={tt("dayStatus.ATTENDED")} />
            <LegendSwatch style={DAY_STYLE.LATE} label={tt("dayStatus.LATE")} />
            <LegendSwatch style={DAY_STYLE.ABSENCE} label={tt("dayStatus.ABSENCE")} />
            <LegendSwatch style={DAY_STYLE.PENDING} label={t("legend.neutral")} />
          </ITFlex>
        )}
      </PanelCard>
    </ITFlex>
  );
}

/** Muestra de la simbología, con el mismo estilo que la marca de un día. */
function LegendSwatch({ style, label }: { style: string; label: string }) {
  return (
    <ITFlex align="center" gap={1.5}>
      <span className={`h-3.5 w-3.5 shrink-0 rounded-md ${style}`} />
      <ITText className="text-[11px] text-slate-500">{label}</ITText>
    </ITFlex>
  );
}
