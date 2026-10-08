import { useMemo } from "react";
import {
  ITAccordion,
  ITAlert,
  ITBadget,
  ITButton,
  ITCheckbox,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaDoorOpen,
  FaExclamationTriangle,
  FaFileCsv,
  FaFilePdf,
  FaInfoCircle,
  FaRegCircle,
  FaUndo,
  FaUserSlash,
} from "react-icons/fa";
import {
  type AccessReportPeriod,
  type AttendanceDayStatus,
  type PeopleAttendanceDay,
  type PeopleAttendanceRow,
  type PeopleAttendanceView,
} from "@entities/access";
import { KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { formatMinutesAsHhMm, formatTimeInTZ } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
import { dateLocale } from "@shared/i18n";
import type { UseAccessReport } from "../model/useAccessReport";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

/** Estado del día contra el horario → color de la etiqueta. */
const DAY_STATUS_COLOR: Record<AttendanceDayStatus, BadgeColor> = {
  ATTENDED: "success",
  LATE: "warning",
  ABSENCE: "danger",
  REST: "gray",
  PENDING: "gray",
  NO_INFO: "gray",
};

/** Estados que ocupan una celda con etiqueta (sin horario que mostrar). */
const DAY_STATUS_ORDER: AttendanceDayStatus[] = [
  "ATTENDED",
  "LATE",
  "ABSENCE",
  "REST",
  "PENDING",
  "NO_INFO",
];

/** Día local `YYYY-MM-DD` sin conversión de zona (es una clave, no un instante). */
const toDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** `YYYY-MM-DD` → `dd/mm/yyyy` (clave de día, sin corrimiento de zona). */
const formatDayKey = (dayKey: string): string => {
  const [y, m, d] = dayKey.split("-");
  return d && m && y ? `${d}/${m}/${y}` : dayKey;
};

export default function AccessReportTab({ fx }: { fx: UseAccessReport }) {
  const {
    t,
    period,
    changePeriod,
    date,
    setDate,
    periodRange,
    previousPeriod,
    nextPeriod,
    departmentId,
    setDepartmentId,
    departments,
    search,
    setSearch,
    includeInactive,
    setIncludeInactive,
    view,
    setView,
    summary,
    total,
    exporting,
    error,
    setError,
    externalFilters,
    tableKey,
    fetchTableData,
    handleDownloadPdf,
    handleDownloadCsv,
  } = fx;

  /** Zona horaria resuelta por el servidor en `summary.range`; local antes del 1er fetch. */
  const tz = summary?.range.timezone;

  const timeOf = (iso: string): string => formatTimeInTZ(iso, tz);

  /** Días del periodo: los del servidor; antes del primer fetch, los del rango local. */
  const localDays = useMemo(() => {
    const [start, end] = periodRange;
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const days: string[] = [];
    while (day <= last) {
      days.push(toDayKey(day));
      day.setDate(day.getDate() + 1);
    }
    return days;
  }, [periodRange]);

  const rangeDays = summary?.range.days?.length ? summary.range.days : localDays;

  /** Encabezado de la columna de un día: "Mié 23" o la fecha completa en DÍA. */
  const dayTitle = (dayKey: string): string => {
    if (period === "DAY") return formatDayKey(dayKey);
    const label = new Date(`${dayKey}T12:00:00Z`).toLocaleDateString(dateLocale(), {
      weekday: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  /** Rango [inicio, fin] del periodo que contiene `date`, para la barra superior. */
  const rangeLabel = useMemo(() => {
    const format = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString(dateLocale(), opts);
    if (period === "WEEK" || period === "FORTNIGHT") {
      const [s, en] = periodRange;
      return `${dyn(t)(`periods.${period}`)} · ${format(s, { day: "2-digit", month: "short" })} — ${format(en, { day: "2-digit", month: "short" })}`;
    }
    if (period === "MONTH") {
      return format(date, { month: "long", year: "numeric" });
    }
    return format(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [period, date, periodRange, t]);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: t("filters.allDepartments") },
      ...departments.data.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments, t]
  );

  const periodOptions = useMemo(
    () => [
      { value: "DAY", label: t("periods.DAY") },
      { value: "WEEK", label: t("periods.WEEK") },
      { value: "FORTNIGHT", label: t("periods.FORTNIGHT") },
      { value: "MONTH", label: t("periods.MONTH") },
    ],
    [t]
  );

  const viewOptions = useMemo(
    () =>
      (["ALL", "INCIDENTS", "ON_SITE", "WITHOUT_RECORDS"] as PeopleAttendanceView[]).map((value) => ({
        value,
        label: t(`views.${value}`),
      })),
    [t]
  );

  const handleDate = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (value instanceof Date) setDate(value);
  };

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) setDate(value[0]);
  };

  const clearFilters = () => {
    changePeriod("WEEK");
    setDate(new Date());
    setDepartmentId("");
    setSearch("");
    setIncludeInactive(false);
    setView("ALL");
  };

  /** Celda de un día: horario entrada–salida, retardo, en sitio o la etiqueta del estado. */
  const renderDay = (day: PeopleAttendanceDay | undefined) => {
    if (!day || day.status === "PENDING") {
      return <ITText className="text-[11px] text-slate-300">—</ITText>;
    }
    if (day.status === "REST" || day.status === "NO_INFO" || day.status === "ABSENCE") {
      return (
        <ITBadget color={DAY_STATUS_COLOR[day.status]} size="sm">
          {t(`dayStatusShort.${day.status}`)}
        </ITBadget>
      );
    }
    return (
      <ITFlex direction="column" gap={0}>
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {day.entryAt ? timeOf(day.entryAt) : "?"} - {day.onSite || !day.exitAt ? "?" : timeOf(day.exitAt)}
        </ITText>
        {day.onSite ? (
          <ITText className="text-[9px] font-black uppercase tracking-wide text-sky-600">
            {t("incidents.OPEN_ENTRY")}
          </ITText>
        ) : day.lateMinutes > 0 ? (
          <ITText className="text-[9px] font-black uppercase tracking-wide text-amber-600">
            +{day.lateMinutes} min
          </ITText>
        ) : day.incident ? (
          <ITText className="text-[9px] font-black uppercase tracking-wide text-amber-600">
            {t(`incidents.${day.incident}`)}
          </ITText>
        ) : null}
      </ITFlex>
    );
  };

  const columns: Column<PeopleAttendanceRow>[] = [
    {
      key: "employeeName",
      label: t("columns.employee"),
      type: "string",
      width: 220,
      sortable: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.employeeName}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {r.employeeNumber ? `#${r.employeeNumber}` : "—"}
            {!r.active && ` · ${t("status.inactive")}`}
            {!r.linked && ` · ${t("unlinked")}`}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "departmentName",
      label: t("columns.department"),
      type: "string",
      width: 160,
      sortable: false,
      render: (r) =>
        r.departmentName ? (
          <ITText className="text-[11px] font-bold text-slate-600">{r.departmentName}</ITText>
        ) : (
          <ITBadget color="gray" size="sm">
            {t("noDepartment")}
          </ITBadget>
        ),
    },
    {
      key: "jobTitle",
      label: t("columns.jobTitle"),
      type: "string",
      width: 150,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700">{r.jobTitle ?? "—"}</ITText>
      ),
    },
    // Una columna por día del periodo: el día calificado contra su horario.
    ...rangeDays.map((dayKey, i) => ({
      key: `day:${dayKey}`,
      label: dayTitle(dayKey),
      type: "string" as const,
      width: 100,
      sortable: false,
      render: (r: PeopleAttendanceRow) => renderDay(r.days[i]),
    })),
    {
      key: "workedMinutes",
      label: t("columns.hours"),
      type: "number",
      width: 90,
      sortable: true,
      align: "right" as const,
      render: (r) => (
        <ITText className="text-[12px] font-black text-emerald-700">
          {r.workedMinutes > 0 ? formatMinutesAsHhMm(r.workedMinutes) : "—"}
        </ITText>
      ),
    },
    {
      key: "lateDays",
      label: t("columns.lateDays"),
      type: "number",
      width: 90,
      sortable: false,
      align: "right" as const,
      render: (r) =>
        r.lateDays > 0 ? (
          <ITText className="text-[12px] font-black text-amber-600">{r.lateDays}</ITText>
        ) : (
          <ITText className="text-[12px] font-bold text-slate-300">0</ITText>
        ),
    },
    {
      key: "absences",
      label: t("columns.absences"),
      type: "number",
      width: 80,
      sortable: false,
      align: "right" as const,
      render: (r) =>
        r.absences > 0 ? (
          <ITText className="text-[12px] font-black text-rose-600">{r.absences}</ITText>
        ) : (
          <ITText className="text-[12px] font-bold text-slate-300">0</ITText>
        ),
    },
    {
      key: "incidents",
      label: t("columns.incidents"),
      type: "string",
      width: 170,
      sortable: false,
      render: (r) =>
        r.withoutExit + r.withoutEntry > 0 ? (
          <ITFlex direction="column" gap={0.5}>
            {r.withoutExit > 0 && (
              <ITBadget color="warning" size="sm">
                {t("incidents.ENTRY_WITHOUT_EXIT")}: {r.withoutExit}
              </ITBadget>
            )}
            {r.withoutEntry > 0 && (
              <ITBadget color="danger" size="sm">
                {t("incidents.EXIT_WITHOUT_ENTRY")}: {r.withoutEntry}
              </ITBadget>
            )}
          </ITFlex>
        ) : (
          <ITText className="text-[11px] text-slate-400">—</ITText>
        ),
    },
  ];

  const kpis: Array<{ key: string; value: number | string; tone: KpiTone; icon: React.ReactNode }> = [
    { key: "withRecords", value: summary?.withRecords ?? 0, tone: "emerald", icon: <FaCheckCircle size={16} /> },
    { key: "withoutRecords", value: summary?.withoutRecords ?? 0, tone: "neutral", icon: <FaRegCircle size={16} /> },
    { key: "inside", value: summary?.onSite ?? 0, tone: "sky", icon: <FaDoorOpen size={16} /> },
    { key: "workedHours", value: formatMinutesAsHhMm(summary?.workedMinutes ?? 0), tone: "neutral", icon: <FaClock size={16} /> },
    { key: "lateDays", value: summary?.lateDays ?? 0, tone: "amber", icon: <FaExclamationTriangle size={16} /> },
    { key: "absences", value: summary?.absences ?? 0, tone: "rose", icon: <FaUserSlash size={16} /> },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {/* Rango + exportar */}
      <ITFlex
        align="center"
        wrap="wrap"
        gap={3}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <ITFlex
          align="center"
          justify="center"
          className="h-10 w-10 shrink-0 rounded-xl bg-[#0D5777]/10 text-[#0D5777]"
        >
          <FaCalendarAlt size={15} />
        </ITFlex>
        <ITFlex direction="column" gap={0} className="min-w-0">
          <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {dyn(t)(`periods.${period}`)}
          </ITText>
          <ITText className="truncate text-base font-black text-slate-800">{rangeLabel}</ITText>
          <ITText className="text-[10px] font-bold text-slate-400">
            {t("peopleCount", { count: total })}
            {tz ? ` · ${tz}` : ""}
          </ITText>
        </ITFlex>
        <ITFlex gap={2} wrap="wrap" className="ml-auto">
          <ITButton variant="outlined" color="gray" onClick={handleDownloadPdf} disabled={exporting}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{t("actions.exportPdf")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={handleDownloadCsv} disabled={exporting}>
            <ITFlex align="center" gap={1}>
              <FaFileCsv size={13} />
              <ITText className="font-bold text-[11px]">{t("actions.exportCsv")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      {/* KPIs */}
      <ITFlex wrap="wrap" gap={3}>
        {kpis.map((k) => (
          <div key={k.key} className="min-w-[170px] flex-1">
            <KpiTile
              label={dyn(t)(`kpis.${k.key}`)}
              value={k.value}
              tone={k.tone}
              icon={k.icon}
            />
          </div>
        ))}
      </ITFlex>

      {/* Filtros */}
      <PanelCard
        title={t("toolbar.title")}
        actions={
          <ITButton variant="text" color="gray" size="sm" onClick={clearFilters}>
            <ITFlex align="center" gap={1}>
              <FaUndo size={11} />
              <ITText className="font-bold text-[11px]">{t("filters.clear")}</ITText>
            </ITFlex>
          </ITButton>
        }
      >
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={6} lg={3}>
            <ITSearchSelect
              name="accessReportPeriod"
              label={t("filters.period")}
              options={periodOptions}
              value={period}
              onChange={(value) => changePeriod(String(value) as AccessReportPeriod)}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={6} lg={3}>
            <ITSearchSelect
              name="accessReportView"
              label={t("filters.view")}
              options={viewOptions}
              value={view}
              onChange={(value) => setView(String(value) as PeopleAttendanceView)}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={6} lg={3}>
            <ITSearchSelect
              name="accessReportDepartment"
              label={t("filters.department")}
              options={departmentOptions}
              value={departmentId}
              onChange={(value) => setDepartmentId(String(value))}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={6} lg={3}>
            <ITInput
              name="accessReportEmployee"
              label={t("filters.employee")}
              placeholder={t("filters.employeePlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={6} lg={4}>
            <ITFlex align="end" gap={2} className="h-full">
              <ITButton
                variant="outlined"
                color="gray"
                onClick={previousPeriod}
                title={t("filters.previous")}
              >
                <FaChevronLeft size={11} />
              </ITButton>
              <div className="min-w-0 flex-1">
                {period === "DAY" ? (
                  <ITDatePicker
                    name="accessReportDate"
                    label={t("filters.date")}
                    value={date}
                    onChange={handleDate}
                    className="w-full min-w-0"
                  />
                ) : (
                  <ITDatePicker
                    name="accessReportDateRange"
                    label={t("filters.date")}
                    range
                    value={periodRange}
                    onChange={handleRange}
                    className="w-full min-w-0"
                  />
                )}
              </div>
              <ITButton variant="outlined" color="gray" onClick={nextPeriod} title={t("filters.next")}>
                <FaChevronRight size={11} />
              </ITButton>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={12} md={6} lg={4}>
            <ITFlex align="end" className="h-full pb-2">
              <ITCheckbox
                name="accessReportIncludeInactive"
                label={t("filters.includeInactive")}
                checked={includeInactive}
                onChange={setIncludeInactive}
              />
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </PanelCard>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITAccordion
        variant="bordered"
        items={[
          {
            id: "help",
            title: t("help.title"),
            icon: <FaInfoCircle size={12} />,
            content: (
              <ITFlex direction="column" gap={3}>
                <ITText className="text-[11px] text-slate-600">{t("help.intro")}</ITText>
                <ITFlex wrap="wrap" align="center" gap={2}>
                  {DAY_STATUS_ORDER.map((status) => (
                    <ITBadget key={status} color={DAY_STATUS_COLOR[status]} size="sm">
                      {t(`dayStatus.${status}`)}
                    </ITBadget>
                  ))}
                </ITFlex>
                <ITGrid container columns={12} spacing={4}>
                  <ITGrid item xs={12} md={6}>
                    <ITFlex direction="column" gap={2}>
                      <HelpLine term={t("columns.entry")} desc={t("help.entry")} />
                      <HelpLine term={t("columns.exit")} desc={t("help.exit")} />
                      <HelpLine term={t("columns.hours")} desc={t("help.hours")} />
                      <HelpLine term={t("columns.lateDays")} desc={t("help.lateDays")} />
                    </ITFlex>
                  </ITGrid>
                  <ITGrid item xs={12} md={6}>
                    <ITFlex direction="column" gap={2}>
                      <HelpLine term={t("columns.absences")} desc={t("help.absences")} />
                      <HelpLine term={t("columns.incidents")} desc={t("help.incidents")} />
                      <HelpLine term={t("columns.department")} desc={t("help.schedule")} />
                      <HelpLine term={t("filters.view")} desc={t("help.views")} />
                    </ITFlex>
                  </ITGrid>
                </ITGrid>
              </ITFlex>
            ),
          },
        ]}
      />

      <ITDataTable
        key={tableKey}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: Parameters<typeof fetchTableData>[0]
          ) => Promise<{ data: Record<string, unknown>[]; total: number }>
        }
        externalFilters={externalFilters}
        defaultItemsPerPage={50}
        itemsPerPageOptions={[10, 25, 50, 100]}
        debounceMs={350}
        layout="fixed"
        density="compact"
        virtualized
        virtualizedMaxHeight={480}
        rowHeight={52}
      />
    </ITFlex>
  );
}

function HelpLine({ term, desc }: { term: string; desc: string }) {
  return (
    <ITFlex direction="column" gap={0.5}>
      <ITText className="text-[11px] font-black text-slate-700">{term}</ITText>
      <ITText className="text-[11px] text-slate-500">{desc}</ITText>
    </ITFlex>
  );
}
