import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
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
import { FaCloudDownloadAlt, FaFileCsv, FaUndo } from "react-icons/fa";
import type { TimeClockPunch, PunchMethod } from "@entities/time-clock";
import { formatDateTime } from "@shared/utils/dates";
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

interface Props {
  fx: UseTimeClock;
  /** Solo para quien puede administrar los relojes (ADMIN). */
  onManageClocks?: () => void;
}

export default function TimeClockTab({ fx, onManageClocks }: Props) {
  const {
    t,
    dateRange,
    setDateRange,
    q,
    setQ,
    method,
    setMethod,
    clock,
    setClock,
    applyRange,
    clearFilters,
    externalFilters,
    fetchTableData,
    reloadKey,
    status,
    importing,
    starting,
    handleImportRange,
    exporting,
    handleExportCsv,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const methodOptions = useMemo(
    () => [
      { value: "", label: t("filters.allMethods") },
      ...METHODS.map((m) => ({ value: m, label: t(`methods.${m}`) })),
    ],
    [t]
  );

  const clockOptions = useMemo(
    () => [
      { value: "", label: t("filters.allClocks") },
      ...(status?.devices ?? []).map((d) => ({ value: d.clockSerial, label: d.name })),
    ],
    [status?.devices, t]
  );

  const columns = useMemo<Column<TimeClockPunch>[]>(
    () => [
      {
        key: "occurredAt",
        label: t("columns.occurredAt"),
        type: "date",
        width: 160,
        sortable: true,
        render: (c) => (
          <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
            {formatDateTime(c.occurredAt)}
          </ITText>
        ),
      },
      {
        key: "name",
        label: t("columns.employee"),
        type: "string",
        width: 300,
        sortable: true,
        render: (c) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800">{c.name || "—"}</ITText>
            <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              #{c.employeeNumber}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "method",
        label: t("columns.method"),
        type: "string",
        width: 140,
        sortable: true,
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
        type: "string",
        width: 200,
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
        render: (c) => (
          <ITText className="text-[10px] font-bold text-slate-400">{c.serialNo}</ITText>
        ),
      },
    ],
    [t]
  );

  const handleDateRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value)) setDateRange(value);
  };

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <TimeClockStatusCard fx={fx} onManageClocks={onManageClocks} />

      {/* Filtros */}
      <ITCard title={t("filters.title")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("presets.title")}
            </ITText>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("today")}>
              {t("presets.today")}
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("yesterday")}>
              {t("presets.yesterday")}
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("last7")}>
              {t("presets.last7")}
            </ITButton>
            <ITFlex align="center" gap={2} className="ml-auto">
              <span title={t("import.hint")}>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="sm"
                  onClick={handleImportRange}
                  disabled={importing || starting || !dateRange[0] || !status?.configured}
                >
                  <ITFlex align="center" gap={1}>
                    <FaCloudDownloadAlt size={13} />
                    <ITText className="font-bold text-[11px]">
                      {importing ? t("import.running") : t("import.button")}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </span>
              <ITButton variant="outlined" color="gray" size="sm" onClick={() => void handleExportCsv()} disabled={exporting}>
                <ITFlex align="center" gap={1}>
                  <FaFileCsv className="text-emerald-600" size={13} />
                  <ITText className="font-bold text-[11px]">
                    {exporting ? t("actions.exporting") : t("actions.exportCsv")}
                  </ITText>
                </ITFlex>
              </ITButton>
              <ITButton variant="text" color="gray" size="sm" onClick={clearFilters}>
                <ITFlex align="center" gap={1}>
                  <FaUndo size={11} />
                  <ITText className="font-bold text-[11px]">{t("filters.clear")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={3}>
              <ITDatePicker
                name="checadorDateRange"
                label={t("filters.dateRange")}
                range
                value={dateRange}
                onChange={handleDateRange}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITInput
                name="checadorEmployee"
                label={t("filters.employee")}
                placeholder={t("filters.employeePlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITSearchSelect
                name="timeClock"
                label={t("filters.clock")}
                options={clockOptions}
                value={clock}
                onChange={(value) => setClock(String(value))}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITSearchSelect
                name="checadorMetodo"
                label={t("filters.method")}
                options={methodOptions}
                value={method}
                onChange={(value) => setMethod(String(value) as PunchMethod | "")}
                className="w-full min-w-0"
              />
            </ITGrid>
          </ITGrid>
        </ITFlex>
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
