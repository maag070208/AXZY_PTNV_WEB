import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaDownload, FaExclamationTriangle, FaSync } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { reportsApi, type AsignadoRow } from "@core/api/reports.api";
import { downloadAsignadosPDF } from "../utils/pdf";

const origenBadgeColor = (origen: AsignadoRow["origen"]) =>
  origen === "CARTA" ? "success" : origen === "MOVIMIENTO" ? "warning" : "gray";

const origenLabel = (origen: AsignadoRow["origen"]) =>
  origen === "CARTA" ? "Carta" : origen === "MOVIMIENTO" ? "Movimiento" : "Desconocido";

export default function AsignadosTab() {
  const [rows, setRows] = useState<AsignadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .asignados()
      .then((res) => setRows(res.data))
      .catch((e: any) => setError(e.message ?? "No se pudo cargar el reporte"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const promedioDias = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(
      rows.reduce((acc, r) => acc + (r.diasAsignado ?? 0), 0) / rows.length
    );
  }, [rows]);

  const masDe30 = useMemo(
    () => rows.filter((r) => (r.diasAsignado ?? 0) > 30).length,
    [rows]
  );

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      await downloadAsignadosPDF(rows);
    } catch (e) {
      console.error("Error al exportar PDF de asignados", e);
    } finally {
      setExporting(false);
    }
  };

  // ITDataTable exige un fetchData asíncrono (page/limit); como el universo
  // de asignados activos es acotado, paginamos en el cliente sobre `rows`.
  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const start = (params.page - 1) * params.limit;
      const page = rows.slice(start, start + params.limit);
      return {
        data: page as unknown as Record<string, unknown>[],
        total: rows.length,
      };
    },
    [rows]
  );

  const columns: Column<AsignadoRow>[] = [
    {
      key: "controlActivos",
      label: "Activo",
      type: "string",
      sortable: false,
      render: (r) => <ITText className="text-[11px] font-black text-slate-800">{r.controlActivos}</ITText>,
    },
    {
      key: "descripcion",
      label: "Descripción",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">{r.descripcion}</ITText>
          <ITText className="text-[9px] uppercase tracking-widest text-slate-400">{r.tipo}</ITText>
        </ITFlex>
      ),
    },
    {
      key: "responsable",
      label: "Responsable",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] text-slate-700">{r.responsable}</ITText>
          {r.numeroEmpleado && (
            <ITText className="text-[9px] text-slate-400">No. {r.numeroEmpleado}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "departamento",
      label: "Depto.",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">{r.departamento ?? "—"}</ITText>
      ),
    },
    {
      key: "folio",
      label: "Folio / Origen",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-emerald-700">{r.folio ?? "—"}</ITText>
          <ITBadget color={origenBadgeColor(r.origen)} size="small">
            {origenLabel(r.origen)}
          </ITBadget>
        </ITFlex>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-700">
          {r.fecha ? new Date(r.fecha).toLocaleDateString("es-MX") : "—"}
        </ITText>
      ),
    },
    {
      key: "diasAsignado",
      label: "Días asignado",
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
            <ITText className="text-[18px] font-black text-slate-800 leading-none">{rows.length}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Asignados
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[140px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-amber-700 leading-none">{promedioDias}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Días promedio
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[140px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-red-600 leading-none">{masDe30}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              +30 días asignado
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
            Cargando…
          </ITText>
        )}
        <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
          <ITFlex align="center" gap={1}>
            <FaSync size={11} />
            <ITText className="font-bold text-[11px]">Actualizar</ITText>
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
              {exporting ? "Exportando..." : "Exportar PDF"}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITFlex>
  );
}
