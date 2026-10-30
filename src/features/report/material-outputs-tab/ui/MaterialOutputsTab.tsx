import {
  ITAlert,
  ITBadget,
  ITBentoGrid,
  ITBentoTile,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { LuFileText, LuTrash2 } from "react-icons/lu";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import type { MaterialOutput, MaterialOutputReason } from "@entities/material-output";
import type { UseMaterialOutputsReport } from "../model/useMaterialOutputsReport";
import { Num } from "@shared/ui/bento-bits";
import { ReportPeriodBar } from "@shared/ui/report-period-bar";

const REASON_COLORS: Record<MaterialOutputReason, "danger" | "warning" | "gray"> = {
  DAMAGED: "danger",
  OBSOLETE: "warning",
  LOST: "danger",
  OTHER: "gray",
};

export default function MaterialOutputsTab({ fx }: { fx: UseMaterialOutputsReport }) {
  const { t } = useTranslation(["reports", "material-outputs", "common"]);
  const {
    total,
    error,
    exporting,
    reloadKey,
    dateRange,
    setDateRange,
    externalFilters,
    handleDownloadPdf,
    fetchTableData,
  } = fx;

  const columns: Column<MaterialOutput>[] = [
    {
      key: "date",
      label: t("exits.colDate"),
      type: "date",
      width: 190,
      filter: "date-range",
      dateFilterOptions: { maxDate: new Date() },
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
          {formatDate(r.date)}
        </ITText>
      ),
    },
    {
      key: "q",
      label: t("exits.colDescription"),
      type: "string",
      width: 300,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.description}
          </ITText>
          {(r.brand || r.model) && (
            <ITText className="text-[12px] text-slate-400">
              {[r.brand, r.model].filter(Boolean).join(" · ")}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "quantity",
      label: t("exits.colQty"),
      type: "number",
      width: 90,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-700">{r.quantity}</ITText>
      ),
    },
    {
      key: "departmentName",
      label: t("exits.colDept"),
      type: "catalog",
      width: 200,
      filter: "search",
      catalogOptions: fx.departmentOptions,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] text-slate-500">{r.departmentName}</ITText>
      ),
    },
    {
      key: "userName",
      label: t("exits.colUser"),
      type: "catalog",
      width: 240,
      filter: "search",
      catalogOptions: fx.userOptions,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.userName}</ITText>
      ),
    },
    {
      key: "reason",
      label: t("exits.colReason"),
      type: "catalog",
      width: 140,
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: (Object.keys(REASON_COLORS) as MaterialOutputReason[]).map((id) => ({
          id,
          name: t(`material-outputs:reason.${id}`),
        })),
      },
      render: (r) =>
        r.reason ? (
          <ITBadget color={REASON_COLORS[r.reason]} size="lg">
            {t(`material-outputs:reason.${r.reason}`)}
          </ITBadget>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "device",
      label: t("exits.colDevice"),
      type: "string",
      width: 150,
      filter: true,
      sortable: false,
      render: (r) =>
        r.deviceUnit ? (
          <ITText className="text-[11px] font-black text-emerald-700">
            {r.deviceUnit.assetTag}
          </ITText>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "notes",
      label: t("exits.colNotes"),
      type: "string",
      width: 260,
      filter: true,
      render: (r) => (
        <ITText className="text-[10px] text-slate-500 max-w-[220px] truncate">
          {r.notes ?? "—"}
        </ITText>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ReportPeriodBar name="exitsDateRange" dateRange={dateRange} setDateRange={setDateRange} />

      <ITBentoGrid>
        <ITBentoTile
          tone="sea"
          cols={4}
          rows={2}
          icon={<LuTrash2 size={15} />}
          label={t("exits.statTotal")}
          value={<Num value={total} />}
        />
      </ITBentoGrid>

      {error && <ITAlert variant="error">{error}</ITAlert>}

      <ITFlex justify="end" align="center" wrap="wrap" gap={2}>
        <ITButton
          variant="outlined"
          color="primary"
          onClick={handleDownloadPdf}
          disabled={exporting || total === 0}
        >
          <ITFlex align="center" gap={1}>
            <LuFileText size={14} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("exits.exporting") : t("exits.export")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchTableData}
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        size="lg"
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
