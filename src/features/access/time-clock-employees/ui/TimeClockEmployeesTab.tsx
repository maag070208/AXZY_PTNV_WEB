import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITChip,
  ITDataTable,
  ITDialog,
  ITFlex,
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
import { FaCheck, FaLink, FaMagic, FaUndo, FaUnlink, FaUsers } from "react-icons/fa";
import type { TimeClockEmployee, TimeClockEmployeeStatus } from "@entities/time-clock";
import { formatDateTime } from "@shared/utils/dates";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseTimeClockEmployees } from "../model/useTimeClockEmployees";
import { usePeopleOptions } from "@entities/user";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const STATUSES: TimeClockEmployeeStatus[] = ["LINKED", "UNLINKED", "SUGGESTED"];

const STATUS_COLOR: Record<TimeClockEmployeeStatus, BadgeColor> = {
  LINKED: "success",
  // Con sugerencia: hay candidato, falta que alguien lo confirme.
  SUGGESTED: "warning",
  // Sin vincular: no hay con quién; es el que rompe las jornadas.
  UNLINKED: "gray",
};

/** El estado de una fila se deduce de su vínculo y de su sugerencia. */
const statusOf = (r: TimeClockEmployee): TimeClockEmployeeStatus =>
  r.link ? "LINKED" : r.suggestion ? "SUGGESTED" : "UNLINKED";

interface Props {
  fx: UseTimeClockEmployees;
  /** Atajo al reporte de entradas/salidas, donde se ve el efecto de no vincular. */
  onSeeReport?: () => void;
}

