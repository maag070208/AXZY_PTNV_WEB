import {
  ITAlert,
  ITBadget,
  ITBentoGauge,
  ITBentoGrid,
  ITBentoTile,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { LuBox, LuFileText, LuHandshake, LuPackageCheck, LuPackageX, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import type { Column } from "@axzydev/axzy_ui_system";
import type { DeviceReportRow } from "@entities/report";
import type { UseDevicesReport } from "../model/useDevicesReport";
import { Num } from "@shared/ui/bento-bits";
import ReportPeriodBar from "../../ui/ReportPeriodBar";

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
      <ReportPeriodBar name="devicesDateRange" dateRange={dateRange} setDateRange={setDateRange} />

      <ITBentoGrid>
        <ITBentoTile
          tone="sea"
          cols={4}
          rows={2}
          icon={<LuBox size={15} />}
          label={t("devices.statDevices")}
          value={<Num value={stats?.total ?? 0} />}
        >
          {(stats?.total ?? 0) > 0 && (
            <div className="relative z-[1] my-1 flex min-h-0 flex-1 items-center justify-center">
              <ITBentoGauge
                value={(stats?.available ?? 0) / (stats?.total ?? 1)}
                color="var(--color-warning)"
                trackColor="rgb(255 255 255 / 0.14)"
                size={150}
              />
            </div>
          )}
        </ITBentoTile>
        <ITBentoTile
          tone="mint"
          cols={2}
          rows={2}
          icon={<LuPackageCheck size={15} />}
          label={t("devices.availableStat")}
          value={<Num value={stats?.available ?? 0} />}
        />
        <ITBentoTile
          tone="lavender"
          cols={2}
          rows={2}
          icon={<LuHandshake size={15} />}
          label={t("devices.statAssigned")}
          value={<Num value={stats?.assigned ?? 0} />}
        />
        <ITBentoTile
          tone={(stats?.over30 ?? 0) > 0 ? "sun" : "plain"}
          cols={2}
          rows={2}
          icon={<LuTriangleAlert size={15} />}
          label={t("devices.statOver30")}
          value={<Num value={stats?.over30 ?? 0} />}
        />
        <ITBentoTile
          cols={2}
          rows={2}
          icon={<LuPackageX size={15} />}
          label={t("devices.statRetirements")}
          value={<Num value={stats?.retired ?? 0} />}
        />
      </ITBentoGrid>

      {error && <ITAlert variant="error">{error}</ITAlert>}

      <ITFlex justify="end" align="center" wrap="wrap" gap={2}>
        <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
          <ITFlex align="center" gap={1}>
            <LuRefreshCw size={13} />
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
            <LuFileText size={14} />
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