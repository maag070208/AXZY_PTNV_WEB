import { useMemo } from "react";
import {
  ITAccordion,
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDoorOpen,
  FaExclamationTriangle,
  FaFileCsv,
  FaFilePdf,
  FaInfoCircle,
  FaRegCircle,
  FaUndo,
} from "react-icons/fa";
import {
  type AccessIncidentCode,
  type AccessReportPeriod,
  type AccessReportSessionRow,
} from "@entities/access";
import { formatMinutesAsHhMm, formatTimeInTZ } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
import type { UseAccessReport } from "../model/useAccessReport";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const INCIDENT_COLOR: Record<AccessIncidentCode, BadgeColor> = {
  OPEN_ENTRY: "info",
  ENTRY_WITHOUT_EXIT: "warning",
  EXIT_WITHOUT_ENTRY: "danger",
};

/** Día local `YYYY-MM-DD` sin conversión de zona (es una clave, no un instante). */
const formatDayKey = (dayKey: string): string => {
  const [y, m, d] = dayKey.split("-");
  return d && m && y ? `${d}/${m}/${y}` : dayKey;
};

export default function AccessReportTab({ fx }: { fx: UseAccessReport }) {
  const {
    t,
    period,
    setPeriod,
    date,
    setDate,
    departmentId,
    setDepartmentId,
    q,
    setQ,
    includeInactive,
    setIncludeInactive,
    summary,
    exporting,
    error,
    setError,
    departments,
    externalFilters,
    fetchTableData,
    handleDownloadPdf,
    handleDownloadCsv,
  } = fx;

  /**
   * Firma de los filtros externos. Se pasa como `key` de ITDataTable: al cambiar
   * periodo/fecha/departamento/búsqueda/estado, la tabla se remonta y `currentPage`
   * vuelve a 1 (el estado interno de useTableState no expone reset por prop, y
   * `reloadTrigger` solo dispara refetch conservando la página).
   */
  const tableKey = useMemo(() => JSON.stringify(externalFilters), [externalFilters]);

  /** Zona horaria resuelta por el servidor en `summary.range`; local antes del 1er fetch. */
  const tz = summary?.range.timezone;

  const timeOf = (iso: string): string => formatTimeInTZ(iso, tz);

  /** En DÍA, la hora; en SEMANA/MES, fecha + hora. */
  const formatStamp = (iso: string | null): string => {
    if (!iso) return "—";
    if (period === "DAY") return timeOf(iso);
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm} ${timeOf(iso)}`;
  };

  const departmentOptions = useMemo(
    () => [
      { value: "", label: t("filters.allDepartments") },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments, t]
  );

  const handleDate = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (value instanceof Date) setDate(value);
  };

  const renderIncident = (incident: AccessIncidentCode | null) =>
    incident ? (
      <ITBadget color={INCIDENT_COLOR[incident]} size="sm">
        {t(`incidents.${incident}`)}
      </ITBadget>
    ) : (
      <ITText className="text-[11px] text-slate-400">—</ITText>
    );

  const columns: Column<AccessReportSessionRow>[] = [
    {
      key: "employeeName",
      label: t("columns.employee"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.employeeName}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {r.employeeNumber ? `#${r.employeeNumber}` : "—"}
            {!r.active && ` · ${t("status.inactive")}`}
            {r.linked === false && ` · ${t("unlinked")}`}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "departmentName",
      label: t("columns.department"),
      type: "string",
      sortable: true,
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
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700">{r.jobTitle ?? "—"}</ITText>
      ),
    },
    {
      key: "date",
      label: t("columns.date"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatDayKey(r.date)}
        </ITText>
      ),
    },
    {
      key: "entryAt",
      label: t("columns.entry"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
          {formatStamp(r.entryAt)}
        </ITText>
      ),
    },
    {
      key: "exitAt",
      label: t("columns.exit"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatStamp(r.exitAt)}
        </ITText>
      ),
    },
    {
      key: "workedMinutes",
      label: t("columns.hours"),
      type: "number",
      sortable: true,
      render: (r) => (
        <ITText className="text-[12px] font-black text-emerald-700">
          {r.entryAt && r.exitAt ? formatMinutesAsHhMm(r.workedMinutes) : "—"}
        </ITText>
      ),
    },
    {
      key: "incident",
      label: t("columns.incident"),
      type: "string",
      sortable: false,
      render: (r) => renderIncident(r.incident),
    },
  ];

  const handlePeriodChange = (value: AccessReportPeriod) => {
    setPeriod(value);
    // Al cambiar el periodo, la fecha se recoloca al día de hoy (ventana actual).
    setDate(new Date());
  };

  const clearFilters = () => {
    setPeriod("DAY");
    setDate(new Date());
    setDepartmentId("");
    setQ("");
    setIncludeInactive(false);
  };

  /** Rango [inicio, fin] de la semana (lunes–domingo) o del mes que contiene `date`. */
  const periodRange = useMemo<[Date, Date]>(() => {
    const d = date ?? new Date();
    if (period === "WEEK") {
      const offset = (d.getDay() + 6) % 7; // 0 = lunes
      const start = new Date(d);
      start.setDate(d.getDate() - offset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return [start, end];
    }
    if (period === "MONTH") {
      return [
        new Date(d.getFullYear(), d.getMonth(), 1),
        new Date(d.getFullYear(), d.getMonth() + 1, 0),
      ];
    }
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    return [start, start];
  }, [period, date]);

  const handleRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0]) setDate(value[0]);
  };

  /** Título del rango mostrado en la barra superior. */
  const rangeLabel = useMemo(() => {
    if (period === "WEEK") {
      const [s, en] = periodRange;
      return `${t("periods.WEEK")} · ${s.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} — ${en.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`;
    }
    if (period === "MONTH") {
      return (date ?? new Date()).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      });
    }
    return (date ?? new Date()).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [period, date, periodRange, t]);

  const periodOptions = useMemo(
    () => [
      { value: "DAY", label: t("periods.DAY") },
      { value: "WEEK", label: t("periods.WEEK") },
      { value: "MONTH", label: t("periods.MONTH") },
    ],
    [t]
  );

  const kpis = [
    { key: "withRecords", value: summary?.peopleWithRecords ?? 0, tint: "bg-emerald-50", icon: <FaCheckCircle className="text-emerald-600" size={15} /> },
    { key: "withoutRecords", value: summary?.peopleWithoutRecords ?? 0, tint: "bg-slate-100", icon: <FaRegCircle className="text-slate-400" size={15} /> },
    { key: "inside", value: summary?.peopleInside ?? 0, tint: "bg-sky-50", icon: <FaDoorOpen className="text-sky-600" size={15} /> },
    { key: "workedHours", value: formatMinutesAsHhMm(summary?.totalWorkedMinutes ?? 0), tint: "bg-slate-100", icon: <FaClock className="text-slate-500" size={15} /> },
    { key: "incidents", value: summary?.totalIncidents ?? 0, tint: "bg-amber-50", icon: <FaExclamationTriangle className="text-amber-600" size={15} /> },
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
          <ITFlex
            key={k.key}
            grow={1}
            basis="180px"
            align="center"
            gap={3}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <ITFlex
              align="center"
              justify="center"
              className={`h-10 w-10 shrink-0 rounded-xl ${k.tint}`}
            >
              {k.icon}
            </ITFlex>
            <ITFlex direction="column" gap={0} className="min-w-0">
              <ITText className="text-xl font-black leading-none text-slate-800">{k.value}</ITText>
              <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {dyn(t)(`kpis.${k.key}`)}
              </ITText>
            </ITFlex>
          </ITFlex>
        ))}
      </ITFlex>

      {/* Filtros */}
      <ITCard title={t("toolbar.title")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITSegmentedControl
              options={periodOptions}
              value={period}
              onChange={(value) => handlePeriodChange(value as AccessReportPeriod)}
            />
            <ITButton variant="text" color="gray" size="sm" onClick={clearFilters} className="ml-auto">
              <ITFlex align="center" gap={1}>
                <FaUndo size={11} />
                <ITText className="font-bold text-[11px]">{t("filters.clear")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              {period === "DAY" ? (
                <ITDatePicker
                  name="accessReportDate"
                  label={t("filters.date")}
                  value={date ?? undefined}
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
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSearchSelect
                name="accessReportDepartment"
                label={t("filters.department")}
                options={departmentOptions}
                value={departmentId}
                onChange={(value) => setDepartmentId(String(value))}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="accessReportEmployee"
                label={t("filters.employee")}
                placeholder={t("filters.employeePlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
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
        </ITFlex>
      </ITCard>

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
                <ITGrid container columns={12} spacing={4}>
                  <ITGrid item xs={12} md={6}>
                    <ITFlex direction="column" gap={2}>
                      <HelpLine term={t("columns.entry")} desc={t("help.entry")} />
                      <HelpLine term={t("columns.exit")} desc={t("help.exit")} />
                      <HelpLine term={t("columns.hours")} desc={t("help.hours")} />
                      <HelpLine term={t("columns.incident")} desc={t("help.incidents")} />
                    </ITFlex>
                  </ITGrid>
                  <ITGrid item xs={12} md={6}>
                    <ITFlex direction="column" gap={2}>
                      <StatusHelp color="info" label={t("incidents.OPEN_ENTRY")} desc={t("help.incidents")} />
                      <StatusHelp color="warning" label={t("incidents.ENTRY_WITHOUT_EXIT")} desc={t("help.incidents")} />
                      <StatusHelp color="danger" label={t("incidents.EXIT_WITHOUT_ENTRY")} desc={t("help.incidents")} />
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
        defaultItemsPerPage={10}
        itemsPerPageOptions={[10, 25, 50]}
        debounceMs={350}
        size="lg"
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

function StatusHelp({
  color,
  label,
  desc,
}: {
  color: BadgeColor;
  label: string;
  desc: string;
}) {
  return (
    <ITFlex align="center" gap={2}>
      <ITBadget color={color} size="sm">
        {label}
      </ITBadget>
      <ITText className="text-[11px] text-slate-500">{desc}</ITText>
    </ITFlex>
  );
}
