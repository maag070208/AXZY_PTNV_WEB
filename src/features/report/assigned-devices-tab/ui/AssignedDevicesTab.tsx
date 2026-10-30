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
import type { AssignedDeviceRow } from "@entities/report";
import { formatDate } from "@shared/i18n";
import type { UseAssignedDevicesReport } from "../model/useAssignedDevicesReport";
import { KpiTile } from "@shared/ui/kpi-tile";

export default function AssignedDevicesTab({ fx }: { fx: UseAssignedDevicesReport }) {
  const navigate = useNavigate();
  const {
    t,
    stats,
    error,
    exporting,
    reloadKey,
    setReloadKey,
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

  const sourceBadgeColor = (source: AssignedDeviceRow["source"]) =>
    source === "CUSTODY_LETTER" ? "success" : source === "MOVEMENT" ? "warning" : "gray";

  const sourceLabel = (source: AssignedDeviceRow["source"]) =>
    source === "CUSTODY_LETTER"
      ? t("assigned.sourceCustodyLetter")
      : source === "MOVEMENT"
        ? t("assigned.sourceMovement")
        : t("assigned.unknownSource");

  const columns: Column<AssignedDeviceRow>[] = [
    {
      key: "assetTag",
      label: t("assigned.activeCol"),
      type: "string",
      width: 110,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-800">
          {r.assetTag}
        </ITText>
      ),
    },
    {
      key: "description",
      label: t("assigned.colDescription"),
      type: "string",
      width: 230,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.description}
          </ITText>
          <ITText className="text-[12px] text-slate-400">
            {r.type}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "custodianId",
      label: t("assigned.colCustodian"),
      type: "catalog",
      width: 200,
      filter: "search",
      catalogOptions: fx.peopleOptions,
      sortable: false,
      render: (r) => (
        <ITFlex align="center" gap={2}>
          <ProfileAvatar name={r.custodian ?? "—"} size="xs" />
          <ITFlex direction="column" gap={0.5} className="min-w-0">
            <ITText className="truncate text-[11px] text-slate-700">{r.custodian}</ITText>
            {r.employeeNumber && (
              <ITText className="text-[10px] text-slate-500">
                No. {r.employeeNumber}
              </ITText>
            )}
          </ITFlex>
        </ITFlex>
      ),
    },
    {
      key: "departmentId",
      label: t("assigned.colDept"),
      type: "catalog",
      width: 150,
      filter: "search",
      catalogOptions: fx.departmentOptions,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] text-slate-500">
          {r.department ?? "—"}
        </ITText>
      ),
    },
    {
      key: "folio",
      label: t("assigned.colFolioSource"),
      type: "string",
      width: 170,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-emerald-700">
            {r.folio ?? "—"}
          </ITText>
          <ITBadget color={sourceBadgeColor(r.source)} size="lg">
            {sourceLabel(r.source)}
          </ITBadget>
        </ITFlex>
      ),
    },
    {
      // "loanDate": `date`/`start`/`end` son el rango de la barra (heredado).
      key: "loanDate",
      label: t("assigned.colDate"),
      type: "date",
      width: 170,
      filter: "date-range",
      dateFilterOptions: { maxDate: new Date() },
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-700">
          {r.date ? formatDate(r.date) : "—"}
        </ITText>
      ),
    },
    {
      key: "daysAssigned",
      label: t("assigned.colDays"),
      type: "number",
      width: 120,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITText
          className={`text-[11px] font-black ${(r.daysAssigned ?? 0) > 30 ? "text-red-600" : "text-slate-700"
            }`}
        >
          {r.daysAssigned ?? "—"}
        </ITText>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="end" wrap="wrap" gap={3}>
        <div className="min-w-[240px] max-w-[340px] flex-1">
          <ITDatePicker
            name="assignedDateRange"
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
        <div className="min-w-[140px] flex-1">
          <KpiTile size="sm" tone="sky" label={t("assigned.statAssigned")} value={stats?.assigned ?? 0} />
        </div>
        <div className="min-w-[140px] flex-1">
          <KpiTile size="sm" tone="neutral" label={t("assigned.statAverage")} value={stats?.averageDays ?? 0} />
        </div>
        <div className="min-w-[140px] flex-1">
          <KpiTile
            size="sm"
            tone={(stats?.over30 ?? 0) > 0 ? "rose" : "neutral"}
            label={t("assigned.statOver30")}
            value={stats?.over30 ?? 0}
          />
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
              {t("assigned.refresh")}
            </ITText>
          </ITFlex>
        </ITButton>
        <ITButton
          variant="outlined"
          color="gray"
          onClick={handleDownloadPdf}
          disabled={exporting || (stats?.assigned ?? 0) === 0}
        >
          <ITFlex align="center" gap={1}>
            <FaFilePdf className="text-red-600" size={13} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("assigned.exporting") : t("assigned.export")}
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
        debounceMs={350}
        onRowClick={(row) => navigate(`/inventory/devices/${(row as unknown as AssignedDeviceRow).deviceId}`)}
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