export default function TimeClockEmployeesTab({ fx, onSeeReport }: Props) {
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
    tableTotal,
    savingNumber,
    target,
    setTarget,
    userId,
    setUserId,
    saving,
    openLink,
    confirm,
    acceptSuggestion,
    unlinkEmployee,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const total = summary?.total ?? 0;
  const linked = summary?.linkedCount ?? 0;
  const withoutLink = summary?.withoutLink ?? 0;
  const suggestions = summary?.registrationSuggestions ?? 0;
  const percent = total > 0 ? Math.round((linked / total) * 100) : 0;

  const counts: Record<TimeClockEmployeeStatus, number> = {
    LINKED: linked,
    UNLINKED: withoutLink,
    SUGGESTED: suggestions,
  };

  const userOptions = useMemo(
    () =>
      fx.users.map((u) => ({
        value: u.id,
        label: u.employeeNumber ? `${u.name} · #${u.employeeNumber}` : u.name,
      })),
    [fx.users]
  );

  // Opciones del filtro Vinculado a (incluye bajas: pueden seguir vinculadas).
  const peopleOptions = usePeopleOptions();

  const columns = useMemo<Column<TimeClockEmployee>[]>(
    () => [
      {
        key: "employeeNumber",
        label: t("employees.columns.number"),
        type: "string",
        width: 150,
        filter: true,
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
        width: 250,
        filter: true,
        sortable: true,
        render: (r) => <ITText className="text-[12px] font-bold text-slate-700">{r.name}</ITText>,
      },
      {
        // Sin `filter` a propósito: el filtro de esta columna son las píldoras de
        // arriba (la misma llave `status`), y dos valores del mismo campo se
        // pisarían entre sí.
        key: "status",
        label: t("employees.columns.status"),
        type: "catalog",
        width: 150,
        sortable: false,
        render: (r) => {
          const estado = statusOf(r);
          return (
            <ITBadget color={STATUS_COLOR[estado]} size="sm">
              {t(`employees.statuses.${estado}`)}
            </ITBadget>
          );
        },
      },
      {
        key: "punches",
        label: t("employees.columns.punches"),
        type: "number",
        width: 140,
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
        type: "catalog",
        width: 270,
        filter: "search",
        catalogOptions: peopleOptions,
        sortable: true,
        render: (r) => {
          const ocupada = savingNumber === r.employeeNumber;
          if (r.link) {
            return (
              <ITFlex direction="column" gap={0.5} className="min-w-0">
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
              <ITFlex align="center" wrap="wrap" gap={2} className="min-w-0">
                <ITFlex direction="column" gap={0.5} className="min-w-0">
                  <ITFlex align="center" gap={1}>
                    <ITBadget
                      color={r.suggestion.confidence === "HIGH" ? "success" : "warning"}
                      size="sm"
                    >
                      {t("employees.suggestion")}
                    </ITBadget>
                    <ITText className="text-[12px] font-bold text-slate-700">
                      {r.suggestion.name}
                    </ITText>
                  </ITFlex>
                  <ITText className="text-[9px] font-bold text-slate-400">
                    {r.suggestion.employeeNumber ? `#${r.suggestion.employeeNumber} · ` : ""}
                    {!r.suggestion.active && `${t("employees.retirement")} · `}
                    {t(`employees.confidence.${r.suggestion.confidence}`)}
                  </ITText>
                </ITFlex>
                {canLink && (
                  <ITButton
                    variant="filled"
                    color="primary"
                    size="sm"
                    disabled={ocupada}
                    onClick={() => acceptSuggestion(r)}
                  >
                    <ITFlex align="center" gap={1}>
                      <FaCheck size={10} />
                      <ITText className="font-bold text-[11px]">{t("employees.actions.accept")}</ITText>
                    </ITFlex>
                  </ITButton>
                )}
              </ITFlex>
            );
          }
          return <ITText className="text-[11px] text-slate-400">—</ITText>;
        },
      },
      ...(canLink
        ? [
          {
            key: "actions",
            label: t("employees.columns.actions"),
            type: "actions" as const,
            width: 220,
            actions: (r: TimeClockEmployee) => {
              const ocupada = savingNumber === r.employeeNumber;
              return (
                <ITFlex align="center" gap={1}>
                  <ITButton
                    variant="outlined"
                    color="secondary"
                    size="sm"
                    disabled={ocupada}
                    onClick={() => openLink(r)}
                  >
                    <ITFlex align="center" gap={1}>
                      <FaLink size={10} />
                      <ITText className="font-bold text-[11px]">
                        {r.link ? t("employees.actions.change") : t("employees.actions.linkEmployee")}
                      </ITText>
                    </ITFlex>
                  </ITButton>
                  {r.link && (
                    <ITButton
                      variant="text"
                      color="danger"
                      size="sm"
                      disabled={ocupada}
                      onClick={() => void unlinkEmployee(r)}
                    >
                      <ITFlex align="center" gap={1}>
                        <FaUnlink size={10} />
                        <ITText className="font-bold text-[11px]">
                          {t("employees.actions.unlinkEmployee")}
                        </ITText>
                      </ITFlex>
                    </ITButton>
                  )}
                </ITFlex>
              );
            },
          },
        ]
        : []),
    ],
    [
      t,
      canLink,
      savingNumber,
      openLink,
      acceptSuggestion,
      unlinkEmployee,
      peopleOptions,
    ]
  );

  const hayFiltros = !!q || !!status;

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {/* Indicadores: cada uno filtra por su estado. */}
      <div className="!grid gap-4 sm:!grid-cols-2 xl:!grid-cols-4">
        <KpiTile
          label={t("employees.kpis.total")}
          value={total}
          icon={<FaUsers size={16} />}
          tone="sky"
          hint={total > 0 ? t("employees.kpis.hintTotal") : t("employees.kpis.allGood")}
          onClick={() => setStatus("")}
        />
        <KpiTile
          label={t("employees.kpis.linkedCount")}
          value={linked}
          icon={<FaCheck size={16} />}
          tone="emerald"
          hint={
            total > 0
              ? t("employees.kpis.hintLinked", { percent })
              : t("employees.kpis.allGood")
          }
          onClick={() => setStatus("LINKED")}
        />
        <KpiTile
          label={t("employees.kpis.withoutLink")}
          value={withoutLink}
          icon={<FaUnlink size={16} />}
          tone={withoutLink > 0 ? "amber" : "neutral"}
          hint={withoutLink > 0 ? t("employees.kpis.hintWithoutLink") : t("employees.kpis.allGood")}
          onClick={() => setStatus("UNLINKED")}
        />
        <KpiTile
          label={t("employees.kpis.registrationSuggestions")}
          value={suggestions}
          icon={<FaMagic size={16} />}
          tone={suggestions > 0 ? "sky" : "neutral"}
          hint={suggestions > 0 ? t("employees.kpis.hintSuggestions") : t("employees.kpis.allGood")}
          onClick={() => setStatus("SUGGESTED")}
        />
      </div>

      {/* Filtros: píldoras del estado (con su conteo) y el buscador. */}
      <PanelCard
        actions={
          <ITButton
            variant="text"
            color="gray"
            size="sm"
            disabled={!hayFiltros}
            onClick={() => {
              setQ("");
              setStatus("");
            }}
          >
            <ITFlex align="center" gap={1}>
              <FaUndo size={11} />
              <ITText className="font-bold text-[11px]">{t("employees.filters.clear")}</ITText>
            </ITFlex>
          </ITButton>
        }
      >
        <ITFlex align="center" wrap="wrap" gap={2}>
          <ITChip
            label={`${t("employees.filters.all")} (${total})`}
            selected={!status}
            onClick={() => setStatus("")}
            color="primary"
            variant="outlined"
            size="sm"
          />
          {STATUSES.map((s) => (
            <ITChip
              key={s}
              label={`${t(`employees.statuses.${s}`)} (${counts[s]})`}
              selected={status === s}
              onClick={() => setStatus(s)}
              color="primary"
              variant="outlined"
              size="sm"
            />
          ))}
          <div className="ml-auto w-full sm:w-80">
            <ITInput
              name="checadorEmpleadosQ"
              placeholder={t("employees.filters.qPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full min-w-0"
            />
          </div>
        </ITFlex>
      </PanelCard>

      <PanelCard
        title={
          tableTotal != null
            ? t("employees.table.title", { count: tableTotal })
            : t("employees.table.titleUnknown")
        }
      >
        {withoutLink > 0 && (
          <ITAlert
            variant="warning"
            title={t("employees.risk.title", { count: withoutLink })}
            className="mb-4"
          >
            <ITFlex direction="column" gap={2}>
              <ITText className="text-[12px]">{t("employees.risk.text")}</ITText>
              {onSeeReport && (
                <ITFlex>
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={onSeeReport}>
                    <ITText className="font-bold text-[11px]">{t("employees.risk.action")}</ITText>
                  </ITButton>
                </ITFlex>
              )}
            </ITFlex>
          </ITAlert>
        )}

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
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={420}
          rowHeight={50}
        />
      </PanelCard>

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
