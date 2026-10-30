import {
  ITAlert,
  ITBadget,
  ITBentoGrid,
  ITBentoSegments,
  ITBentoTile,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { LuClock, LuFileText, LuHandshake, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import type { Column } from "@axzydev/axzy_ui_system";
import type { AssignedDeviceRow } from "@entities/report";
import { formatDate } from "@shared/i18n";
import type { UseAssignedDevicesReport } from "../model/useAssignedDevicesReport";
import { Num } from "@shared/ui/bento-bits";
import { ReportPeriodBar } from "@shared/ui/report-period-bar";

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
      <ReportPeriodBar name="assignedDateRange" dateRange={dateRange} setDateRange={setDateRange} />

      <ITBentoGrid>
        <ITBentoTile
          tone="sea"
          cols={5}
          rows={2}
          icon={<LuHandshake size={15} />}
          label={t("assigned.statAssigned")}
          value={<Num value={stats?.assigned ?? 0} />}
        />
        <ITBentoTile
          cols={3}
          rows={2}
          icon={<LuClock size={15} />}
          label={t("assigned.statAverage")}
          value={<Num value={stats?.averageDays ?? 0} />}
        />
        <ITBentoTile
          tone={(stats?.over30 ?? 0) > 0 ? "sun" : "plain"}
          cols={4}
          rows={2}
          icon={<LuTriangleAlert size={15} />}
          label={t("assigned.statOver30")}
          value={<Num value={stats?.over30 ?? 0} />}
          aside={stats?.assigned ? `/ ${stats.assigned}` : undefined}
        >
          {(stats?.assigned ?? 0) > 0 && (
            <div className="mt-1 max-h-[42px] min-h-0 flex-1">
              <ITBentoSegments total={stats?.assigned ?? 0} done={stats?.over30 ?? 0} color="var(--color-warning)" />
            </div>
          )}
        </ITBentoTile>
      </ITBentoGrid>

      {error && <ITAlert variant="error">{error}</ITAlert>}

      <ITFlex justify="end" align="center" wrap="wrap" gap={2}>
        <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
          <ITFlex align="center" gap={1}>
            <LuRefreshCw size={13} />
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
            <LuFileText size={14} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("assigned.exporting") : t("assigned.export")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable showViewToggle={false}
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