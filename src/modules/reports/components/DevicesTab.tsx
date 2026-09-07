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
import { reportsApi, type DeviceReportRow } from "@core/api/reports.api";
import { downloadDevicesPDF } from "../utils/pdf";

const estadoBadge = (estado: string) => (
  <ITBadget
    color={estado === "DISPONIBLE" ? "success" : estado === "ASIGNADO" ? "warning" : "gray"}
    size="small"
  >
    {estado}
  </ITBadget>
);

export default function DevicesTab() {
  const [rows, setRows] = useState<DeviceReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .devices()
      .then((res) => setRows(res.data))
      .catch((e: any) => setError(e.message ?? "No se pudo cargar el reporte"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      await downloadDevicesPDF(rows);
    } catch (e) {
      console.error("Error al exportar PDF de dispositivos", e);
    } finally {
      setExporting(false);
    }
  };

  const stats = useMemo(() => {
    const prestados = rows.filter((r) => r.estado === "ASIGNADO").length;
    const disponibles = rows.filter((r) => r.estado === "DISPONIBLE").length;
    const bajas = rows.filter((r) => r.estado === "BAJA").length;
    const masDe30 = rows.filter((r) => (r.diasPrestado ?? 0) > 30).length;
    return { prestados, disponibles, bajas, masDe30 };
  }, [rows]);

  // ITDataTable exige fetchData asíncrono (page/limit); el universo de
  // dispositivos es acotado, así que paginamos en el cliente sobre `rows`.
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

  const columns: Column<DeviceReportRow>[] = [
    {
      key: "controlActivos",
      label: "Activo",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-slate-800">{r.controlActivos}</ITText>
          {r.cantidad > 1 && (
            <ITText className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              Lote ×{r.cantidad}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "descripcion",
      label: "Descripción",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">{r.descripcion}</ITText>
          <ITText className="text-[9px] uppercase tracking-widest text-slate-400">
            {r.tipo} · {r.marca} {r.modelo}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "cantidad",
      label: "Cant.",
      type: "number",
      sortable: false,
      render: (r) => <ITText className="text-[11px] font-black text-slate-700">{r.cantidad}</ITText>,
    },
    {
      key: "estado",
      label: "Estado",
      type: "string",
      sortable: false,
      render: (r) => estadoBadge(r.estado),
    },
    {
      key: "responsable",
      label: "Responsable",
      type: "string",
      sortable: false,
      render: (r) =>
        r.estado === "ASIGNADO" ? (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[11px] text-slate-700">{r.responsable ?? "—"}</ITText>
            {r.numeroEmpleado && (
              <ITText className="text-[9px] text-slate-400">No. {r.numeroEmpleado}</ITText>
            )}
          </ITFlex>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "departamento",
      label: "Depto.",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {r.estado === "ASIGNADO" ? r.departamento ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "diasPrestado",
      label: "Días prestado",
      type: "number",
      sortable: false,
      render: (r) => (
        <ITText
          className={`text-[11px] font-black ${
            r.estado === "ASIGNADO" && (r.diasPrestado ?? 0) > 30
              ? "text-red-600"
              : r.estado === "ASIGNADO"
              ? "text-slate-700"
              : "text-slate-300"
          }`}
        >
          {r.estado === "ASIGNADO" ? r.diasPrestado ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "folio",
      label: "Folio",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-emerald-700">
          {r.estado === "ASIGNADO" ? r.folio ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "area",
      label: "Área",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">{r.area}</ITText>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex gap={3} wrap="wrap">
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-800 leading-none">{rows.length}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Dispositivos
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-emerald-700 leading-none">{stats.disponibles}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Disponibles
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-amber-700 leading-none">{stats.prestados}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Prestados
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-red-600 leading-none">{stats.masDe30}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              +30 días prestado
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-600 leading-none">{stats.bajas}</ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Baja
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