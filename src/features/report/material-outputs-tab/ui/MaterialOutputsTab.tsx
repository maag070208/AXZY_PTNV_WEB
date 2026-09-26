import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaFilePdf } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import type { MaterialOutput, MaterialOutputReason } from "@entities/material-output";
import type { UseMaterialOutputsReport } from "../model/useMaterialOutputsReport";

const REASON_COLORS: Record<MaterialOutputReason, "danger" | "warning" | "gray"> = {
  DAMAGED: "danger",
  OBSOLETE: "warning",
  LOST: "danger",
  OTHER: "gray",
};

export default function MaterialOutputsTab({ fx }: { fx: UseMaterialOutputsReport }) {
  const { t } = useTranslation(["reports", "material-outputs", "common"]);
  const { total, error, exporting, reloadKey, handleDownloadPdf, fetchTableData } = fx;

  const columns: Column<MaterialOutput>[] = [
    {
      key: "date",
      label: t("exits.colDate"),
      type: "date",
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
      filter: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.description}
          </ITText>
          {(r.brand || r.model) && (
            <ITText className="text-[9px] uppercase tracking-widest text-slate-400">
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
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-700">{r.quantity}</ITText>
      ),
    },
    {
      key: "departmentName",
      label: t("exits.colDept"),
      type: "string",
      filter: true,
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">{r.departmentName}</ITText>
      ),
    },
    {
      key: "userName",
      label: t("exits.colUser"),
      type: "string",
      filter: true,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.userName}</ITText>
      ),
    },
    {
      key: "reason",
      label: t("exits.colReason"),
      type: "string",
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
      render: (r) =>
        r.device ? (
          <ITText className="text-[11px] font-black text-emerald-700">
            {r.device.assetTag}
          </ITText>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "notes",
      label: t("exits.colNotes"),
      type: "string",
      render: (r) => (
        <ITText className="text-[10px] text-slate-500 max-w-[220px] truncate">
          {r.notes ?? "—"}
        </ITText>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex gap={3} wrap="wrap">
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-800 leading-none">
              {total}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("exits.statTotal")}
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
        <ITButton
          variant="outlined"
          color="primary"
          onClick={handleDownloadPdf}
          disabled={exporting || total === 0}
        >
          <ITFlex align="center" gap={1}>
            <FaFilePdf className="text-red-600" size={13} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("exits.exporting") : t("exits.export")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchTableData}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[50, 100, 150]}
        size="lg"
      />
    </ITFlex>
  );
}
