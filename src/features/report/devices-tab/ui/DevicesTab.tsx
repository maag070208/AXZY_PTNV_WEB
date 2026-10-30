import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { FaExclamationTriangle, FaFilePdf, FaSync, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { Column } from "@axzydev/axzy_ui_system";
import type { DeviceReportRow } from "@entities/report";
import type { UseDevicesReport } from "../model/useDevicesReport";
import { KpiTile } from "@shared/ui/kpi-tile";

export default function DevicesTab({ fx }: { fx: UseDevicesReport }) {
  const navigate = useNavigate();
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

  const STATUS_LABELS: Record<string, string> = {
    ASSIGNED: t("devices.assignedStatus"),
    AVAILABLE: t("devices.availableStatus"),
    DAMAGED: t("devices.damagedStatus"),
    IN_MAINTENANCE: t("devices.maintenanceStatus"),
    RETIRED: t("devices.retirementStatus"),
  };
  const statusLabel = (status: string) => STATUS_LABELS[status] ?? t("devices.otherStatus");

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
      width: 120,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-slate-800">
            {r.assetTag}
          </ITText>
          {r.quantity > 1 && (
            <ITText className="text-[12px] font-semibold text-emerald-600">
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
      width: 270,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.description}
          </ITText>
          <ITText className="text-[12px] text-slate-400">
            {r.type} · {r.brand} {r.model}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "quantity",
      label: t("devices.colQty"),
      type: "number",
      width: 80,
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
      type: "catalog",
      width: 120,
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: Object.entries(STATUS_LABELS).map(([id, name]) => ({ id, name })),
      },
      render: (r) => statusBadge(r.status),
    },
    {
      key: "custodianId",
      label: t("devices.colCustodian"),
      type: "catalog",
      width: 180,
      filter: "search",
      catalogOptions: fx.peopleOptions,
      sortable: false,
      render: (r) =>
        r.status === "ASSIGNED" ? (
          <ITFlex align="center" gap={2}>
            <ProfileAvatar name={r.custodian ?? "—"} size="xs" />
            <ITFlex direction="column" gap={0.5} className="min-w-0">
              <ITText className="truncate text-[11px] text-slate-700">
                {r.custodian ?? "—"}
              </ITText>
              {r.employeeNumber && (
                <ITText className="text-[10px] text-slate-500">
                  No. {r.employeeNumber}
                </ITText>
              )}
            </ITFlex>
          </ITFlex>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "departmentId",
      label: t("devices.colDept"),
      type: "catalog",
      width: 120,
      filter: "search",
      catalogOptions: fx.departmentOptions,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] text-slate-500">
          {r.status === "ASSIGNED" ? r.department ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "daysAssigned",
      label: t("devices.colDays"),
      type: "number",
      width: 110,
      // Número N = asignados hace N días o más.
      filter: true,
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
      width: 120,
      filter: true,
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
      width: 140,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] text-slate-500">{r.area}</ITText>
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
        <div className="min-w-[132px] flex-1">
          <KpiTile size="sm" tone="neutral" label={t("devices.statDevices")} value={stats?.total ?? 0} />
        </div>
        <div className="min-w-[132px] flex-1">
          <KpiTile size="sm" tone="emerald" label={t("devices.availableStat")} value={stats?.available ?? 0} />
        </div>
        <div className="min-w-[132px] flex-1">
          <KpiTile size="sm" tone="amber" label={t("devices.statAssigned")} value={stats?.assigned ?? 0} />
        </div>
        <div className="min-w-[132px] flex-1">
          <KpiTile
            size="sm"
            tone={(stats?.over30 ?? 0) > 0 ? "rose" : "neutral"}
            label={t("devices.statOver30")}
            value={stats?.over30 ?? 0}
          />
        </div>
        <div className="min-w-[132px] flex-1">
          <KpiTile size="sm" tone="neutral" label={t("devices.statRetirements")} value={stats?.retired ?? 0} />
        </div>
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
        onRowClick={(row) => navigate(`/inventory/devices/${(row as unknown as DeviceReportRow).deviceId}`)}
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={50}
        virtualized
        virtualizedMaxHeight={460}
      />
    </ITFlex>
  );
}