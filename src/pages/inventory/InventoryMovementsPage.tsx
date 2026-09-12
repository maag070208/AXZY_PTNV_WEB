import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITToast,
  ITDatePicker,
} from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaFilePdf, FaHandshake, FaMapMarkerAlt, FaPlus, FaReply, FaTimesCircle } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { inventoryApi, type InventoryMovement, type MovementType, type CondicionType } from "@entities/inventory-movement";
import { locationsApi, type Location, formatLocation } from "@entities/location";
import { formatFechaHora } from "@core/utils/dates";
import { downloadInventoryPDF } from "@widgets/inventory/inventory-pdf";

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

const CONDICION_COLORS: Record<CondicionType, "success" | "warning" | "danger"> = {
  BUENO: "success",
  ACEPTABLE: "warning",
  MALO: "danger",
  ROTO: "danger",
};

const localDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function InventoryMovementsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);

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
      setToast({ message: t("messages.pdfDownloaded"), type: "success" });
    } catch (e: any) {
      setToast({ message: t("messages.pdfError"), type: "error" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("movements.loadingTitle")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("movements.title")}
      description={t("movements.description", { count: movements.length })}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("index.title"), onClick: () => navigate("/inventario") },
        { label: t("movements.loadingTitle") },
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
                {downloadingPDF ? t("movements.generating") : t("movements.pdf")}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/inventario/nuevo-movimiento")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("index.newMovement")}</ITText>
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
            {t("movements.filters")}
          </ITText>
          <ITFlex gap={3} wrap="wrap">
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[9px] text-slate-400 uppercase">{t("movements.location")}</ITText>
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="">{t("movements.all")}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{formatLocation(l)}</option>
                ))}
              </select>
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[9px] text-slate-400 uppercase">{t("movements.dateRange")}</ITText>
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
                placeholder={t("movements.datePlaceholder")}
              />
            </ITFlex>
          </ITFlex>
        </ITStack>
      </ITCard>

      {movements.length === 0 ? (
        <ITCard className="p-8 text-center">
          <FaMapMarkerAlt size={40} className="mx-auto text-slate-300 mb-3" />
          <ITText className="text-slate-500 text-sm">{t("movements.noMovements")}</ITText>
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
                          {t(`typeLabels.${m.tipo}`)}
                        </ITBadget>
                        {m.condicion && (
                          <ITBadget color={CONDICION_COLORS[m.condicion]} size="small">
                            {t("movements.condition", { label: t(`conditionLabels.${m.condicion}`) })}
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
                        {t("movements.by", { name: m.user?.name ?? "—" })}
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