import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITBentoFeed,
  ITBentoGauge,
  ITBentoGrid,
  ITBentoTile,
  ITBentoWaves,
  ITPage,
} from "@axzydev/axzy_ui_system";
import { LuActivity, LuBox, LuHandshake, LuLayers, LuPackageX, LuTriangleAlert, LuWrench } from "react-icons/lu";
import { FaBoxes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Dashboard, type Movement, type MovementType } from "@entities/inventory";
import { TYPE_BADGE_HEX } from "@entities/inventory/model/movementColors";
import { InventoryAuditCard } from "@features/inventory/audit";
import { useCan } from "@entities/user";
import { LangostinState } from "@shared/ui/langostin";
import { InsightNote, Num } from "@shared/ui/bento-bits";
import { seriesColor } from "@shared/ui/charts";
import { formatDate, formatTimeInTZ } from "@shared/utils/dates";

const MOVEMENT_TYPES: MovementType[] = [
  "STOCK_IN",
  "LOAN",
  "RETURN",
  "RETIREMENT",
  "TRANSFER",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "MAINTENANCE_IN",
  "MAINTENANCE_OUT",
  "REVERSAL",
];

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Entradas y retornos van en verde; el resto, neutro (el feed solo admite estos tonos). */
const feedTone = (type: MovementType): "success" | "violet" | "neutral" =>
  type === "STOCK_IN" || type === "RETURN" || type === "ADJUSTMENT_IN" || type === "MAINTENANCE_OUT"
    ? "success"
    : type === "LOAN" || type === "TRANSFER"
      ? "violet"
      : "neutral";

/**
 * Tablero del inventario (plantilla P1): héroe con disponibilidad, mosaicos de
 * préstamo, mantenimiento y baja, y debajo categorías, movimientos de 30 días y
 * el feed. Todo sale de `GET /inventory/dashboard` y `GET /inventory/movements`.
 */
