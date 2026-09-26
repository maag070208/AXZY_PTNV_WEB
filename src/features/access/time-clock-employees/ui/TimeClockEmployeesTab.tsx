import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaLink, FaMagic, FaUnlink } from "react-icons/fa";
import type { TimeClockEmployee, TimeClockEmployeeStatus } from "@entities/time-clock";
import { formatDateTime } from "@shared/utils/dates";
import type { UseTimeClockEmployees } from "../model/useTimeClockEmployees";

const STATUSES: TimeClockEmployeeStatus[] = ["LINKED", "UNLINKED", "SUGGESTED"];

export default function TimeClockEmployeesTab({ fx }: { fx: UseTimeClockEmployees }) {
  const {
    t,
    canLink,
    q,
    setQ,
    status,
    setStatus,
    externalFilters,
    fetchTableData,
    reloadKey,
    summary,
    users,
    target,
    setTarget,
    userId,
    setUserId,
    saving,
    openLink,
    confirm,
    acceptSuggestion,
    unlinkEmployee,
    linkSuggested,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("employees.filters.all") },
      ...STATUSES.map((e) => ({ value: e, label: t(`employees.statuses.${e}`) })),
    ],
    [t]
  );

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.employeeNumber ? `${u.name} · #${u.employeeNumber}` : u.name,
      })),
    [users]
  );

  const kpis = [
    { key: "total", value: summary?.total ?? 0, tint: "bg-[#0D5777]/10 text-[#0D5777]" },
    { key: "linkedCount", value: summary?.linkedCount ?? 0, tint: "bg-emerald-50 text-emerald-600" },
    { key: "withoutLink", value: summary?.withoutLink ?? 0, tint: "bg-slate-100 text-slate-500" },
    { key: "registrationSuggestions", value: summary?.registrationSuggestions ?? 0, tint: "bg-amber-50 text-amber-600" },
  ] as const;

  const columns = useMemo<Column<TimeClockEmployee>[]>(
    () => [
      {
        key: "employeeNumber",
        label: t("employees.columns.number"),
        type: "string",
        width: 120,
        sortable: true,
        render: (r) => (
          <ITText className="text-[12px] font-black text-slate-800 whitespace-nowrap">
            #{r.employeeNumber}
          </ITText>
        ),
      },
      {
        key: "name",
        label: t("employees.columns.name"),
        type: "string",
        width: 300,
        sortable: true,
        render: (r) => <ITText className="text-[12px] font-bold text-slate-700">{r.name}</ITText>,
      },
      {
        key: "punches",
        label: t("employees.columns.punches"),
        type: "number",
        width: 200,
        sortable: true,
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-bold text-slate-700">{r.punches}</ITText>
            <ITText className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
              {formatDateTime(r.lastPunch)}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "link",
        label: t("employees.columns.user"),
        type: "string",
        width: 260,
        render: (r) => {
          if (r.link) {
            return (
              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[12px] font-black text-emerald-700">{r.link.name}</ITText>
                <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {r.link.employeeNumber ? `#${r.link.employeeNumber}` : "—"}
                  {!r.link.active && ` · ${t("employees.retirement")}`}
                </ITText>
              </ITFlex>
            );
          }
          if (r.suggestion) {
            return (
              <ITFlex direction="column" gap={0.5}>
                <ITFlex align="center" gap={1}>
                  <ITBadget color={r.suggestion.confidence === "HIGH" ? "success" : "warning"} size="sm">
                    {t("employees.suggestion")}
                  </ITBadget>
                  <ITText className="text-[12px] font-bold text-slate-700">{r.suggestion.name}</ITText>
                </ITFlex>
                <ITText className="text-[9px] font-bold text-slate-400">
                  {r.suggestion.employeeNumber ? `#${r.suggestion.employeeNumber} · ` : ""}
                  {!r.suggestion.active && `${t("employees.retirement")} · `}
                  {t(`employees.confidence.${r.suggestion.confidence}`)}
                </ITText>
              </ITFlex>
            );
          }
          return (
            <ITBadget color="gray" size="sm">
              {t("employees.withoutLink")}
            </ITBadget>
          );
        },
      },
      ...(canLink
        ? [
            {
              key: "actions",
              label: t("employees.columns.actions"),
              type: "actions" as const,
              width: 260,
              actions: (r: TimeClockEmployee) => (
                <ITFlex align="center" gap={1}>
                  {!r.link && r.suggestion && (
                    <ITButton variant="filled" color="primary" size="sm" onClick={() => acceptSuggestion(r)}>
                      <ITFlex align="center" gap={1}>
                        <FaCheck size={10} />
                        <ITText className="font-bold text-[11px]">{t("employees.actions.accept")}</ITText>
                      </ITFlex>
                    </ITButton>
                  )}
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={() => openLink(r)}>
                    <ITFlex align="center" gap={1}>
                      <FaLink size={10} />
                      <ITText className="font-bold text-[11px]">
                        {r.link ? t("employees.actions.change") : t("employees.actions.linkEmployee")}
                      </ITText>
                    </ITFlex>
                  </ITButton>
                  {r.link && (
                    <ITButton variant="text" color="danger" size="sm" onClick={() => void unlinkEmployee(r)}>
                      <ITFlex align="center" gap={1}>
                        <FaUnlink size={10} />
                        <ITText className="font-bold text-[11px]">{t("employees.actions.unlinkEmployee")}</ITText>
                      </ITFlex>
                    </ITButton>
                  )}
                </ITFlex>
              ),
            },
          ]
        : []),
    ],
    [t, canLink, openLink, acceptSuggestion, unlinkEmployee]
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {/* KPIs */}
      <ITFlex wrap="wrap" gap={3}>
        {kpis.map((k) => (
          <ITFlex
            key={k.key}
            grow={1}
            basis="160px"
            align="center"
            gap={3}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl ${k.tint}`}>
              <ITText className="text-sm font-black">{k.value}</ITText>
            </ITFlex>
            <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t(`employees.kpis.${k.key}`)}
            </ITText>
          </ITFlex>
        ))}
      </ITFlex>

      {/* Filtros + vincular sugerencias */}
      <ITCard className="!p-5 border border-slate-200">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={5}>
            <ITInput
              name="checadorEmpleadosQ"
              label={t("employees.filters.q")}
              placeholder={t("employees.filters.qPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="checadorEmpleadosEstado"
              label={t("employees.filters.status")}
              options={statusOptions}
              value={status}
              onChange={(value) => setStatus(String(value) as TimeClockEmployeeStatus | "")}
              className="w-full min-w-0"
            />
          </ITGrid>
          {canLink && (
            <ITGrid item xs={12} md={3}>
              <ITFlex align="end" className="h-full pb-1">
                <ITButton
                  variant="filled"
                  color="primary"
                  size="sm"
                  disabled={saving || !summary?.registrationSuggestions}
                  onClick={() => void linkSuggested()}
                >
                  <ITFlex align="center" gap={1}>
                    <FaMagic size={11} />
                    <ITText className="font-bold text-[11px]">
                      {t("employees.actions.linkSuggested", { count: summary?.registrationSuggestions ?? 0 })}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITGrid>
          )}
        </ITGrid>
      </ITCard>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[10, 25, 50, 100]}
        debounceMs={350}
        size="lg"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
      />

      <ITDialog
        isOpen={!!target}
        onClose={() => setTarget(null)}
        title={t("employees.dialog.title", { number: target?.employeeNumber ?? "" })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={3} className="mt-2">
          <ITText className="text-[12px] text-slate-600">
            {t("employees.dialog.clock", { name: target?.name ?? "" })}
          </ITText>
          <ITSearchSelect
            name="checadorVinculoUsuario"
            label={t("employees.dialog.user")}
            placeholder={t("employees.dialog.userPlaceholder")}
            options={userOptions}
            value={userId}
            onChange={(value) => setUserId(String(value))}
            className="w-full min-w-0"
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setTarget(null)}>
              {t("employees.actions.cancel")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={!userId || saving} onClick={confirm}>
              {t("employees.actions.save")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="top-right"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
