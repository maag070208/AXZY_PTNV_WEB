import { useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCheckbox,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITInput,
  ITSegmentedControl,
  ITSelect,
  ITStatCard,
  ITTable,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  FaCheckCircle,
  FaClock,
  FaDoorOpen,
  FaExclamationTriangle,
  FaEye,
  FaFilePdf,
  FaRegCircle,
} from "react-icons/fa";
import {
  type AccessIncidentCode,
  type AccessReportDay,
  type AccessReportPersonRow,
} from "@entities/access";
import type { UseAccessReport } from "../model/useAccessReport";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const INCIDENT_COLOR: Record<AccessIncidentCode, BadgeColor> = {
  OPEN_ENTRY: "info",
  ENTRY_WITHOUT_EXIT: "warning",
  EXIT_WITHOUT_ENTRY: "danger",
};

/** `workedMinutes` → `hh:mm` (legible para RH, no minutos crudos). */
const formatMinutes = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Día local `YYYY-MM-DD` sin conversión de zona (es una clave, no un instante). */
const formatDayKey = (dayKey: string): string => {
  const [y, m, d] = dayKey.split("-");
  return d && m && y ? `${d}/${m}/${y}` : dayKey;
};

const timeOf = (iso: string): string => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
};

/** En DÍA, la hora; en SEMANA/MES, fecha + hora del extremo. */
const formatStamp = (iso: string | null, period: string): string => {
  if (!iso) return "—";
  if (period === "DAY") return timeOf(iso);
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm} ${timeOf(iso)}`;
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
  } = fx;

  const [detail, setDetail] = useState<AccessReportPersonRow | null>(null);

  const periodOptions = useMemo(
    () => [
      { value: "DAY", label: t("periods.DAY") },
      { value: "WEEK", label: t("periods.WEEK") },
      { value: "MONTH", label: t("periods.MONTH") },
    ],
    [t]
  );

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

  const statusOf = (row: AccessReportPersonRow): { color: BadgeColor; label: string } => {
    if (!row.hasRecords) return { color: "gray", label: t("status.noRecords") };
    if (row.incidents.includes("OPEN_ENTRY")) return { color: "info", label: t("status.inside") };
    return { color: "success", label: t("status.hasRecords") };
  };

  const renderIncidents = (incidents: AccessIncidentCode[]) =>
    incidents.length === 0 ? (
      <ITText className="text-[11px] text-slate-400">—</ITText>
    ) : (
      <ITFlex wrap="wrap" gap={1}>
        {incidents.map((code) => (
          <ITBadget key={code} color={INCIDENT_COLOR[code]} size="sm">
            {t(`incidents.${code}`)}
          </ITBadget>
        ))}
      </ITFlex>
    );

  const columns: Column<AccessReportPersonRow>[] = [
    {
      key: "employeeName",
      label: t("columns.employee"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.employeeName}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {r.numeroEmpleado ? `#${r.numeroEmpleado}` : "—"}
            {!r.active && ` · ${t("status.inactive")}`}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "departmentName",
      label: t("columns.department"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {r.departmentName ?? t("noDepartment")}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("columns.status"),
      type: "string",
      sortable: false,
      render: (r) => {
        const { color, label } = statusOf(r);
        return (
          <ITBadget color={color} size="lg">
            {label}
          </ITBadget>
        );
      },
    },
    {
      key: "firstEntryAt",
      label: t("columns.entry"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatStamp(r.firstEntryAt, period)}
        </ITText>
      ),
    },
    {
      key: "lastExitAt",
      label: t("columns.exit"),
      type: "string",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatStamp(r.lastExitAt, period)}
        </ITText>
      ),
    },
    {
      key: "workedMinutes",
      label: t("columns.hours"),
      type: "number",
      sortable: true,
      render: (r) => (
        <ITText className="text-[12px] font-black text-emerald-700">{formatMinutes(r.workedMinutes)}</ITText>
      ),
    },
    {
      key: "sessionCount",
      label: t("columns.sessions"),
      type: "number",
      sortable: true,
      render: (r) => <ITText className="text-[11px] font-bold text-slate-600">{r.sessionCount}</ITText>,
    },
    {
      key: "daysWithRecords",
      label: t("columns.days"),
      type: "number",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.daysWithRecords}</ITText>
      ),
    },
    {
      key: "incidents",
      label: t("columns.incidents"),
      type: "string",
      sortable: false,
      render: (r) => renderIncidents(r.incidents),
    },
    {
      key: "actions",
      label: t("columns.actions"),
      type: "actions",
      actions: (r) => (
        <ITButton
          variant="outlined"
          size="lg"
          color="secondary"
          title={t("actions.viewDetail")}
          onClick={() => setDetail(r)}
        >
          <FaEye size={12} />
        </ITButton>
      ),
    },
  ];

  const dayColumns: Column<AccessReportDay>[] = [
    {
      key: "date",
      label: t("detail.date"),
      type: "string",
      render: (d) => <ITText className="text-[11px] font-bold text-slate-700">{formatDayKey(d.date)}</ITText>,
    },
    {
      key: "entryAt",
      label: t("detail.entry"),
      type: "string",
      render: (d) => (
        <ITText className="text-[11px] text-slate-600">{d.entryAt ? timeOf(d.entryAt) : "—"}</ITText>
      ),
    },
    {
      key: "exitAt",
      label: t("detail.exit"),
      type: "string",
      render: (d) => (
        <ITText className="text-[11px] text-slate-600">{d.exitAt ? timeOf(d.exitAt) : "—"}</ITText>
      ),
    },
    {
      key: "workedMinutes",
      label: t("detail.hours"),
      type: "number",
      render: (d) => (
        <ITText className="text-[11px] font-bold text-emerald-700">{formatMinutes(d.workedMinutes)}</ITText>
      ),
    },
    {
      key: "sessions",
      label: t("detail.sessions"),
      type: "number",
      render: (d) => <ITText className="text-[11px] text-slate-600">{d.sessions}</ITText>,
    },
    {
      key: "incidents",
      label: t("detail.incidents"),
      type: "string",
      render: (d) => renderIncidents(d.incidents),
    },
    {
      key: "crossesMidnight",
      label: t("detail.crossesMidnight"),
      type: "string",
      render: (d) =>
        d.crossesMidnight ? (
          <ITBadget color="warning" size="sm">
            {t("detail.crossesMidnightBadge")}
          </ITBadget>
        ) : (
          <ITText className="text-[11px] text-slate-400">—</ITText>
        ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex wrap="wrap" align="end" gap={3}>
        <ITSegmentedControl
          options={periodOptions}
          value={period}
          onChange={(value) => setPeriod(value as typeof period)}
        />
        <ITDatePicker
          name="accessReportDate"
          label={t("filters.date")}
          value={date ?? undefined}
          onChange={handleDate}
          className="min-w-[200px]"
        />
        <ITSelect
          name="accessReportDepartment"
          label={t("filters.department")}
          options={departmentOptions}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="min-w-[220px]"
        />
        <ITInput
          name="accessReportEmployee"
          label={t("filters.employee")}
          placeholder={t("filters.employeePlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[220px]"
        />
        <ITCheckbox
          name="accessReportIncludeInactive"
          label={t("filters.includeInactive")}
          checked={includeInactive}
          onChange={setIncludeInactive}
          className="pb-2"
        />
      </ITFlex>

      <ITFlex wrap="wrap" gap={3}>
        <ITStatCard
          label={t("kpis.withRecords")}
          value={summary?.peopleWithRecords ?? 0}
          icon={<FaCheckCircle className="text-emerald-600" size={13} />}
        />
        <ITStatCard
          label={t("kpis.withoutRecords")}
          value={summary?.peopleWithoutRecords ?? 0}
          icon={<FaRegCircle className="text-slate-400" size={13} />}
        />
        <ITStatCard
          label={t("kpis.inside")}
          value={summary?.peopleInside ?? 0}
          icon={<FaDoorOpen className="text-sky-600" size={13} />}
        />
        <ITStatCard
          label={t("kpis.workedHours")}
          value={formatMinutes(summary?.totalWorkedMinutes ?? 0)}
          icon={<FaClock className="text-slate-500" size={13} />}
        />
        <ITStatCard
          label={t("kpis.incidents")}
          value={summary?.totalIncidents ?? 0}
          icon={<FaExclamationTriangle className="text-amber-600" size={13} />}
        />
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITFlex justify="end" align="center" wrap="wrap" gap={2}>
        <ITButton variant="outlined" color="gray" onClick={handleDownloadPdf} disabled={exporting}>
          <ITFlex align="center" gap={1}>
            <FaFilePdf className="text-red-600" size={13} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("actions.exporting") : t("actions.export")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
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

      <ITDialog
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={t("detail.title")}
        className="max-w-4xl"
      >
        {detail && (
          <ITFlex direction="column" gap={3} className="mt-2">
            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("columns.employee")}
              </ITText>
              <ITText className="text-[13px] font-black text-slate-800">
                {detail.employeeName}
                {detail.numeroEmpleado ? ` · #${detail.numeroEmpleado}` : ""}
              </ITText>
            </ITFlex>
            {detail.days.length === 0 ? (
              <ITText className="text-[12px] text-slate-500">{t("detail.noDays")}</ITText>
            ) : (
              <ITTable
                columns={dayColumns as unknown as Column<Record<string, unknown>>[]}
                data={detail.days as unknown as Record<string, unknown>[]}
                size="sm"
                defaultItemsPerPage={10}
                itemsPerPageOptions={[10, 20, 50]}
              />
            )}
          </ITFlex>
        )}
      </ITDialog>
    </ITFlex>
  );
}
