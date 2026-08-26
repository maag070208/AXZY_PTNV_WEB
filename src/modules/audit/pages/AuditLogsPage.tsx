import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDatePicker,
  ITFlex,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaFilter, FaSearch } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import { auditApi, type AuditLog } from "@core/api/audit.api";
import { formatFechaHora } from "@core/store/cartas/types";
import { downloadAuditPDF } from "../utils/pdf";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  MOVEMENT_ENTRADA: { label: "Entrada", color: "success" },
  MOVEMENT_SALIDA: { label: "Salida", color: "warning" },
  MOVEMENT_TRASLADO: { label: "Traslado", color: "info" },
  MOVEMENT_BAJA: { label: "Baja", color: "danger" },
  MOVEMENT_PRESTAMO: { label: "Prestamo", color: "purple" },
  MOVEMENT_DEVOLUCION: { label: "Devolucion", color: "teal" },
  CARTA_CREATED: { label: "Carta Creada", color: "primary" },
  DEVICE_UPDATED: { label: "Dispositivo Actualizado", color: "info" },
};

const localDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((s: RootState) => s.auth.user);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [filterAction, setFilterAction] = useState<string>("");
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditApi.list({
        action: filterAction || undefined,
        start: filterStart || undefined,
        end: filterEnd || undefined,
        page,
        limit,
      });
      setLogs(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterStart, filterEnd, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (action: string) => {
    setFilterAction(action);
    setPage(1);
  };

  const handleDateRangeChange = (range: [Date | null, Date | null]) => {
    setDateRange(range);
    setFilterStart(range[0] ? localDateString(range[0]) : "");
    setFilterEnd(range[1] ? localDateString(range[1]) : "");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const [exporting, setExporting] = useState(false);

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      const res = await auditApi.list({
        action: filterAction || undefined,
        start: filterStart || undefined,
        end: filterEnd || undefined,
        limit: 500,
      });
      await downloadAuditPDF(res.data, {
        action: filterAction || undefined,
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
    } catch (e) {
      console.error("Error al exportar PDF", e);
    } finally {
      setExporting(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <ITPage title="Auditoria" loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title="Auditoria"
      description={`${total} registro(s)`}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Auditoria" },
      ]}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-4 mb-6">
        <ITStack direction="column" spacing={3}>
          <ITFlex align="center" gap={2}>
            <FaFilter size={14} className="text-slate-400" />
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Filtros
            </ITText>
          </ITFlex>
          <ITFlex gap={3} wrap="wrap">
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[9px] text-slate-400 uppercase">Tipo de Accion</ITText>
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={filterAction}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(ACTION_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[9px] text-slate-400 uppercase">Rango de fechas</ITText>
              <ITDatePicker
                name="dateRange"
                range={true}
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as [Date | null, Date | null])}
                placeholder="Fecha inicio - Fecha fin"
              />
            </ITFlex>
            <ITFlex align="end" gap={2}>
              <ITButton
                variant="filled"
                color="primary"
                onClick={handleDownloadPdf}
                disabled={exporting}
              >
                <ITFlex align="center" gap={1}>
                  <FaFilePdf size={12} />
                  <ITText className="font-bold text-[11px]">
                    {exporting ? "Exportando..." : "Exportar PDF"}
                  </ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITStack>
      </ITCard>

      {logs.length === 0 ? (
        <ITCard className="p-8 text-center">
          <ITText className="text-slate-500 text-sm">No hay registros de auditoria</ITText>
        </ITCard>
      ) : (
        <>
          <div className="space-y-0">
            {[...logs].map((log, idx) => {
              const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "default" };
              return (
                <div key={log.id} className="flex gap-3 relative">
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${actionInfo.color}-500 text-white z-10 ring-2 ring-white`}>
                      <FaSearch size={10} />
                    </div>
                    {idx < logs.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
                  </div>

                  <div className={`pb-6 flex-1 min-w-0`}>
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                      <ITFlex align="center" justify="between" className="mb-2">
                        <ITFlex align="center" gap={2}>
                          <ITBadget color={actionInfo.color as any} size="small">
                            {actionInfo.label}
                          </ITBadget>
                          <ITText className="text-[11px] font-bold text-slate-700">
                            {log.deviceCode ?? "—"}
                          </ITText>
                        </ITFlex>
                        <ITText className="text-[9px] text-slate-400">
                          {formatFechaHora(log.createdAt)}
                        </ITText>
                      </ITFlex>

                      <ITStack direction="row" spacing={4}>
                        <ITText className="text-[10px] text-slate-500">
                          <strong>Usuario:</strong> {log.userName ?? "—"}
                        </ITText>
                        <ITText className="text-[10px] text-slate-500">
                          <strong>Entidad:</strong> {log.entityType}
                        </ITText>
                      </ITStack>

                      {log.newState && (
                        <ITCard className="p-3 bg-slate-50 rounded-lg mt-2">
                          <ITText className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">
                            Detalles
                          </ITText>
                          {log.newState.tipo && (
                            <ITText className="text-[10px] text-slate-600">
                              Tipo: {log.newState.tipo}
                            </ITText>
                          )}
                          {log.newState.estado && (
                            <ITText className="text-[10px] text-slate-600">
                              Estado: {log.newState.estado}
                            </ITText>
                          )}
                          {log.newState.condicion && (
                            <ITText className="text-[10px] text-slate-600">
                              Condicion: {log.newState.condicion}
                            </ITText>
                          )}
                          {log.newState.consecutive && (
                            <ITText className="text-[10px] text-slate-600">
                              Carta: {log.newState.consecutive}
                            </ITText>
                          )}
                          {log.metadata?.notas && (
                            <ITText className="text-[10px] text-slate-600 italic">
                              Notas: {log.metadata.notas}
                            </ITText>
                          )}
                        </ITCard>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <ITFlex justify="center" gap={2} className="mt-6">
              <ITButton
                variant="outlined"
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </ITButton>
              <ITText className="text-[11px] text-slate-500">
                Pagina {page} de {totalPages}
              </ITText>
              <ITButton
                variant="outlined"
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </ITButton>
            </ITFlex>
          )}
        </>
      )}

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}
