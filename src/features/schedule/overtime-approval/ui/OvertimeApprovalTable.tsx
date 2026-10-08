import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITSearchSelect,
  ITText,
  ITTextarea,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaCheck, FaCheckCircle, FaClock, FaTimes, FaTimesCircle } from "react-icons/fa";
import type { OvertimeDayRow } from "@entities/overtime";
import { punchTime, workedTime } from "@entities/schedule";
import { dateLocale } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PeriodPicker } from "@shared/ui/period-picker";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { dayKeyOf, type StatusTab, type UseOvertimeApproval } from "../model/useOvertimeApproval";

const TABS: StatusTab[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];

/** Zona del navegador mientras llega la del servidor en `summary.range`. */
const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Departamentos que se listan en la tarjeta de resumen. */
const TOP_DEPARTMENTS = 4;

/** Iniciales para el avatar: primera letra de la primera y de la última palabra. */
const initialsOf = (name: string): string => {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0].charAt(0);
  return words.length === 1 ? first : first + words[words.length - 1].charAt(0);
};

/** "Mié 07 oct" de una clave de día (`YYYY-MM-DD`), sin corrimiento de zona. */
const dayLabel = (dayKey: string): string => {
  const text = new Date(`${dayKey}T12:00:00Z`)
    .toLocaleDateString(dateLocale(), { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" })
    .replace(/[.,]/g, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** "America/Tijuana" → "Tijuana". */
const cityOf = (timezone: string): string => (timezone.split("/").pop() ?? timezone).replace(/_/g, " ");

export default function OvertimeApprovalTable({ fx }: { fx: UseOvertimeApproval }) {
  const { t, canApprove, summary, tab, setTab } = fx;
  const tt = dyn(t);

  const tz = summary?.range.timezone || BROWSER_TIMEZONE;

  const periodLabels = useMemo(
    () => ({
      periods: {
        DAY: t("periodTabs.DAY"),
        WEEK: t("periodTabs.WEEK"),
        FORTNIGHT: t("periodTabs.FORTNIGHT"),
        MONTH: t("periodTabs.MONTH"),
      },
      date: t("filters.date"),
      previous: t("filters.previous"),
      next: t("filters.next"),
    }),
    [t]
  );

  const departmentOptions = useMemo(
    () => [
      { value: "", label: t("filters.allDepartments") },
      ...fx.departments.data.map((d) => ({ value: d.id, label: d.name })),
    ],
    [fx.departments, t]
  );

  // ── Indicadores ────────────────────────────────────────────────────────
  const pendingDays = summary?.pendingDays ?? 0;
  const approvedDays = summary?.approvedDays ?? 0;
  const rejectedDays = summary?.rejectedDays ?? 0;
  const byDepartment = (summary?.byDepartment ?? []).slice(0, TOP_DEPARTMENTS);
  const maxDepartment = Math.max(1, ...byDepartment.map((d) => d.minutes));

  const counts: Record<StatusTab, number> = {
    PENDING: pendingDays,
    APPROVED: approvedDays,
    REJECTED: rejectedDays,
    ALL: summary?.totalDays ?? 0,
  };
  // RH solo ve lo aprobado: una sola pestaña.
  const visibleTabs = canApprove ? TABS : (["APPROVED"] as StatusTab[]);

  // ── Tabla ──────────────────────────────────────────────────────────────
  const renderShift = (r: OvertimeDayRow) => {
    const exit = r.exitAt ? punchTime(r.exitAt, r.date, tz) : null;
    if (r.withoutSchedule) {
      return (
        <ITBadget color="gray" size="sm">
          {t("columns.noSchedule")}
        </ITBadget>
      );
    }
    if (r.restDay) {
      return (
        <ITFlex align="center" gap={2}>
          <ITBadget color="gray" size="sm">
            {t("columns.restDay")}
          </ITBadget>
          {exit && <span className="font-mono text-[12px] text-slate-700">→ {exit}</span>}
        </ITFlex>
      );
    }
    return (
      <span className="font-mono text-[12px] text-slate-700">
        {r.shift ?? "—"} → {exit ?? "—"}
      </span>
    );
  };

  const renderStatus = (r: OvertimeDayRow) => {
    if (r.status === "PENDING") {
      if (!canApprove) {
        return (
          <ITBadget color="warning" size="sm">
            {t("statusPending")}
          </ITBadget>
        );
      }
      const item = [{ userId: r.userId, date: r.date }];
      return (
        <ITFlex align="center" gap={2}>
          <ITButton
            variant="outlined"
            color="danger"
            size="sm"
            title={t("actions.reject")}
            aria-label={t("actions.reject")}
            disabled={fx.saving}
            onClick={() => fx.startReject(item)}
          >
            <FaTimes size={11} />
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            size="sm"
            disabled={fx.saving}
            onClick={() => void fx.approveItems(item)}
          >
            <ITFlex align="center" gap={1}>
              <FaCheck size={11} />
              <ITText className="text-[11px] font-bold">{t("actions.approve")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      );
    }
    const approved = r.status === "APPROVED";
    return (
      <ITFlex direction="column" gap={0.5} align="start">
        <ITBadget color={approved ? "success" : "danger"} size="sm">
          {approved ? t("badge.approved") : t("badge.rejected")}
        </ITBadget>
        {r.decidedByName && (
          <ITText className="text-[10px] text-slate-500">{t("decidedByName", { name: r.decidedByName })}</ITText>
        )}
      </ITFlex>
    );
  };

  const selectColumn: Column<OvertimeDayRow> = {
    key: "select",
    // El kit pinta `label` tal cual: aquí va la casilla de "seleccionar pendientes visibles".
    label: (
      <ITCheckbox
        name="overtimeSelectVisible"
        checked={fx.allVisibleSelected}
        disabled={!fx.hasVisiblePending}
        onChange={fx.toggleVisiblePending}
      />
    ) as unknown as string,
    type: "actions",
    width: 56,
    actions: (r) =>
      r.status === "PENDING" ? (
        <ITCheckbox
          name={`sel-${dayKeyOf(r)}`}
          checked={fx.selected.has(dayKeyOf(r))}
          onChange={() => fx.toggleRow(r)}
        />
      ) : null,
  };

  const columns: Column<OvertimeDayRow>[] = [
    ...(canApprove ? [selectColumn] : []),
    {
      key: "employeeName",
      label: t("columns.employee"),
      type: "string",
      width: 260,
      sortable: false,
      render: (r) => {
        const subtitle = [r.employeeNumber ? `#${r.employeeNumber}` : null, r.departmentName]
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
    {
      // "day": `date` es el ancla del periodo que manda la barra (la API ordena "day" por fecha).
      key: "day",
      label: t("columns.date"),
      type: "string",
      width: 120,
      sortable: true,
      render: (r) => (
        <ITText className="whitespace-nowrap text-[12px] font-semibold text-slate-700">{dayLabel(r.date)}</ITText>
      ),
    },
    {
      key: "shift",
      label: t("columns.shiftExit"),
      type: "string",
      width: 220,
      sortable: false,
      render: renderShift,
    },
    {
      key: "extraMin",
      label: t("columns.extra"),
      type: "number",
      width: 90,
      sortable: true,
      render: (r) => (
        <ITText className="text-[13px] font-black tabular-nums text-[#ea580c]">
          +{workedTime(canApprove ? r.extraMin : r.approvedExtraMin)}
        </ITText>
      ),
    },
    {
      key: "note",
      label: t("columns.reason"),
      type: "string",
      width: 200,
      sortable: false,
      render: (r) => (
        <ITText className="truncate text-[12px] text-slate-600" title={r.note ?? undefined}>
          {r.note || "—"}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("status"),
      type: "string",
      width: 190,
      sortable: false,
      render: renderStatus,
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {/* Filtros */}
      <ITCard className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="end" wrap="wrap" gap={3}>
            <PeriodPicker
              name="overtime"
              period={fx.period}
              onPeriodChange={fx.changePeriod}
              date={fx.date}
              range={fx.periodRange}
              onDateChange={fx.setDate}
              onPrevious={fx.previousPeriod}
              onNext={fx.nextPeriod}
              labels={periodLabels}
            />
            <div className="min-w-[200px] flex-1">
              <ITSearchSelect
                name="overtimeDepartment"
                label={t("filters.department")}
                options={departmentOptions}
                value={fx.departmentId}
                onChange={(value) => fx.setDepartmentId(String(value))}
                className="w-full min-w-0"
              />
            </div>
            <div className="min-w-[220px] flex-1">
              <ITInput
                name="overtimeEmployee"
                label={t("filters.employee")}
                placeholder={t("filters.employeePlaceholder")}
                value={fx.search}
                onChange={(e) => fx.setSearch(e.target.value)}
                className="w-full min-w-0"
              />
            </div>
          </ITFlex>
          <ITText className="text-[11px] text-slate-500">{t("timezone", { city: cityOf(tz) })}</ITText>
        </ITFlex>
      </ITCard>

      {/* Indicadores */}
      <div
        className={`grid !grid-cols-1 gap-3 sm:!grid-cols-2 ${canApprove ? "lg:!grid-cols-4" : "lg:!grid-cols-2"}`}
      >
        {canApprove && (
          <KpiTile
            label={t("tiles.pending")}
            value={workedTime(summary?.pendingMinutes ?? 0)}
            hint={`${t("tiles.requests", { count: pendingDays })} · ${t("tiles.people", {
              count: summary?.peopleWithPending ?? 0,
            })}`}
            tone="amber"
            icon={<FaClock size={16} />}
            onClick={() => setTab("PENDING")}
          />
        )}
        <KpiTile
          label={t("tiles.approved")}
          value={workedTime(summary?.approvedMinutes ?? 0)}
          hint={t("tiles.requests", { count: approvedDays })}
          tone="emerald"
          icon={<FaCheckCircle size={16} />}
        />
        {canApprove && (
          <KpiTile
            label={t("tiles.rejected")}
            value={workedTime(summary?.rejectedMinutes ?? 0)}
            hint={t("tiles.requests", { count: rejectedDays })}
            tone="rose"
            icon={<FaTimesCircle size={16} />}
          />
        )}
        <div className="flex w-full flex-col rounded-2xl border border-slate-200 !bg-white p-4 shadow-sm">
          <p className="truncate !text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t("tiles.byDepartment")}
          </p>
          {byDepartment.length === 0 ? (
            <p className="mt-3 !text-[12px] text-slate-400">{t("tiles.noOvertime")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {byDepartment.map((d) => (
                <li key={d.departmentId ?? "none"}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate !text-[12px] font-semibold text-slate-700">
                      {d.departmentName ?? t("noDepartment")}
                    </span>
                    <span className="shrink-0 !text-[12px] font-bold tabular-nums text-slate-900">
                      {workedTime(d.minutes)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full !bg-slate-100">
                    <div
                      className="h-1.5 rounded-full !bg-[#0D5777]"
                      style={{ width: `${Math.max(4, Math.round((d.minutes * 100) / maxDepartment))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {/* Lista por estatus */}
      <ITCard className="!p-5 border border-slate-200">
        <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
          {visibleTabs.map((value) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={`-mb-px flex items-center gap-2 border-b-2 !bg-transparent px-3 py-2 text-[13px] font-bold transition ${
                  active
                    ? "!border-[#0D5777] !text-[#0D5777]"
                    : "!border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tt(`tabs.${value}`)}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                    active ? "!bg-[#0D5777] text-white" : "!bg-slate-100 text-slate-600"
                  }`}
                >
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>

        {canApprove && fx.selectedCount > 0 && (
          <ITFlex
            align="center"
            wrap="wrap"
            gap={3}
            className="mb-4 rounded-xl border border-slate-200 !bg-slate-50 px-4 py-2.5"
          >
            <ITText className="text-[12px] font-bold text-slate-700">
              {t("bulk.selected", { count: fx.selectedCount })}
            </ITText>
            <ITFlex gap={2} wrap="wrap" className="ml-auto">
              <ITButton variant="text" color="gray" size="sm" onClick={fx.clearSelection}>
                <ITText className="text-[11px] font-bold">{t("actions.clearSelection")}</ITText>
              </ITButton>
              <ITButton variant="outlined" color="danger" size="sm" disabled={fx.saving} onClick={fx.startRejectSelected}>
                <ITFlex align="center" gap={1}>
                  <FaTimes size={11} />
                  <ITText className="text-[11px] font-bold">{t("actions.reject")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton
                variant="filled"
                color="primary"
                size="sm"
                disabled={fx.saving}
                onClick={() => void fx.approveSelected()}
              >
                <ITFlex align="center" gap={1}>
                  <FaCheck size={11} />
                  <ITText className="text-[11px] font-bold">{t("actions.approve")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        )}

        <ITDataTable
          key={fx.tableKey}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={
            fx.fetchTableData as unknown as (
              p: Parameters<typeof fx.fetchTableData>[0]
            ) => Promise<{ data: Record<string, unknown>[]; total: number }>
          }
          externalFilters={fx.externalFilters}
          reloadTrigger={fx.reloadKey}
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
        />

        <ITText className="mt-4 text-[11px] text-slate-500">{t("footnote")}</ITText>
      </ITCard>

      {/* Rechazo con motivo opcional */}
      {canApprove && (
        <ITDialog isOpen={!!fx.rejectDraft} onClose={fx.cancelReject} title={t("dialog.rejectTitle")}>
          <ITFlex direction="column" gap={4}>
            <ITText className="text-[12px] text-slate-600">
              {t("dialog.rejectMessage", { count: fx.rejectDraft?.items.length ?? 0 })}
            </ITText>
            <ITTextarea
              name="overtimeRejectNote"
              label={t("dialog.noteLabel")}
              placeholder={t("dialog.notePlaceholder")}
              rows={3}
              value={fx.rejectDraft?.note ?? ""}
              onChange={fx.setRejectNote}
            />
            <ITFlex justify="end" gap={2}>
              <ITButton variant="outlined" color="gray" onClick={fx.cancelReject} disabled={fx.saving}>
                {t("cancel")}
              </ITButton>
              <ITButton variant="filled" color="danger" onClick={() => void fx.confirmReject()} disabled={fx.saving}>
                {t("actions.reject")}
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITDialog>
      )}

      {canApprove && fx.toast && (
        <ITToast
          message={fx.toast.message}
          type={fx.toast.type}
          position="bottom-center"
          duration={3000}
          onClose={() => fx.setToast(null)}
        />
      )}
    </ITFlex>
  );
}
