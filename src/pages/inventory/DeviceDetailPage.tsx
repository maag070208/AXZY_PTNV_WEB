import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaEdit, FaHistory, FaThumbsDown, FaToolbox, FaUserTie } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@shared/utils/dates";
import { inventoryApi, type Device, type Stock, type StockLedgerRow, type MovementType, type DeviceUnit } from "@entities/inventory";
import { StatCard } from "@shared/ui/stat-card";

const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  AVAILABLE: "success",
  ON_LOAN: "warning",
  DAMAGED: "danger",
  IN_MAINTENANCE: "gray",
  RETIRED: "danger",
};

const TYPE_BADGE_COLOR: Record<MovementType, "success" | "warning" | "danger" | "gray" | "info"> = {
  STOCK_IN: "success",
  LOAN: "warning",
  RETURN: "info",
  RETIREMENT: "danger",
  TRANSFER: "info",
  ADJUSTMENT_IN: "success",
  ADJUSTMENT_OUT: "warning",
  MAINTENANCE_IN: "gray",
  MAINTENANCE_OUT: "info",
  REVERSAL: "danger",
};

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [stock, setStock] = useState<Stock | null>(null);
  const [units, setUnits] = useState<DeviceUnit[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([inventoryApi.getDevice(id), inventoryApi.stock(id), inventoryApi.units(id), inventoryApi.stockLedger(id)])
      .then(([d, ex, un, k]) => {
        setDevice(d);
        setStock(ex);
        setUnits(un);
        setStockLedger(k.rows);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !device) {
    return (
      <ITPage title={t("devices.detail")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const s = stock;

  return (
    <ITPage
      title={device.name}
      description={`${device.brand} ${device.model}`}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("devices.title"), onClick: () => navigate("/inventory/devices") }, { label: device.name }]}
      backAction={() => navigate("/inventory/devices")}
      actions={
        <ITButton variant="outlined" color="primary" onClick={() => navigate(`/inventory/devices/${device.id}/edit`)}>
          <ITFlex align="center" gap={1}>
            <FaEdit size={12} />
            <ITText className="font-bold text-[11px]">{t("devices.edit")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {/* Hero */}
      <ITFlex
        as="section"
        direction="column"
        gap={4}
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm"
      >
        <ITFlex align="center" justify="between" gap={4} wrap="wrap">
          <ITFlex align="center" gap={4} className="min-w-0">
            <ITFlex align="center" justify="center" className="h-16 w-16 shrink-0 rounded-2xl bg-slate-800 text-white shadow-md">
              <FaBoxOpen size={26} />
            </ITFlex>
            <ITFlex direction="column" gap={1} className="min-w-0">
              <ITFlex align="center" gap={2} wrap="wrap">
                <ITText className="text-2xl font-black text-slate-900">{device.name}</ITText>
                <ITBadget color="gray" size="lg">{device.type?.name ?? ""}</ITBadget>
              </ITFlex>
              <ITText className="text-sm text-slate-500">
                {device.brand} · {device.model}
                {device.description ? ` · ${device.description}` : ""}
              </ITText>
            </ITFlex>
          </ITFlex>
          <ITFlex direction="column" align="end" gap={1}>
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("devices.active")}</ITText>
            <ITText className="text-4xl font-black text-slate-900 leading-none">{s?.active ?? 0}</ITText>
            <ITText className="text-[11px] text-slate-400">{t("devices.units", { total: s?.historical ?? 0 })}</ITText>
          </ITFlex>
        </ITFlex>
      </ITFlex>

      {/* Stats */}
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaCheckCircle size={16} className="text-white" />} circleClass="bg-emerald-500" value={s?.AVAILABLE ?? 0} label={t("devices.avail")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaUserTie size={16} className="text-white" />} circleClass="bg-amber-500" value={s?.ON_LOAN ?? 0} label={t("devices.loaned")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaThumbsDown size={16} className="text-white" />} circleClass="bg-orange-500" value={s?.DAMAGED ?? 0} label={t("devices.damaged")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaToolbox size={16} className="text-white" />} circleClass="bg-slate-500" value={s?.IN_MAINTENANCE ?? 0} label={t("devices.maintenance")} />
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={6}>
        {/* Unidades */}
        <ITGrid item xs={12} lg={5}>
          <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITFlex align="center" justify="between" gap={2}>
              <ITText className="text-sm font-bold text-slate-800">{t("devices.deviceUnits")}</ITText>
              <ITBadget color="gray" size="lg">{units.length}</ITBadget>
            </ITFlex>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-100">
              {units.map((u) => (
                <ITFlex key={u.id} align="center" justify="between" gap={3} className="border-b border-slate-100 px-3 py-2.5 last:border-0 hover:bg-slate-50/60">
                  <ITFlex direction="column" gap={0.5} className="min-w-0">
                    <ITText className="font-black text-emerald-700 text-[12px] uppercase tracking-tight">{u.assetTag}</ITText>
                    <ITFlex gap={2} wrap="wrap" className="text-[10px] text-slate-400">
                      {device.type?.useSerialNumber && u.serialNumber && <span>Serie: {u.serialNumber}</span>}
                      {device.type?.useMac && u.macAddress && <span>MAC: {u.macAddress}</span>}
                      {device.type?.useIp && u.ip && <span>IP: {u.ip}</span>}
                      {device.type?.useHostname && u.hostname && <span>Equipo: {u.hostname}</span>}
                      {!u.serialNumber && !u.macAddress && !u.ip && !u.hostname && <span>—</span>}
                    </ITFlex>
                  </ITFlex>
                  <ITBadget color={STATUS_COLOR[u.status]} size="lg">{u.status}</ITBadget>
                </ITFlex>
              ))}
              {units.length === 0 && <ITText className="py-8 text-center text-sm text-slate-400">{t("devices.noUnits")}</ITText>}
            </div>
          </ITFlex>
        </ITGrid>

        {/* Kardex */}
        <ITGrid item xs={12} lg={7}>
          <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITFlex align="center" gap={2}>
              <FaHistory className="text-slate-400" size={14} />
              <ITText className="text-sm font-bold text-slate-800">{t("devices.stockLedger")}</ITText>
            </ITFlex>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-3 py-2.5">{t("stockLedger.date")}</th>
                    <th className="px-3 py-2.5">{t("stockLedger.movement")}</th>
                    <th className="px-3 py-2.5 text-right">{t("stockLedger.entry")}</th>
                    <th className="px-3 py-2.5 text-right">{t("stockLedger.exit")}</th>
                    <th className="px-3 py-2.5 text-right">{t("stockLedger.balance")}</th>
                    <th className="px-3 py-2.5">{t("stockLedger.reason")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLedger.map((r, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{formatDateTime(r.date)}</td>
                      <td className="px-3 py-2">
                        <ITBadget color={TYPE_BADGE_COLOR[r.type]} size="lg">{r.type}</ITBadget>
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] font-bold text-emerald-600">{r.stockIn ? `+${r.stockIn}` : ""}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-bold text-red-500">{r.stockOut ? `−${r.stockOut}` : ""}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-black text-slate-800">{r.balance}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-400">{r.reason ?? ""}</td>
                    </tr>
                  ))}
                  {stockLedger.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">{t("devices.noMovements")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}