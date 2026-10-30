import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ITBentoFeed,
  ITBentoGauge,
  ITBentoGrid,
  ITBentoTile,
  ITButton,
  ITChip,
  ITFlex,
  ITPage,
  ITText,
  useITBentoCountUp,
} from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaEdit, FaPlusCircle } from "react-icons/fa";
import {
  LuArrowLeftRight,
  LuArrowUpRight,
  LuBox,
  LuCircleCheck,
  LuHandHelping,
  LuHistory,
  LuLayers,
  LuPackagePlus,
  LuRotateCcw,
  LuSlidersHorizontal,
  LuThumbsDown,
  LuTrash2,
  LuUndo2,
  LuWrench,
} from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { formatDate, formatTimeInTZ } from "@shared/utils/dates";
import { inventoryApi, type Device, type Stock, type StockLedgerRow, type MovementType, type DeviceUnit, type DeviceUnitStatus } from "@entities/inventory";
import { useCan } from "@entities/user";
import { i18n } from "@shared/i18n";
import { useGoBack } from "@shared/lib/useGoBack";
import { LangostinState } from "@shared/ui/langostin";
import { FilterPills } from "@shared/ui/filter-pills";

const STATUS_COLOR: Record<DeviceUnitStatus, "success" | "warning" | "danger" | "info" | "gray"> = {
  AVAILABLE: "success",
  ON_LOAN: "warning",
  DAMAGED: "danger",
  IN_MAINTENANCE: "info",
  RETIRED: "gray",
};

const STATUS_ORDER: DeviceUnitStatus[] = ["AVAILABLE", "ON_LOAN", "DAMAGED", "IN_MAINTENANCE", "RETIRED"];

