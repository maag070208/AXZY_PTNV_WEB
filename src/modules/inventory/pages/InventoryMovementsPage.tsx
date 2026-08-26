import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaCheckCircle, FaFilePdf, FaHandshake, FaMinusCircle, FaMapMarkerAlt, FaPlus, FaReply, FaTimesCircle } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import { inventoryApi, type InventoryMovement, type MovementType, type CondicionType } from "@core/api/inventory.api";
import { locationsApi } from "@core/api/locations.api";
import { type Location } from "@core/api/devices.api";
import { formatFechaHora } from "@core/store/cartas/types";
import { downloadInventoryPDF } from "../utils/pdf";

const TIPO_ICONS: Record<MovementType, React.ReactNode> = {
  ENTRADA: <FaArrowDown size={10} />,
  SALIDA: <FaArrowUp size={10} />,
  TRASLADO: <FaArrowRight size={10} />,
  BAJA: <FaTimesCircle size={10} />,
  PRESTAMO: <FaHandshake size={10} />,
  DEVOLUCION: <FaReply size={10} />,
};

const TIPO_COLORS: Record<MovementType, string> = {
  ENTRADA: "bg-emerald-500",
  SALIDA: "bg-amber-500",
  TRASLADO: "bg-blue-500",
  BAJA: "bg-red-500",
  PRESTAMO: "bg-purple-500",
  DEVOLUCION: "bg-teal-500",
};

const TIPO_LABELS: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  TRASLADO: "Traslado",
  BAJA: "Baja",
  PRESTAMO: "Préstamo",
  DEVOLUCION: "Devolución",
};

const CONDICION_COLORS: Record<CondicionType, "success" | "warning" | "danger"> = {
  BUENO: "success",
  ACEPTABLE: "warning",
  MALO: "danger",
  ROTO: "danger",
};

const CONDICION_LABELS: Record<CondicionType, string> = {
  BUENO: "Bueno",
  ACEPTABLE: "Aceptable",
  MALO: "Malo",
  ROTO: "Roto",
};

const formatLocation = (loc?: Location | null): string => {
  if (!loc) return "Sin ubicación";
  const parts = [loc.lugar, loc.subLugar, loc.numero].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : "Ubicación";
};

const localDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function InventoryMovementsPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const fetchMovements = useCallback(async () => {
    try {
      const data = await inventoryApi.listMovements({
        locationId: filterLocation || undefined,
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
      setMovements(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterLocation, filterStart, filterEnd]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await locationsApi.list();
      setLocations(data);
    } catch (e: any) {
      console.error("Error fetching locations", e);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      await downloadInventoryPDF(movements, locations);
      setToast({ message: "PDF descargado", type: "success" });
    } catch (e: any) {
      setToast({ message: "Error al generar PDF", type: "error" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <ITPage title="Movimientos" loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title="Kardex"
      description={`${movements.length} movimiento(s)`}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Inventario", onClick: () => navigate("/inventario") },
        { label: "Movimientos" },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF || movements.length === 0}
          >
            <ITFlex align="center" gap={1}>
              <FaFilePdf size={12} />
              <ITText className="font-bold text-[11px]">
                {downloadingPDF ? "Generando..." : "PDF"}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/inventario/nuevo-movimiento")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo movimiento</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-4 mb-6">
        <ITStack direction="column" spacing={3}>
          <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Filtros
          </ITText>
          <ITFlex gap={3} wrap="wrap">
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[9px] text-slate-400 uppercase">Ubicación</ITText>
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="">Todas</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{formatLocation(l)}</option>
                ))}
              </select>
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[9px] text-slate-400 uppercase">Rango de fechas</ITText>
              <ITDatePicker
                name="dateRange"
                range={true}
                value={dateRange}
                onChange={(e) => {
                  const range = e.target.value as [Date | null, Date | null];
                  setDateRange(range);
                  setFilterStart(range[0] ? localDateString(range[0]) : "");
                  setFilterEnd(range[1] ? localDateString(range[1]) : "");
                }}
                placeholder="Fecha inicio - Fecha fin"
              />
            </ITFlex>
          </ITFlex>
        </ITStack>
      </ITCard>

      {movements.length === 0 ? (
        <ITCard className="p-8 text-center">
          <FaMapMarkerAlt size={40} className="mx-auto text-slate-300 mb-3" />
          <ITText className="text-slate-500 text-sm">No hay movimientos registrados</ITText>
        </ITCard>
      ) : (
        <div className="space-y-0">
          {movements.map((m, idx) => {
            const isLast = idx === movements.length - 1;
            return (
              <div key={m.id} className="flex gap-3 relative">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${TIPO_COLORS[m.tipo]} text-white z-10 ring-2 ring-white`}>
                    {TIPO_ICONS[m.tipo]}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-slate-200" />}
                </div>

                <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <ITFlex align="center" justify="between" className="mb-2">
                      <ITFlex align="center" gap={2}>
                        <ITBadget color={m.tipo === "ENTRADA" ? "success" : m.tipo === "SALIDA" ? "warning" : m.tipo === "BAJA" ? "danger" : "info"} size="small">
                          {TIPO_LABELS[m.tipo]}
                        </ITBadget>
                        {m.condicion && (
                          <ITBadget color={CONDICION_COLORS[m.condicion]} size="small">
                            Condición: {CONDICION_LABELS[m.condicion]}
                          </ITBadget>
                        )}
                        {m.motivoBaja && (
                          <ITText className="text-[10px] text-red-500">
                            {m.motivoBaja}
                          </ITText>
                        )}
                        <ITText className="text-[11px] font-bold text-slate-700">
                          {m.device?.controlActivos ?? "—"}
                        </ITText>
                        <ITText className="text-[10px] text-slate-400">
                          {m.device?.descripcion}
                        </ITText>
                      </ITFlex>
                      <ITText className="text-[9px] text-slate-400">
                        {formatFechaHora(m.createdAt)}
                      </ITText>
                    </ITFlex>

                    <ITStack direction="row" spacing={4}>
                      <ITFlex align="center" gap={1}>
                        <FaMapMarkerAlt size={10} className="text-slate-400" />
                        <ITText className="text-[10px] text-slate-500">
                          {m.location ? formatLocation(m.location) : "—"}
                        </ITText>
                      </ITFlex>
                      <ITText className="text-[9px] text-slate-400">
                        Por: {m.user?.name ?? "—"}
                      </ITText>
                    </ITStack>

                    {m.notas && (
                      <ITText className="text-[10px] text-slate-500 italic mt-2 block">
                        "{m.notas}"
                      </ITText>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
