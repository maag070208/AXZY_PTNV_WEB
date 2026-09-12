import {
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaBoxOpen, FaFilePdf, FaMapMarkerAlt, FaPlus, FaBoxes, FaWarehouse } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@core/store/store";
import { inventoryApi, type InventorySummary } from "@entities/inventory-movement";
import { locationsApi, type Location, formatLocation } from "@entities/location";
import { deviceApi as devicesApi, type Device } from "@entities/device";
import { downloadInventoryPDF } from "@widgets/inventory/inventory-pdf";

export default function InventoryIndexPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [unlocatedDevices, setUnlocatedDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, locRes, devRes] = await Promise.all([
        inventoryApi.getSummary(),
        locationsApi.list(),
        devicesApi.list({}),
      ]);
      setSummary(sumRes);
      setLocations(locRes);
      const unlocated = (devRes.data ?? []).filter((d: Device) => !d.locationId);
      setUnlocatedDevices(unlocated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadPDF = async () => {
    if (!summary) return;
    setDownloadingPDF(true);
    try {
      const movements = await inventoryApi.listMovements();
      await downloadInventoryPDF(movements, locations);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("index.title")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("index.title")}
      backAction={() => navigate(-1)}
      icon={<FaBoxes size={20} />}
      maxWidth="6xl"
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("index.title") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            <ITFlex align="center" gap={1}>
              <FaFilePdf size={12} />
              <ITText className="font-bold text-[11px]">
                {downloadingPDF ? t("index.generating") : t("index.reportPdf")}
              </ITText>
            </ITFlex>
          </ITButton>
          {isAdmin && (
            <ITButton
              variant="filled"
              color="primary"
              onClick={() => navigate("/inventario/nuevo-movimiento")}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">{t("index.newMovement")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={3} className="mb-6">
        <ITGrid item xs={12} sm={6} md={4}>
          <ITCard className="p-5">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <FaBoxes size={20} className="text-white" />
              </div>
              <ITText className="text-2xl font-black text-slate-800">{summary?.stats.totalDevices ?? 0}</ITText>
              <ITText className="text-[11px] text-slate-500 uppercase tracking-wider">{t("index.totalDevices")}</ITText>
            </div>
          </ITCard>
        </ITGrid>

        <ITGrid item xs={12} sm={6} md={4}>
          <ITCard className="p-5">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <FaWarehouse size={20} className="text-white" />
              </div>
              <ITText className="text-2xl font-black text-slate-800">{summary?.stats.locatedDevices ?? 0}</ITText>
              <ITText className="text-[11px] text-slate-500 uppercase tracking-wider">{t("index.locatedDevices")}</ITText>
            </div>
          </ITCard>
        </ITGrid>

        <ITGrid item xs={12} sm={6} md={4}>
          <ITCard className="p-5">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(unlocatedDevices.length ?? 0) > 0 ? "bg-amber-500" : "bg-slate-300"}`}>
                <FaBoxOpen size={20} className="text-white" />
              </div>
              <ITText className="text-2xl font-black text-slate-800">{unlocatedDevices.length}</ITText>
              <ITText className="text-[11px] text-slate-500 uppercase tracking-wider">{t("index.unlocatedDevices")}</ITText>
            </div>
          </ITCard>
        </ITGrid>
      </ITGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ITCard className="p-5">
          <ITFlex align="center" justify="between" className="mb-4">
            <ITFlex align="center" gap={2}>
              <FaMapMarkerAlt size={16} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {t("index.locations", { count: locations.length })}
              </ITText>
            </ITFlex>
            <ITButton size="small" variant="outlined" onClick={() => navigate("/inventario/ubicaciones")}>
              <ITFlex align="center" gap={1}>
                <ITText className="font-bold text-[10px]">{t("index.viewAll")}</ITText>
                <FaArrowRight size={10} />
              </ITFlex>
            </ITButton>
          </ITFlex>

          {locations.slice(0, 5).map((loc) => (
            <ITFlex key={loc.id} align="center" justify="between" className="py-2 border-b border-slate-100 last:border-0">
              <ITFlex align="center" gap={2}>
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FaMapMarkerAlt size={12} className="text-blue-500" />
                </div>
                <ITStack direction="column" spacing={0}>
                  <ITText className="text-[11px] font-bold text-slate-700">{formatLocation(loc)}</ITText>
                  {loc.descripcion && (
                    <ITText className="text-[9px] text-slate-400">{loc.descripcion}</ITText>
                  )}
                </ITStack>
              </ITFlex>
              <ITBadget color="primary" size="small">{loc._count?.devices ?? 0}</ITBadget>
            </ITFlex>
          ))}
        </ITCard>

        <ITCard className="p-5">
          <ITFlex align="center" justify="between" className="mb-4">
            <ITFlex align="center" gap={2}>
              <FaArrowRight size={16} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {t("index.recentMovements")}
              </ITText>
            </ITFlex>
            <ITButton size="small" variant="outlined" onClick={() => navigate("/inventario/movimientos")}>
              <ITFlex align="center" gap={1}>
                <ITText className="font-bold text-[10px]">{t("index.viewKardex")}</ITText>
                <FaArrowRight size={10} />
              </ITFlex>
            </ITButton>
          </ITFlex>

          <ITText className="text-[11px] text-slate-400 italic text-center py-4">
            {t("index.kardexHint")}
          </ITText>
        </ITCard>
      </div>
    </ITPage>
  );
}