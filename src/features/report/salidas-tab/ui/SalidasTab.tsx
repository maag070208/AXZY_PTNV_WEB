import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaDownload, FaExclamationTriangle, FaTrashAlt } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@shared/utils/dates";
import type { MaterialOutput, MaterialOutputMotivo } from "@entities/salida";
import type { UseSalidasReport } from "../model/useSalidasReport";

const MOTIVO_COLORS: Record<MaterialOutputMotivo, "danger" | "warning" | "gray"> = {
  DANADO: "danger",
  OBSOLETO: "warning",
  EXTRAVIO: "danger",
  OTRO: "gray",
};

export default function SalidasTab({ fx }: { fx: UseSalidasReport }) {
  const { t } = useTranslation(["reports", "salidas", "common"]);
  const { total, error, exporting, reloadKey, handleDownloadPdf, fetchTableData } = fx;

  const columns: Column<MaterialOutput>[] = [
    {
      key: "fecha",
      label: t("salidas.colFecha"),
      type: "date",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
          {formatFecha(r.fecha)}
        </ITText>
      ),
    },
    {
      key: "q",
      label: t("salidas.colDescripcion"),
      type: "string",
      filter: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.descripcion}
          </ITText>
          {(r.marca || r.modelo) && (
            <ITText className="text-[9px] uppercase tracking-widest text-slate-400">
              {[r.marca, r.modelo].filter(Boolean).join(" · ")}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "cantidad",
      label: t("salidas.colCant"),
      type: "number",
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-700">{r.cantidad}</ITText>
      ),
    },
    {
      key: "departamento",
      label: t("salidas.colDepto"),
      type: "string",
      filter: true,
      sortable: true,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">{r.departamento}</ITText>
      ),
    },
    {
      key: "usuario",
      label: t("salidas.colUsuario"),
      type: "string",
      filter: true,
      sortable: true,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.usuario}</ITText>
      ),
    },
    {
      key: "motivo",
      label: t("salidas.colMotivo"),
      type: "string",
      render: (r) =>
        r.motivo ? (
          <ITBadget color={MOTIVO_COLORS[r.motivo]} size="small">
            {t(`salidas:motivo.${r.motivo}`)}
          </ITBadget>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "device",
      label: t("salidas.colDispositivo"),
      type: "string",
      render: (r) =>
        r.device ? (
          <ITText className="text-[11px] font-black text-emerald-700">
            {r.device.controlActivos}
          </ITText>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "observaciones",
      label: t("salidas.colObservaciones"),
      type: "string",
      render: (r) => (
        <ITText className="text-[10px] text-slate-500 max-w-[220px] truncate">
          {r.observaciones ?? "—"}
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
              {t("salidas.statTotal")}
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
          variant="filled"
          color="primary"
          onClick={handleDownloadPdf}
          disabled={exporting || total === 0}
        >
          <ITFlex align="center" gap={1}>
            {exporting ? <FaDownload size={12} /> : <FaTrashAlt size={12} />}
            <ITText className="font-bold text-[11px]">
              {exporting ? t("salidas.exporting") : t("salidas.export")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchTableData}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITFlex>
  );
}
