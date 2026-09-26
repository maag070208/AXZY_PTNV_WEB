import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaFilePdf, FaSync, FaUndo } from "react-icons/fa";
import { useMemo } from "react";
import type { Column } from "@axzydev/axzy_ui_system";
import type { DeviceReportRow, DeviceReportStatus } from "@entities/report";
import type { UseDevicesReport } from "../model/useDevicesReport";

/** Estados del catálogo, en el vocabulario que ve el usuario. */
const STATUS_OPTIONS: DeviceReportStatus[] = [
  "AVAILABLE",
  "ASSIGNED",
  "DAMAGED",
  "IN_MAINTENANCE",
  "RETIRED",
];

export default function DevicesTab({ fx }: { fx: UseDevicesReport }) {
  const {
    t,
    error,
    exporting,
    reloadKey,
    setReloadKey,
    stats,
    dateRange,
    setDateRange,
    externalFilters,
    tableKey,
    handleDownloadPdf,
    fetchTableData,
  } = fx;

  const handleDateRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value)) setDateRange(value);
  };

  const statusLabel = (status: string) =>
    status === "ASSIGNED"
      ? t("devices.assignedStatus")
      : status === "AVAILABLE"
        ? t("devices.availableStatus")
        : status === "RETIRED"
          ? t("devices.retirementStatus")
          : t("devices.otherStatus");

  const statusBadge = (status: string) => (
    <ITBadget
      color={status === "AVAILABLE" ? "success" : status === "ASSIGNED" ? "warning" : "gray"}
      size="lg"
    >
      {statusLabel(status)}
    </ITBadget>
  );

  const columns: Column<DeviceReportRow>[] = [
    {
      key: "assetTag",
      label: t("devices.activeCol"),
      type: "string",
      width: 160,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-slate-800">
            {r.assetTag}
          </ITText>
          {r.quantity > 1 && (
            <ITText className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              {t("devices.batchTag", { count: r.quantity })}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "description",
      label: t("devices.colDescription"),
      type: "string",
      width: 300,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.description}
          </ITText>
          <ITText className="text-[9px] uppercase tracking-widest text-slate-400">
            {r.type} · {r.brand} {r.model}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "quantity",
      label: t("devices.colQty"),
      type: "number",
      width: 90,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {r.quantity}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("devices.colStatus"),
      type: "string",
      width: 140,
      sortable: false,
      render: (r) => statusBadge(r.status),
    },
    {
      key: "custodian",
      label: t("devices.colCustodian"),
      type: "string",
      width: 240,
      sortable: false,
      render: (r) =>
        r.status === "ASSIGNED" ? (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[11px] text-slate-700">
              {r.custodian ?? "—"}
            </ITText>
            {r.employeeNumber && (
              <ITText className="text-[9px] text-slate-400">
                No. {r.employeeNumber}
              </ITText>
            )}
          </ITFlex>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "department",
      label: t("devices.colDept"),
      type: "string",
      width: 200,
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {r.status === "ASSIGNED" ? r.department ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "daysAssigned",
      label: t("devices.colDays"),
      type: "number",
      width: 110,
      sortable: false,
      render: (r) => (
        <ITText
          className={`text-[11px] font-black ${r.status === "ASSIGNED" && (r.daysAssigned ?? 0) > 30
              ? "text-red-600"
              : r.status === "ASSIGNED"
                ? "text-slate-700"
                : "text-slate-300"
            }`}
        >
          {r.status === "ASSIGNED" ? r.daysAssigned ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "folio",
      label: t("devices.colFolio"),
      type: "string",
      width: 150,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-emerald-700">
          {r.status === "ASSIGNED" ? r.folio ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "area",
      label: t("devices.colArea"),
      type: "string",
      width: 160,
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">{r.area}</ITText>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="end" wrap="wrap" gap={3}>
        <div className="min-w-[240px] max-w-[340px] flex-1">
          <ITDatePicker
            name="devicesDateRange"
            label={t("filters.dateRange")}
            range
            value={dateRange}
            onChange={handleDateRange}
            className="w-full min-w-0"
          />
        </div>
        <ITButton
          variant="text"
          color="gray"
          size="sm"
          onClick={() => setDateRange([null, null])}
          disabled={!dateRange[0] && !dateRange[1]}
        >
          <ITFlex align="center" gap={1}>
            <FaUndo size={11} />
            <ITText className="font-bold text-[11px]">{t("filters.clear")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITFlex gap={3} wrap="wrap">
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-800 leading-none">
              {stats?.total ?? 0}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statDevices")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-emerald-700 leading-none">
              {stats?.available ?? 0}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.availableStat")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-amber-700 leading-none">
              {stats?.assigned ?? 0}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statAssigned")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-red-600 leading-none">
              {stats?.over30 ?? 0}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statOver30")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-600 leading-none">
              {stats?.retired ?? 0}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statRetirements")}
            </ITText>
          </ITFlex>
        </ITCard>
      </ITFlex>

      {error && (
        <ITFlex align="center" gap={2} className="text-red-600">
          <FaExclamationTriangle size={12} />
          <ITText className="text-[11px] font-bold">{error}</ITText>
        </ITFlex>
      )}

      <ITFlex justify="end" align="center" wrap="wrap" gap={2}>
        <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
          <ITFlex align="center" gap={1}>
            <FaSync size={11} />
            <ITText className="font-bold text-[11px]">
              {t("devices.refresh")}
            </ITText>
          </ITFlex>
        </ITButton>
        <ITButton
          variant="outlined"
          color="primary"
          onClick={handleDownloadPdf}
          disabled={exporting || (stats?.total ?? 0) === 0}
        >
          <ITFlex align="center" gap={1}>
            <FaFilePdf className="text-red-600" size={13} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("devices.exporting") : t("devices.export")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        key={tableKey}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: Parameters<typeof fetchTableData>[0]
          ) => Promise<{
            data: Record<string, unknown>[];
            total: number;
          }>
        }
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        size="lg"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
      />
    </ITFlex>
  );
}