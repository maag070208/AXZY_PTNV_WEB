import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaFilePdf, FaSync } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import type { DeviceReportRow } from "@entities/report";
import type { UseDevicesReport } from "../model/useDevicesReport";

export default function DevicesTab({ fx }: { fx: UseDevicesReport }) {
  const {
    t,
    rows,
    loading,
    error,
    exporting,
    reloadKey,
    setReloadKey,
    stats,
    handleDownloadPdf,
    fetchTableData,
  } = fx;

  const estadoLabel = (estado: string) =>
    estado === "ASIGNADO"
      ? t("devices.estadoAsignado")
      : estado === "DISPONIBLE"
        ? t("devices.estadoDisponible")
        : estado === "BAJA"
          ? t("devices.estadoBaja")
          : t("devices.estadoOtro");

  const estadoBadge = (estado: string) => (
    <ITBadget
      color={estado === "DISPONIBLE" ? "success" : estado === "ASIGNADO" ? "warning" : "gray"}
      size="lg"
    >
      {estadoLabel(estado)}
    </ITBadget>
  );

  const columns: Column<DeviceReportRow>[] = [
    {
      key: "controlActivos",
      label: t("devices.colActivo"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-black text-slate-800">
            {r.controlActivos}
          </ITText>
          {r.cantidad > 1 && (
            <ITText className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              {t("devices.loteTag", { count: r.cantidad })}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "descripcion",
      label: t("devices.colDescripcion"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">
            {r.descripcion}
          </ITText>
          <ITText className="text-[9px] uppercase tracking-widest text-slate-400">
            {r.tipo} · {r.marca} {r.modelo}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "cantidad",
      label: t("devices.colCant"),
      type: "number",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {r.cantidad}
        </ITText>
      ),
    },
    {
      key: "estado",
      label: t("devices.colEstado"),
      type: "string",
      sortable: false,
      render: (r) => estadoBadge(r.estado),
    },
    {
      key: "responsable",
      label: t("devices.colResponsable"),
      type: "string",
      sortable: false,
      render: (r) =>
        r.estado === "ASIGNADO" ? (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[11px] text-slate-700">
              {r.responsable ?? "—"}
            </ITText>
            {r.numeroEmpleado && (
              <ITText className="text-[9px] text-slate-400">
                No. {r.numeroEmpleado}
              </ITText>
            )}
          </ITFlex>
        ) : (
          <ITText className="text-[10px] text-slate-300">—</ITText>
        ),
    },
    {
      key: "departamento",
      label: t("devices.colDepto"),
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {r.estado === "ASIGNADO" ? r.departamento ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "diasAsignado",
      label: t("devices.colDias"),
      type: "number",
      sortable: false,
      render: (r) => (
        <ITText
          className={`text-[11px] font-black ${r.estado === "ASIGNADO" && (r.diasAsignado ?? 0) > 30
              ? "text-red-600"
              : r.estado === "ASIGNADO"
                ? "text-slate-700"
                : "text-slate-300"
            }`}
        >
          {r.estado === "ASIGNADO" ? r.diasAsignado ?? "—" : "—"}
        </ITText>
      ),
    },
    {
      key: "folio",
      label: t("devices.colFolio"),
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
      label: t("devices.colArea"),
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
            <ITText className="text-[18px] font-black text-slate-800 leading-none">
              {rows.length}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statDispositivos")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-emerald-700 leading-none">
              {stats.disponibles}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statDisponibles")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-amber-700 leading-none">
              {stats.asignados}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statAsignados")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-red-600 leading-none">
              {stats.masDe30}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statMas30")}
            </ITText>
          </ITFlex>
        </ITCard>
        <ITCard className="!p-3 border border-slate-200 flex-1 min-w-[130px]">
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[18px] font-black text-slate-600 leading-none">
              {stats.bajas}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {t("devices.statBajas")}
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
            {t("devices.loading")}
          </ITText>
        )}
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
          disabled={exporting || rows.length === 0}
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
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        size="lg"
      />
    </ITFlex>
  );
}