export default function DashboardPage() {
  const { t } = useTranslation(["inventory", "common", "home"]);
  const tt = (k: string, o?: Record<string, unknown>) =>
    (t as unknown as (key: string, opts?: Record<string, unknown>) => string)(k, o);
  const navigate = useNavigate();
  const canAudit = useCan("inventory.audit");
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [movements, setMovements] = useState<Movement[] | null>(null);

  useEffect(() => {
    inventoryApi
      .dashboard()
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    inventoryApi
      .movements()
      .then(setMovements)
      .catch(() => setMovements([]));
  }, []);

  // Movimientos de los últimos 30 días por tipo, de mayor a menor.
  const rowsBars = useMemo(() => {
    if (!movements) return [];
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const counts = Object.fromEntries(MOVEMENT_TYPES.map((k) => [k, 0])) as Record<MovementType, number>;
    for (const m of movements) {
      if (new Date(m.date).getTime() >= since) counts[m.type] += 1;
    }
    return MOVEMENT_TYPES.map((type) => ({ type, count: counts[type] }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [movements]);

  // Dispositivos por categoría (tipo), de mayor a menor.
  const categories = useMemo(
    () =>
      (data?.byType ?? [])
        .map((type, i) => ({
          label: type.name,
          value: type.devices.reduce((acc, d) => acc + d.total, 0),
          color: seriesColor(i),
        }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    [data],
  );

  // Feed: los últimos movimientos agrupados por día.
  const feedGroups = useMemo(() => {
    const todayKey = dayKey(new Date().toISOString());
    const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000).toISOString());
    const groups: { key: string; label: string; items: ReturnType<typeof toFeedItem>[] }[] = [];
    const toFeedItem = (m: Movement) => {
      const first = m.items[0]?.device?.name;
      const extra = m.items.length > 1 ? ` +${m.items.length - 1}` : "";
      const who = m.custodian?.name ?? m.createdBy?.name;
      return {
        id: m.id,
        icon: <LuBox size={13} />,
        title: `${tt(`typeLabels.${m.type}`)}${first ? `: ${first}${extra}` : ""}`,
        meta: `${formatTimeInTZ(m.date)}${who ? ` · ${who}` : ""}`,
        tone: feedTone(m.type),
        href: "/inventory/movements",
      };
    };
    const latest = [...(movements ?? [])]
      .filter((m) => m.status === "ACTIVE")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14);
    for (const m of latest) {
      const key = dayKey(m.date);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        const label =
          key === todayKey ? tt("home:adminDashboard.today") : key === yesterdayKey ? tt("home:adminDashboard.yesterday") : formatDate(m.date);
        group = { key, label, items: [] };
        groups.push(group);
      }
      group.items.push(toFeedItem(m));
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, t]);

  const header = {
    noPadding: true,
    className: "m-0! p-0! px-8! min-w-full! pb-12!",
    title: t("dashboard.title"),
    icon: <FaBoxes size={20} />,
    breadcrumbs: [{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title") }],
  };

  if (loading) {
    return (
      <ITPage {...header}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  if (failed || !data) {
    return (
      <ITPage {...header}>
        <LangostinState kind="error" />
      </ITPage>
    );
  }

  const s = data.stats;
  const availablePct = s.activeUnits > 0 ? Math.round((s.available / s.activeUnits) * 100) : 0;
  const loanedPct = s.activeUnits > 0 ? s.loaned / s.activeUnits : 0;
  const categoryTotal = categories.reduce((acc, c) => acc + c.value, 0);
  const categoryMax = Math.max(1, ...categories.map((c) => c.value));
  const barMax = rowsBars[0]?.count ?? 1;

  return (
    <ITPage {...header} description={t("dashboard.description")}>
      {canAudit && <InventoryAuditCard />}

      <ITBentoGrid>
        {/* Unidades activas: medidor de disponibilidad */}
        <ITBentoTile
          tone="sea"
          cols={4}
          rows={3}
          wide
          icon={<LuLayers size={15} />}
          label={t("dashboard.activeUnits")}
          value={<Num value={s.activeUnits} />}
          caption={t("dashboard.heroCaption", { devices: s.devices, types: s.types })}
          onClick={() => navigate("/inventory/devices")}
        >
          <div className="relative z-[1] my-1 flex min-h-0 flex-1 flex-col justify-center">
            {s.activeUnits > 0 && (
              <ITBentoGauge value={s.available / s.activeUnits} color="var(--color-warning)" trackColor="rgb(255 255 255 / 0.14)" />
            )}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px]">
                <b className="h-[7px] w-[7px] rounded-full bg-[var(--color-warning)]" />
                {t("dashboard.availablePct", { pct: availablePct })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px]">
                <b className="h-[7px] w-[7px] rounded-full bg-[color-mix(in_srgb,currentColor_45%,transparent)]" />
                {t("dashboard.available")} {s.available}
              </span>
            </div>
          </div>
        </ITBentoTile>

        {/* Prestadas: olas con la proporción sobre las unidades activas */}
        <ITBentoTile
          tone="lavender"
          cols={3}
          rows={2}
          icon={<LuHandshake size={15} />}
          label={t("dashboard.loaned")}
          value={<Num value={s.loaned} />}
          caption={t("dashboard.ofActive", { total: s.activeUnits })}
          onClick={() => navigate("/inventory/loans")}
        >
          {s.loaned > 0 && <ITBentoWaves level={loanedPct} color="var(--color-violet-400)" />}
        </ITBentoTile>

        {/* Mantenimiento */}
        <ITBentoTile
          tone="sun"
          cols={3}
          rows={2}
          icon={<LuWrench size={15} />}
          label={t("dashboard.maintenance")}
          value={<Num value={s.maintenance} />}
          caption={s.maintenance === 0 ? t("dashboard.noneInMaintenance") : t("dashboard.ofActive", { total: s.activeUnits })}
          onClick={() => navigate("/inventory/movements")}
        />

        {/* Baja */}
        <ITBentoTile
          cols={2}
          rows={2}
          icon={<LuPackageX size={15} />}
          label={t("dashboard.retirement")}
          value={<Num value={s.retirement} />}
          caption={t("dashboard.ofActive", { total: s.activeUnits })}
          onClick={() => navigate("/inventory/movements")}
        />

        {/* Dañadas: ancho */}
        <ITBentoTile
          tone="mint"
          cols={8}
          rows={1}
          wide
          icon={<LuTriangleAlert size={15} />}
          label={t("dashboard.damaged")}
          value={
            <span style={{ color: s.damaged > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
              <Num value={s.damaged} />
            </span>
          }
          caption={s.damaged === 0 ? t("dashboard.noDamaged") : t("dashboard.ofActive", { total: s.activeUnits })}
          onClick={() => navigate("/inventory/movements")}
        />

        {/* Dispositivos por categoría */}
        <ITBentoTile
          cols={4}
          rows={4}
          wide
          icon={<LuBox size={15} />}
          label={tt("home:adminDashboard.devicesByCategory")}
          onClick={() => navigate("/inventory/device-types")}
        >
          {categories.length === 0 ? (
            <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{tt("home:adminDashboard.noCategories")}</p>
          ) : (
            <div className="it-bento-bars mt-4 flex-1 content-around">
              {categories.map((row) => (
                <div key={row.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium">
                  <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: row.color }} />
                  <span className="truncate lowercase first-letter:uppercase">{row.label}</span>
                  <span>
                    {row.value} <span className="opacity-60">{Math.round((row.value / Math.max(1, categoryTotal)) * 100)}%</span>
                  </span>
                  <div className="it-bento-bar col-span-3">
                    <i style={{ "--it-bento-w": `${(row.value / categoryMax) * 100}%`, background: row.color } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ITBentoTile>

        {/* Movimientos de los últimos 30 días */}
        <ITBentoTile
          cols={4}
          rows={4}
          wide
          icon={<LuActivity size={15} />}
          label={t("dashboard.mov30d")}
          onClick={() => navigate("/inventory/movements")}
        >
          {rowsBars.length === 0 ? (
            <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("dashboard.noMovs")}</p>
          ) : (
            <>
              <div className="it-bento-bars mt-4 flex-1 content-around">
                {rowsBars.slice(0, 6).map((r) => (
                  <div key={r.type} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium">
                    <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: TYPE_BADGE_HEX[r.type] }} />
                    <span className="truncate">{tt(`typeLabels.${r.type}`)}</span>
                    <span>{r.count}</span>
                    <div className="it-bento-bar col-span-3">
                      <i style={{ "--it-bento-w": `${(r.count / barMax) * 100}%`, background: TYPE_BADGE_HEX[r.type] } as React.CSSProperties} />
                    </div>
                  </div>
                ))}
              </div>
              <InsightNote className="mt-auto">
                {t("dashboard.movNote", { total: rowsBars.reduce((acc, r) => acc + r.count, 0), top: tt(`typeLabels.${rowsBars[0].type}`) })}
              </InsightNote>
            </>
          )}
        </ITBentoTile>

        {/* Movimientos recientes */}
        <ITBentoTile cols={4} rows={4} wide icon={<LuActivity size={15} />} label={t("dashboard.recentMovements")}>
          {feedGroups.length === 0 ? (
            <p className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("dashboard.noMovs")}</p>
          ) : (
            <div className="mt-1 min-h-0 flex-1">
              <ITBentoFeed
                maxHeight={236}
                groups={feedGroups}
                onItemClick={(item) => {
                  if (item.href) navigate(item.href);
                }}
              />
            </div>
          )}
        </ITBentoTile>
      </ITBentoGrid>
    </ITPage>
  );
}