const MOVEMENT_ICON: Record<MovementType, ReactNode> = {
  STOCK_IN: <LuPackagePlus size={13} />,
  LOAN: <LuArrowUpRight size={13} />,
  RETURN: <LuUndo2 size={13} />,
  RETIREMENT: <LuTrash2 size={13} />,
  TRANSFER: <LuArrowLeftRight size={13} />,
  ADJUSTMENT_IN: <LuSlidersHorizontal size={13} />,
  ADJUSTMENT_OUT: <LuSlidersHorizontal size={13} />,
  MAINTENANCE_IN: <LuWrench size={13} />,
  MAINTENANCE_OUT: <LuWrench size={13} />,
  REVERSAL: <LuRotateCcw size={13} />,
};

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Número grande de un mosaico: sube de 0 al valor al montar. */
function Count({ value }: { value: number }) {
  const shown = useITBentoCountUp(value, 1200, 0);
  return <>{Math.round(shown).toLocaleString("es-MX")}</>;
}

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  /** Mismo permiso que `POST /inventory/movements` (dar entrada/baja). */
  const canEditUnits = useCan("devices.edit");
  const [device, setDevice] = useState<Device | null>(null);
  const [stock, setStock] = useState<Stock | null>(null);
  const [units, setUnits] = useState<DeviceUnit[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitFilter, setUnitFilter] = useState<"all" | DeviceUnitStatus>("all");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([inventoryApi.getDevice(id), inventoryApi.stock(id), inventoryApi.units(id), inventoryApi.stockLedger(id)])
      .then(([d, ex, un, k]) => {
        setDevice(d);
        setStock(ex);
        setUnits(un);
        setStockLedger(k.rows);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t("common:errors.load")))
      .finally(() => setLoading(false));
  }, [id, t]);

  // Historial (kardex) agrupado por día, del más reciente al más antiguo.
  const feedGroups = useMemo(() => {
    const sorted = [...stockLedger].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    const todayKey = dayKey(new Date().toISOString());
    const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000).toISOString());
    const groups: { key: string; label: string; items: { id: string; icon: ReactNode; title: string; meta: string; tone: "success" | "violet" | "neutral" }[] }[] = [];
    sorted.forEach((r, i) => {
      const key = dayKey(r.date);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        const label = key === todayKey ? t("ui.today") : key === yesterdayKey ? t("ui.yesterday") : formatDate(r.date);
        group = { key, label, items: [] };
        groups.push(group);
      }
      const qty = r.stockIn ? `+${r.stockIn}` : r.stockOut ? `−${r.stockOut}` : "";
      group.items.push({
        id: `${r.date}-${i}`,
        icon: MOVEMENT_ICON[r.type],
        title: `${t(`typeLabels.${r.type}`)}${qty ? ` ${qty}` : ""}`,
        meta: [formatTimeInTZ(r.date), t("ui.balance", { n: r.balance }), r.reason].filter(Boolean).join(" · "),
        tone: r.type === "LOAN" || r.type === "RETURN" ? "violet" : r.stockIn ? "success" : "neutral",
      });
    });
    return groups;
  }, [stockLedger, t]);

  // Sin dispositivo (no existe o falló la carga): el error, no un cargador infinito.
  if (!loading && !device) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("devices.detail")} backAction={() => goBack("/inventory/devices")}>
        <LangostinState kind="error" description={error ?? t("common:errors.load")} />
      </ITPage>
    );
  }

  if (loading || !device) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("devices.detail")} backAction={() => goBack("/inventory/devices")}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  const s = stock;
  const active = s?.active ?? 0;
  const available = s?.AVAILABLE ?? 0;
  const loaned = s?.ON_LOAN ?? 0;
  const damaged = s?.DAMAGED ?? 0;
  const maintenance = s?.IN_MAINTENANCE ?? 0;
  const pct = (n: number) => (active > 0 ? Math.round((n / active) * 100) : 0);

  const unitCounts = units.reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.status]: (acc[u.status] ?? 0) + 1 }), {});
  const filterItems = [
    { id: "all" as const, label: t("devices.unitsAll"), count: units.length },
    ...STATUS_ORDER.filter((st) => unitCounts[st]).map((st) => ({ id: st, label: t(`unitStatus.${st}`), count: unitCounts[st] })),
  ];
  const shownUnits = unitFilter === "all" ? units : units.filter((u) => u.status === unitFilter);

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={device.name}
      description={`${device.brand} ${device.model}`}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("devices.title"), onClick: () => navigate("/inventory/devices") }, { label: device.name }]}
      backAction={() => goBack("/inventory/devices")}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          {/* "Llegaron más piezas": abre el alta de ENTRADA con este
              dispositivo y el tipo ya elegidos. */}
          {canEditUnits && (
            <ITButton
              variant="filled"
              color="primary"
              onClick={() =>
                navigate(`/inventory/movements/new?deviceId=${device.id}&type=STOCK_IN`)
              }
            >
              <ITFlex align="center" gap={1}>
                <FaPlusCircle size={12} />
                <ITText className="font-bold text-[11px]">{t("devices.addUnits")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton variant="outlined" color="primary" onClick={() => navigate(`/inventory/devices/${device.id}/edit`)}>
            <ITFlex align="center" gap={1}>
              <FaEdit size={12} />
              <ITText className="font-bold text-[11px]">{t("devices.edit")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITBentoGrid>
        {/* Héroe: tipo, piezas activas y disponibilidad */}
        <ITBentoTile
          tone="sea"
          cols={4}
          rows={3}
          wide
          icon={<LuBox size={15} />}
          label={device.type?.name ?? t("devices.active")}
          value={<Count value={active} />}
          caption={t("devices.units", { total: s?.historical ?? 0 })}
        >
          <div className="relative z-[1] my-1 flex min-h-0 flex-1 flex-col justify-center">
            {active > 0 && (
              <ITBentoGauge value={available / active} color="var(--color-warning)" trackColor="rgb(255 255 255 / 0.14)" />
            )}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <ITText as="span" className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-2.5 py-1 text-[11.5px]">
                <b className="h-[7px] w-[7px] rounded-full bg-[var(--color-warning)]" />
                {t("devices.chipAvailable", { pct: pct(available) })}
              </ITText>
              <ITText as="span" className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-2.5 py-1 text-[11.5px]">
                <b className="h-[7px] w-[7px] rounded-full bg-[color-mix(in_srgb,currentColor_45%,transparent)]" />
                {t("devices.chipLoaned", { count: loaned })}
              </ITText>
            </div>
            {(device.code || device.description) && (
              <ITText className="m-0 mt-2 truncate text-[11.5px] opacity-70">
                {[device.code ? `${t("devices.codeShort")}: ${device.code}` : "", device.description].filter(Boolean).join(" · ")}
              </ITText>
            )}
          </div>
        </ITBentoTile>

        <ITBentoTile
          tone="mint"
          cols={4}
          rows={2}
          icon={<LuCircleCheck size={15} />}
          label={t("devices.avail")}
          value={<Count value={available} />}
          caption={t("devices.ofActive", { pct: pct(available) })}
        />
        <ITBentoTile
          tone="sun"
          cols={4}
          rows={2}
          icon={<LuHandHelping size={15} />}
          label={t("devices.loaned")}
          value={<Count value={loaned} />}
          caption={t("devices.ofActive", { pct: pct(loaned) })}
        />
        <ITBentoTile
          cols={4}
          rows={1}
          icon={<LuThumbsDown size={15} />}
          label={t("devices.damaged")}
          value={
            <ITText as="span" style={damaged > 0 ? { color: "var(--color-danger)" } : undefined}>
              <Count value={damaged} />
            </ITText>
          }
        />
        <ITBentoTile
          tone="lavender"
          cols={4}
          rows={1}
          icon={<LuWrench size={15} />}
          label={t("devices.maintenance")}
          value={<Count value={maintenance} />}
        />

        {/* Unidades físicas */}
        <ITBentoTile cols={5} rows={5} wide icon={<LuLayers size={15} />} label={t("devices.deviceUnits")}>
          {units.length === 0 ? (
            <LangostinState kind="empty" size="sm" title={t("devices.noUnits")} description={t("devices.noUnitsHint")} />
          ) : (
            <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
              {filterItems.length > 2 && <FilterPills items={filterItems} value={unitFilter} onChange={setUnitFilter} />}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {shownUnits.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-[14px] px-2.5 py-2 transition-colors hover:bg-[color-mix(in_srgb,currentColor_6%,transparent)]"
                  >
                    <ITFlex className="min-w-0">
                      <ITText className="m-0 text-[12.5px] font-semibold">{u.assetTag}</ITText>
                      <ITText className="m-0 flex flex-wrap gap-x-3 text-[11px] opacity-60">
                        {device.type?.useSerialNumber && u.serialNumber && <ITText as="span">{i18n.t("common:labels.serialNumber", { value: u.serialNumber })}</ITText>}
                        {device.type?.useMac && u.macAddress && <ITText as="span">MAC: {u.macAddress}</ITText>}
                        {device.type?.useIp && u.ip && <ITText as="span">IP: {u.ip}</ITText>}
                        {device.type?.useHostname && u.hostname && <ITText as="span">{i18n.t("common:labels.hostname", { value: u.hostname })}</ITText>}
                        {!u.serialNumber && !u.macAddress && !u.ip && !u.hostname && <ITText as="span">—</ITText>}
                      </ITText>
                    </ITFlex>
                    <ITChip size="sm" color={STATUS_COLOR[u.status]}>{t(`unitStatus.${u.status}`)}</ITChip>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ITBentoTile>

        {/* Historial (kardex) en feed por día */}
        <ITBentoTile cols={7} rows={5} wide icon={<LuHistory size={15} />} label={t("devices.stockLedger")}>
          {feedGroups.length === 0 ? (
            <LangostinState kind="empty" size="sm" title={t("devices.noMovements")} description={t("devices.noMovementsHint")} />
          ) : (
            <div className="mt-1 min-h-0 flex-1">
              <ITBentoFeed maxHeight={340} groups={feedGroups} />
            </div>
          )}
        </ITBentoTile>
      </ITBentoGrid>
    </ITPage>
  );
}
