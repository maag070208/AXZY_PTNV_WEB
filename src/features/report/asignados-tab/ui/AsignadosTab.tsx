import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaDownload, FaExclamationTriangle, FaSync } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import type { AsignadoRow } from "@entities/report";
import { formatDate } from "@shared/i18n";
import type { UseAsignadosReport } from "../model/useAsignadosReport";

export default function AsignadosTab({ fx }: { fx: UseAsignadosReport }) {
  const {
    t,
    rows,
    loading,
    error,
    exporting,
    reloadKey,
    setReloadKey,
    promedioDias,
    masDe30,
    handleDownloadPdf,
    fetchTableData,
  } = fx;

  const origenBadgeColor = (origen: AsignadoRow["origen"]) =>
    origen === "CARTA" ? "success" : origen === "MOVIMIENTO" ? "warning" : "gray";

  const origenLabel = (origen: AsignadoRow["origen"]) =>
    origen === "CARTA"
      ? t("asignados.origenCarta")
      : origen === "MOVIMIENTO"
      ? t("asignados.origenMovimiento")
      : t("asignados.origenDesconocido");

  const columns: Column<AsignadoRow>[] = [
    {
      key: "controlActivos",
      label: t("asignados.colActivo"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-800">
          {r.controlActivos}
        </ITText>
      ),
    },
    {
      key: "descripcion",
      label: t("asignados.colDescripcion"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.descripcion}
          </ITText>
          <ITText className="text-[9px] uppercase tracking-widest text-slate-400">
            {r.tipo}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "responsable",
      label: t("asignados.colResponsable"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] text-slate-700">{r.responsable}</ITText>
          {r.numeroEmpleado && (
            <ITText className="text-[9px] text-slate-400">
              No. {r.numeroEmpleado}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "departamento",
      label: t("asignados.colDepto"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {r.departamento ?? "—"}
        </ITText>
      ),
    },
    {
      key: "folio",
      label: t("asignados.colFolioOrigen"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-emerald-700">
            {r.folio ?? "—"}
          </ITText>
          <ITBadget color={origenBadgeColor(r.origen)} size="sm">
            {origenLabel(r.origen)}
          </ITBadget>
        </ITFlex>
      ),
    },
    {
      key: "fecha",
      label: t("asignados.colFecha"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-700">
          {r.fecha ? formatDate(r.fecha) : "—"}
        </ITText>
      ),
    },
    {
      key: "diasAsignado",
      label: t("asignados.colDias"),
      type: "number",
      sortable: false,
      render: (r) => (
        <ITText
          className={`text-[11px] font-black ${
            (r.diasAsignado ?? 0) > 30 ? "text-red-600" : "text-slate-700"
          }`}
        >
          {r.diasAsignado ?? "—"}
        </ITText>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex gap={3} wrap="wrap">
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[140px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-800 leading-none">
              {rows.length}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("asignados.statAsignados")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[140px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-amber-700 leading-none">
              {promedioDias}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("asignados.statPromedio")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[140px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-red-600 leading-none">
              {masDe30}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("asignados.statMas30")}
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
        {loading && (
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("asignados.loading")}
          </ITText>
        )}
        <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
          <ITFlex align="center" gap={1}>
            <FaSync size={11} />
            <ITText className="font-bold text-[11px]">
              {t("asignados.refresh")}
            </ITText>
          </ITFlex>
        </ITButton>
        <ITButton
          variant="filled"
          color="primary"
          onClick={handleDownloadPdf}
          disabled={exporting || rows.length === 0}
        >
          <ITFlex align="center" gap={1}>
            <FaDownload size={12} />
            <ITText className="font-bold text-[11px]">
              {exporting ? t("asignados.exporting") : t("asignados.export")}
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
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITFlex>
  );
}