import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITConfirmDialog,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITSegmentedControl,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaFileCsv,
  FaFilePdf,
  FaTimes,
  FaUndo,
  FaUserCheck,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { OvertimeDayRow, OvertimeDayStatus } from "@entities/overtime";
import { formatDateTime, formatMinutesAsHhMm } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
import { dayKeyOf, type Period, type StatusFilter, type UseOvertimeApproval } from "../model/useOvertimeApproval";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const STATUS_COLOR: Record<OvertimeDayStatus, BadgeColor> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const STATUS_KEY = {
  PENDING: "statusPending",
  APPROVED: "statusApproved",
  REJECTED: "statusRejected",
} as const satisfies Record<OvertimeDayStatus, string>;

/** Día local `YYYY-MM-DD` sin conversión de zona (es una clave, no un instante). */
const formatDayKey = (dayKey: string): string => {
  const [y, m, d] = dayKey.split("-");
  return d && m && y ? `${d}/${m}/${y}` : dayKey;
};

const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function OvertimeApprovalTable({ fx }: { fx: UseOvertimeApproval }) {
  const { t } = useTranslation("overtime");
  const {
    canApprove,
    period,
    setPeriod,
    date,
    setDate,
    departmentId,
    setDepartmentId,
    q,
    setQ,
    status,
    setStatus,
    summary,
    departments,
    externalFilters,
    tableKey,
    fetchTableData,
    selected,
    selectedCount,
    selectedMinutes,
    toggleRow,
    clearSelection,
    selectPending,
    requestDecision,
    confirm,
    setConfirm,
    confirmDecision,
    saving,
    exportPdf,
    exportCsv,
    exportingPdf,
    exportingCsv,
    reloadKey,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const tz = summary?.range.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

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

  const rangeLabel = useMemo(() => {
    const [start, end] = periodRange;
    if (period === "DAY") return t("rangeDay", { date: formatDayKey(toDateInput(start)), tz });
    return t("rangeRange", {
      start: formatDayKey(toDateInput(start)),
      end: formatDayKey(toDateInput(end)),
      tz,
    });
  }, [period, periodRange, t, tz]);

  const periodOptions = useMemo(
    () => [
      { value: "DAY", label: t("periods.DAY") },
      { value: "WEEK", label: t("periods.WEEK") },
      { value: "MONTH", label: t("periods.MONTH") },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("statusAll") },
      { value: "PENDING", label: t("statusPending") },
      { value: "APPROVED", label: t("statusApproved") },
      { value: "REJECTED", label: t("statusRejected") },
    ],
    [t]
  );

  const departmentOptions = useMemo(
    () => [
      { value: "", label: t("allDepartments") },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments, t]
  );

  const handlePeriodChange = (value: Period) => {
    setPeriod(value);
    setDate(new Date());
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
    setPeriod("WEEK");
    setDate(new Date());
    setDepartmentId("");
    setQ("");
    setStatus("");
  };

  // RH solo ve aprobado: KPIs reducidos (minutos y días aprobados).
  const kpis = canApprove
    ? [
        { key: "pending", value: formatMinutesAsHhMm(summary?.pendingMinutes ?? 0), tint: "bg-amber-50", icon: <FaExclamationTriangle className="text-amber-600" size={15} /> },
        { key: "approved", value: formatMinutesAsHhMm(summary?.approvedMinutes ?? 0), tint: "bg-emerald-50", icon: <FaCheck className="text-emerald-600" size={15} /> },
        { key: "rejected", value: formatMinutesAsHhMm(summary?.rejectedMinutes ?? 0), tint: "bg-rose-50", icon: <FaTimes className="text-rose-600" size={15} /> },
        { key: "people", value: summary?.peopleWithPending ?? 0, tint: "bg-sky-50", icon: <FaUserCheck className="text-sky-600" size={15} /> },
      ]
    : [
        { key: "approved", value: formatMinutesAsHhMm(summary?.approvedMinutes ?? 0), tint: "bg-emerald-50", icon: <FaCheck className="text-emerald-600" size={15} /> },
        { key: "approvedDays", value: summary?.approvedDays ?? 0, tint: "bg-sky-50", icon: <FaClock className="text-sky-600" size={15} /> },
      ];

  // El export muestra solo lo aprobado: sin aprobados, no hay nada que exportar.
  const hasApproved = (summary?.approvedMinutes ?? 0) > 0;

  // La columna de selección solo existe para quien puede decidir.
  const selectColumn: Column<OvertimeDayRow> = {
    key: "select",
    label: "",
    type: "actions",
    width: 80,
    actions: (r) => (
      <ITCheckbox
        name={`sel-${dayKeyOf(r)}`}
        checked={selected.has(dayKeyOf(r))}
        onChange={() => toggleRow(r)}
      />
    ),
  };

  const columns: Column<OvertimeDayRow>[] = [
    ...(canApprove ? [selectColumn] : []),
    {
      key: "employeeName",
      label: t("columns.employee"),
      type: "string",
      width: 300,
      sortable: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.employeeName}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {r.employeeNumber ? `#${r.employeeNumber}` : "—"}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "departmentName",
      label: t("columns.department"),
      type: "string",
      width: 200,
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.departmentName ?? "—"}</ITText>
      ),
    },
    {
      key: "date",
      label: t("columns.date"),
      type: "string",
      width: 130,
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatDayKey(r.date)}
        </ITText>
      ),
    },
    {
      key: "scheduleName",
      label: t("columns.schedule"),
      type: "string",
      width: 220,
      sortable: true,
      render: (r) =>
        r.scheduleName ? (
          <ITText className="text-[11px] font-bold text-slate-700">{r.scheduleName}</ITText>
        ) : (
          <ITBadget color="gray" size="sm">
            {t("columns.noSchedule")}
          </ITBadget>
        ),
    },
    {
      key: "extraMin",
      label: canApprove ? t("columns.extra") : t("statusApproved"),
      type: "number",
      width: 120,
      sortable: true,
      render: (r) => (
        <ITText className={canApprove ? "text-[12px] font-black text-rose-600" : "text-[12px] font-black text-emerald-700"}>
          {formatMinutesAsHhMm(canApprove ? r.extraMin : r.approvedExtraMin)}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("status"),
      type: "string",
      width: 140,
      sortable: true,
      render: (r) => (
        <ITBadget color={STATUS_COLOR[r.status]} size="sm">
          {t(STATUS_KEY[r.status])}
        </ITBadget>
      ),
    },
    {
      key: "decidedByName",
      label: t("columns.decidedBy"),
      type: "string",
      width: 200,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.decidedByName ?? "—"}</ITText>
      ),
    },
    {
      key: "decidedAt",
      label: t("columns.decidedAt"),
      type: "string",
      width: 170,
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] text-slate-600 whitespace-nowrap">
          {r.decidedAt ? formatDateTime(r.decidedAt) : "—"}
        </ITText>
      ),
    },
    {
      key: "note",
      label: t("columns.note"),
      type: "string",
      width: 240,
      sortable: false,
      render: (r) => <ITText className="text-[11px] text-slate-500">{r.note ?? "—"}</ITText>,
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITCard title={t("filters")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITSegmentedControl
              options={periodOptions}
              value={period}
              onChange={(v) => handlePeriodChange(v as Period)}
            />
            <ITFlex gap={2} wrap="wrap" className="ml-auto">
              <ITButton
                variant="outlined"
                color="gray"
                size="sm"
                onClick={() => void exportPdf()}
                disabled={exportingPdf || !hasApproved}
              >
                <ITFlex align="center" gap={1}>
                  <FaFilePdf className="text-red-600" size={13} />
                  <ITText className="font-bold text-[11px]">{t("exportPdf")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton
                variant="outlined"
                color="gray"
                size="sm"
                onClick={() => void exportCsv()}
                disabled={exportingCsv || !hasApproved}
              >
                <ITFlex align="center" gap={1}>
                  <FaFileCsv className="text-emerald-600" size={13} />
                  <ITText className="font-bold text-[11px]">{t("exportCsv")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton variant="text" color="gray" size="sm" onClick={clearFilters}>
                <ITFlex align="center" gap={1}>
                  <FaUndo size={11} />
                  <ITText className="font-bold text-[11px]">{t("clear")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={3}>
              {period === "DAY" ? (
                <ITDatePicker
                  name="overtimeApprovalDate"
                  label={t("date")}
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v instanceof Date) setDate(v);
                  }}
                  className="w-full min-w-0"
                />
              ) : (
                <ITDatePicker
                  name="overtimeApprovalDateRange"
                  label={t("date")}
                  range
                  value={periodRange}
                  onChange={handleRange}
                  className="w-full min-w-0"
                />
              )}
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITSearchSelect
                name="overtimeApprovalDept"
                label={t("columns.department")}
                options={departmentOptions}
                value={departmentId}
                onChange={(v) => setDepartmentId(String(v))}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITInput
                name="overtimeApprovalQ"
                label={t("columns.employee")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-0"
              />
            </ITGrid>
            {canApprove && (
              <ITGrid item xs={12} md={3}>
                <ITSelect
                  name="overtimeApprovalStatus"
                  label={t("status")}
                  options={statusOptions}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="w-full min-w-0"
                />
              </ITGrid>
            )}
          </ITGrid>
        </ITFlex>
      </ITCard>

      <ITAlert variant="info">{rangeLabel}</ITAlert>

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
                {dyn(t)(`kpis.${k.key}`)}
              </ITText>
            </ITFlex>
          </ITFlex>
        ))}
      </ITFlex>

      {canApprove && (
        <ITFlex align="center" wrap="wrap" gap={2} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <ITFlex align="center" gap={1} className="text-slate-500">
            <FaClock size={12} />
            <ITText className="text-[11px] font-bold">
              {t("selected", { count: selectedCount, time: formatMinutesAsHhMm(selectedMinutes) })}
            </ITText>
          </ITFlex>
          <ITFlex gap={2} wrap="wrap" className="ml-auto">
            <ITButton variant="text" color="gray" size="sm" onClick={() => void selectPending()}>
              <ITText className="font-bold text-[11px]">{t("actions.selectPending")}</ITText>
            </ITButton>
            <ITButton
              variant="text"
              color="gray"
              size="sm"
              onClick={clearSelection}
              disabled={selectedCount === 0}
            >
              <ITText className="font-bold text-[11px]">{t("actions.clearSelection")}</ITText>
            </ITButton>
            <ITButton
              variant="filled"
              color="success"
              size="sm"
              onClick={() => requestDecision("APPROVED")}
              disabled={selectedCount === 0}
            >
              <ITFlex align="center" gap={1}>
                <FaCheck size={11} />
                <ITText className="font-bold text-[11px]">
                  {t("actions.approveSelected", { count: selectedCount })}
                </ITText>
              </ITFlex>
            </ITButton>
            <ITButton
              variant="filled"
              color="error"
              size="sm"
              onClick={() => requestDecision("REJECTED")}
              disabled={selectedCount === 0}
            >
              <ITFlex align="center" gap={1}>
                <FaTimes size={11} />
                <ITText className="font-bold text-[11px]">
                  {t("actions.rejectSelected", { count: selectedCount })}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      )}

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDataTable
        key={tableKey}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchTableData as never}
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[25, 50, 100]}
        size="lg"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
      />

      {canApprove && (
        <ITConfirmDialog
          isOpen={!!confirm}
          onClose={() => {
            if (!saving) setConfirm(null);
          }}
          onConfirm={() => void confirmDecision()}
          title={confirm?.status === "APPROVED" ? t("dialog.approveTitle") : t("dialog.rejectTitle")}
          message={
            confirm?.status === "APPROVED"
              ? t("dialog.approveMessage", { count: selectedCount, time: formatMinutesAsHhMm(selectedMinutes) })
              : t("dialog.rejectMessage", { count: selectedCount, time: formatMinutesAsHhMm(selectedMinutes) })
          }
          confirmLabel={
            confirm?.status === "APPROVED" ? t("actions.approve") : t("actions.reject")
          }
          cancelLabel={t("cancel")}
          variant={confirm?.status === "APPROVED" ? "success" : "danger"}
          loading={saving}
        />
      )}

      {canApprove && toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
