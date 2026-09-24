import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import type { Column, ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  FaClock,
  FaExclamationTriangle,
  FaFileCsv,
  FaRegClock,
  FaUndo,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { departmentsApi, type Department } from "@entities/department";
import { scheduleApi, type HorasExtraRow, type HorasExtraSummary } from "@entities/schedule";
import { formatMinutesAsHhMm } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";

type Period = "DAY" | "WEEK" | "MONTH";

const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function OvertimeReport() {
  const { t } = useTranslation("schedules");
  const [period, setPeriod] = useState<Period>("WEEK");
  const [date, setDate] = useState<Date>(new Date());
  const [departmentId, setDepartmentId] = useState("");
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<HorasExtraSummary | null>(null);
  const [rows, setRows] = useState<HorasExtraRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const filters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {
      period,
      date: toDateInput(date),
      includeInactive,
    };
    if (departmentId) f.departmentId = departmentId;
    if (q.trim()) f.q = q.trim();
    return f;
  }, [period, date, departmentId, q, includeInactive]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await scheduleApi.horasExtraExport({ page: 1, limit: 100, filters });
      setRows(res.data);
      setSummary(res.summary);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  /** El periodo manda: Día = fecha única; Semana/Mes = rango (y recoloca la fecha). */
  const handlePeriodChange = (value: Period) => {
    setPeriod(value);
    setDate(new Date());
  };

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

  const clearFilters = () => {
    setPeriod("WEEK");
    setDate(new Date());
    setDepartmentId("");
    setQ("");
    setIncludeInactive(false);
  };

  const departmentOptions = useMemo(
    () => [
      { value: "", label: t("overtime.allDepartments") },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments, t]
  );

  const periodOptions = useMemo(
    () => [
      { value: "DAY", label: t("overtime.periods.DAY") },
      { value: "WEEK", label: t("overtime.periods.WEEK") },
      { value: "MONTH", label: t("overtime.periods.MONTH") },
    ],
    [t]
  );

  const kpis = [
    { key: "withExtra", value: summary?.peopleWithExtra ?? 0, tint: "bg-amber-50", icon: <FaExclamationTriangle className="text-amber-600" size={15} /> },
    { key: "totalExtra", value: formatMinutesAsHhMm(summary?.totalExtraMinutes ?? 0), tint: "bg-rose-50", icon: <FaClock className="text-rose-600" size={15} /> },
    { key: "worked", value: formatMinutesAsHhMm(summary?.totalWorkedMinutes ?? 0), tint: "bg-emerald-50", icon: <FaClock className="text-emerald-600" size={15} /> },
    { key: "scheduled", value: formatMinutesAsHhMm(summary?.totalScheduledMinutes ?? 0), tint: "bg-slate-100", icon: <FaRegClock className="text-slate-500" size={15} /> },
  ];

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const header = [
        t("overtime.employee"),
        t("overtime.department"),
        t("overtime.schedule"),
        t("overtime.scheduled"),
        t("overtime.worked"),
        t("overtime.extra"),
        t("overtime.missing"),
        t("overtime.daysWithExtra"),
      ];
      const lines = rows.map((r) => [
        r.employeeName,
        r.departmentName ?? "",
        r.horarioNombre ?? t("overtime.noSchedule"),
        formatMinutesAsHhMm(r.programadasMin),
        formatMinutesAsHhMm(r.trabajadasMin),
        formatMinutesAsHhMm(r.extraMin),
        formatMinutesAsHhMm(r.faltanteMin),
        r.diasConExtra,
      ]);
      const escape = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
      const csv = [header, ...lines].map((row) => row.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horas-extra-${period.toLowerCase()}-${toDateInput(date)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<HorasExtraRow>[] = [
    {
      key: "employeeName",
      label: t("overtime.employee"),
      type: "string",
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.employeeName}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {r.numeroEmpleado ? `#${r.numeroEmpleado}` : "—"}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "departmentName",
      label: t("overtime.department"),
      type: "string",
      render: (r) => <ITText className="text-[11px] font-bold text-slate-600">{r.departmentName ?? "—"}</ITText>,
    },
    {
      key: "horarioNombre",
      label: t("overtime.schedule"),
      type: "string",
      render: (r) =>
        r.horarioNombre ? (
          <ITText className="text-[11px] font-bold text-slate-700">{r.horarioNombre}</ITText>
        ) : (
          <ITBadget color="gray" size="sm">
            {t("overtime.noSchedule")}
          </ITBadget>
        ),
    },
    {
      key: "extraMin",
      label: t("overtime.extra"),
      type: "number",
      render: (r) => (
        <ITText className={`text-[12px] font-black ${r.extraMin > 0 ? "text-rose-600" : "text-slate-400"}`}>
          {r.extraMin > 0 ? formatMinutesAsHhMm(r.extraMin) : "—"}
        </ITText>
      ),
    },
    {
      key: "workedMin",
      label: t("overtime.worked"),
      type: "number",
      render: (r) => <ITText className="text-[11px] font-bold text-slate-700">{formatMinutesAsHhMm(r.trabajadasMin)}</ITText>,
    },
    {
      key: "programadasMin",
      label: t("overtime.scheduled"),
      type: "number",
      render: (r) => <ITText className="text-[11px] text-slate-600">{formatMinutesAsHhMm(r.programadasMin)}</ITText>,
    },
    {
      key: "diasConExtra",
      label: t("overtime.daysWithExtra"),
      type: "number",
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.diasConExtra}</ITText>,
    },
  ];

  const fetchData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await scheduleApi.horasExtra({
        page: params.page,
        limit: params.limit,
        filters,
      });
      return { data: res.data as unknown as Record<string, unknown>[], total: res.total };
    },
    [filters]
  );

  return (
    <ITFlex direction="column" gap={4}>
      <ITCard title={t("overtime.filters")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITSegmentedControl
              options={periodOptions}
              value={period}
              onChange={(v) => handlePeriodChange(v as Period)}
            />
            <ITFlex gap={2} className="ml-auto">
              <ITButton variant="outlined" color="gray" size="sm" onClick={handleExportCsv} disabled={exporting}>
                <ITFlex align="center" gap={1}>
                  <FaFileCsv className="text-emerald-600" size={13} />
                  <ITText className="font-bold text-[11px]">{t("overtime.exportCsv")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton variant="text" color="gray" size="sm" onClick={clearFilters}>
                <ITFlex align="center" gap={1}>
                  <FaUndo size={11} />
                  <ITText className="font-bold text-[11px]">{t("overtime.clear")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              {period === "DAY" ? (
                <ITDatePicker
                  name="overtimeDate"
                  label={t("overtime.date")}
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v instanceof Date) setDate(v);
                  }}
                  className="w-full min-w-0"
                />
              ) : (
                <ITDatePicker
                  name="overtimeDateRange"
                  label={t("overtime.date")}
                  range
                  value={periodRange}
                  onChange={handleRange}
                  className="w-full min-w-0"
                />
              )}
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSearchSelect
                name="overtimeDept"
                label={t("overtime.department")}
                options={departmentOptions}
                value={departmentId}
                onChange={(v) => setDepartmentId(String(v))}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="overtimeQ"
                label={t("overtime.employee")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITFlex align="end" className="h-full pb-2">
                <ITCheckbox
                  name="overtimeInactive"
                  label={t("overtime.includeInactive")}
                  checked={includeInactive}
                  onChange={setIncludeInactive}
                />
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITFlex>
      </ITCard>

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
            <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl ${k.tint}`}>
              {k.icon}
            </ITFlex>
            <ITFlex direction="column" gap={0} className="min-w-0">
              <ITText className="text-xl font-black leading-none text-slate-800">{k.value}</ITText>
              <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {dyn(t)(`overtime.${k.key}`)}
              </ITText>
            </ITFlex>
          </ITFlex>
        ))}
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as never}
        externalFilters={filters}
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        size="lg"
      />
    </ITFlex>
  );
}
