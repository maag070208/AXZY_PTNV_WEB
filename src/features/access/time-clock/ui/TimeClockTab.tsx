import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITChip,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaLock, FaUndo } from "react-icons/fa";
import type { TimeClockPunch, PunchMethod } from "@entities/time-clock";
import { formatAgo, formatDate } from "@shared/i18n";
import { formatDateTime, formatTimeInTZ } from "@shared/utils/dates";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseTimeClock } from "../model/useTimeClock";
import TimeClockStatusCard from "./TimeClockStatusCard";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const METHODS: PunchMethod[] = ["FACE", "FINGERPRINT", "CARD", "OTHER"];

const METHOD_COLOR: Record<PunchMethod, BadgeColor> = {
  FACE: "info",
  FINGERPRINT: "success",
  CARD: "gray",
  OTHER: "warning",
};

const pad = (n: number): string => String(n).padStart(2, "0");

/** Clave `YYYY-MM-DD` de un día local, para comparar días sin horas. */
const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Iniciales del nombre para el avatar de la columna Empleado ("Mariana Ruiz Ortega" → MR). */
const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export default function TimeClockTab({ fx }: { fx: UseTimeClock }) {
  const {
    t,
    dateRange,
    setDateRange,
    rangeMode,
    applyRange,
    chooseCustomRange,
    q,
    setQ,
    method,
    setMethod,
    clock,
    setClock,
    clearFilters,
    externalFilters,
    fetchTableData,
    reloadKey,
    tableTotal,
    tableUpdatedAt,
    status,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const [from, to] = dateRange;
  /** Un solo día: la columna lleva solo la hora (como el resto de la pantalla). */
  const singleDay = !!from && !!to && dayKey(from) === dayKey(to);

  const handleDateRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value)) setDateRange(value);
  };

  const columns = useMemo<Column<TimeClockPunch>[]>(
    () => [
      {
        key: "occurredAt",
        label: singleDay ? t("columns.occurredAt") : t("columns.dateTime"),
        type: "date",
        width: 190,
        filter: "date-range",
        dateFilterOptions: { maxDate: new Date() },
        sortable: false,
        render: (c) => (
          <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
            {singleDay ? formatTimeInTZ(c.occurredAt) : formatDateTime(c.occurredAt)}
          </ITText>
        ),
      },
      {
        key: "employeeNumber",
        label: t("columns.employee"),
        type: "catalog",
        width: 300,
        filter: "search",
        catalogOptions: fx.employeeOptions,
        sortable: false,
        render: (c) => (
          <ITFlex align="center" gap={2} className="min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
              {initials(c.name || "")}
            </span>
            <ITFlex direction="column" gap={0.5} className="min-w-0">
              <ITText className="text-[12px] font-black text-slate-800">{c.name || "—"}</ITText>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                #{c.employeeNumber}
              </ITText>
            </ITFlex>
          </ITFlex>
        ),
      },
      {
        key: "method",
        label: t("columns.method"),
        type: "catalog",
        width: 140,
        sortable: false,
        filter: "catalog",
        catalogOptions: { data: METHODS.map((m) => ({ id: m, name: t(`methods.${m}`) })) },
        render: (c) => (
          <span title={c.method === "OTHER" ? t("otherHint", { minor: c.minor }) : undefined}>
            <ITBadget color={METHOD_COLOR[c.method]} size="lg">
              {t(`methods.${c.method}`)}
            </ITBadget>
          </span>
        ),
      },
      {
        key: "clock",
        label: t("columns.clock"),
        type: "catalog",
        width: 200,
        sortable: false,
        filter: "catalog",
        catalogOptions: { data: (status?.devices ?? []).map((d) => ({ id: d.clockSerial, name: d.name })) },
        render: (c) => (
          <span title={c.clockSerial}>
            <ITText className="text-[11px] font-bold text-slate-600">{c.clock ?? c.clockSerial}</ITText>
          </span>
        ),
      },
      {
        key: "serialNo",
        label: t("columns.serialNo"),
        type: "number",
        width: 100,
        filter: true,
        sortable: false,
        render: (c) => (
          <ITText className="text-[10px] font-bold text-slate-400">{c.serialNo}</ITText>
        ),
      },
    ],
    [t, singleDay, status?.devices, fx.employeeOptions]
  );

  /** "Hoy, miércoles 07 oct" para un día; "01 oct – 07 oct" para un rango. */
  const rangeLabel = useMemo(() => {
    if (!from) return "";
    const largo = (d: Date): string =>
      formatDate(d, { weekday: "long", day: "2-digit", month: "short" }).replace(",", "");
    const corto = (d: Date): string => formatDate(d, { day: "2-digit", month: "short" });
    if (!to || dayKey(from) === dayKey(to)) {
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const key = dayKey(from);
      if (key === dayKey(hoy)) return `${t("table.today")}, ${largo(from)}`;
      if (key === dayKey(ayer)) return `${t("table.yesterday")}, ${largo(from)}`;
      return largo(from);
    }
    return t("table.range", { from: corto(from), to: corto(to) });
  }, [from, to, t]);

  const tableTitle =
    tableTotal == null ? rangeLabel : `${rangeLabel} · ${t("table.punches", { count: tableTotal })}`;

  const updatedAgo = formatAgo("time-clock:status", new Date(tableUpdatedAt).toISOString());

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <TimeClockStatusCard fx={fx} />

      {/* Filtros: píldoras del rango, del reloj y del método. */}
      <PanelCard title={t("filters.title")}>
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITChip
              label={t("presets.today")}
              selected={rangeMode === "today"}
              onClick={() => applyRange("today")}
              color="primary"
              variant="outlined"
              size="sm"
            />
            <ITChip
              label={t("presets.yesterday")}
              selected={rangeMode === "yesterday"}
              onClick={() => applyRange("yesterday")}
              color="primary"
              variant="outlined"
              size="sm"
            />
            <ITChip
              label={t("presets.last7")}
              selected={rangeMode === "last7"}
              onClick={() => applyRange("last7")}
              color="primary"
              variant="outlined"
              size="sm"
            />
            <ITChip
              label={t("presets.custom")}
              selected={rangeMode === "custom"}
              onClick={chooseCustomRange}
              color="primary"
              variant="outlined"
              size="sm"
            />
            <div className="ml-auto w-full sm:w-72">
              <ITInput
                name="checadorEmployee"
                placeholder={t("filters.employeePlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-0"
              />
            </div>
          </ITFlex>

          {rangeMode === "custom" && (
            <div className="w-full sm:w-72">
              <ITDatePicker
                name="checadorDateRange"
                label={t("filters.dateRange")}
                range
                value={dateRange}
                onChange={handleDateRange}
                className="w-full min-w-0"
              />
            </div>
          )}

          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITChip
              label={t("filters.allClocks")}
              selected={!clock}
              onClick={() => setClock("")}
              color="primary"
              variant="outlined"
              size="sm"
            />
            {(status?.devices ?? []).map((d) => (
              <ITChip
                key={d.clockSerial}
                label={d.name}
                selected={clock === d.clockSerial}
                onClick={() => setClock(d.clockSerial)}
                color="primary"
                variant="outlined"
                size="sm"
              />
            ))}
          </ITFlex>

          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITChip
              label={t("filters.allMethods")}
              selected={!method}
              onClick={() => setMethod("")}
              color="primary"
              variant="outlined"
              size="sm"
            />
            {METHODS.map((m) => (
              <ITChip
                key={m}
                label={t(`methods.${m}`)}
                selected={method === m}
                onClick={() => setMethod(m)}
                color="primary"
                variant="outlined"
                size="sm"
              />
            ))}
            <ITButton
              variant="text"
              color="gray"
              size="sm"
              className="ml-auto"
              onClick={clearFilters}
            >
              <ITFlex align="center" gap={1}>
                <FaUndo size={11} />
                <ITText className="font-bold text-[11px]">{t("filters.clear")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </PanelCard>

      {/* Las checadas. */}
      <PanelCard
        title={tableTitle}
        actions={
          updatedAgo && (
            <ITFlex align="center" gap={1}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <ITText className="text-[11px] text-slate-500">
                {t("table.updated", { ago: updatedAgo })}
              </ITText>
            </ITFlex>
          )
        }
      >
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

        <ITFlex align="center" gap={1} className="mt-3">
          <FaLock size={10} className="text-slate-400" />
          <ITText className="text-[10px] font-bold text-slate-400">{t("status.readOnly")}</ITText>
        </ITFlex>
      </PanelCard>

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
