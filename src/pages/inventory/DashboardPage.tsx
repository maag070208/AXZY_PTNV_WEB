import { LottieLoader } from "@shared/ui/lottie-loader";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITCard,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaChartPie, FaCogs, FaLayerGroup, FaThumbsDown, FaToolbox, FaUserTie } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Dashboard, type DashboardStat, type MovementType } from "@entities/inventory";
import { TYPE_BADGE_HEX } from "@entities/inventory/model/movementColors";
import { KPI_TONES, KpiTile } from "@shared/ui/kpi-tile";
import { WaveFill } from "@shared/ui/charts";
import { InventoryAuditCard } from "@features/inventory/audit";
import { useCan } from "@entities/user";

type Distrib = { label: string; value: number; color: string; to: string }[];

function distribDe(s: DashboardStat): Distrib {
  return [
    { label: "available", value: s.available, color: "var(--color-success)", to: "/inventory/devices" },
    { label: "loaned", value: s.loaned, color: "var(--color-warning)", to: "/inventory/loans" },
    { label: "maintenance", value: s.maintenance, color: "var(--color-text-muted)", to: "/inventory/movements" },
    { label: "damaged", value: s.damaged, color: "var(--color-orange-500)", to: "/inventory/movements" },
    { label: "retirement", value: s.retirement, color: "var(--color-danger)", to: "/inventory/movements" },
  ];
}

function DonutChart({ items, centerValue, centerLabel }: { items: Distrib; centerValue: number; centerLabel: string }) {
  const total = items.reduce((acc, it) => acc + it.value, 0);
  let offset = 0;
  if (total === 0) {
    offset = 100;
  }
  return (
    <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--color-secondary-100)" strokeWidth="4.5" />
        {total > 0 &&
          items.map((it) => {
            const pct = (it.value / total) * 100;
            const sec = (
              <circle
                key={it.label}
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke={it.color}
                strokeWidth="4.5"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-offset}
              />
            );
            offset += pct;
            return sec;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <ITText className="text-2xl font-extrabold text-slate-800">{centerValue}</ITText>
        <ITText className="text-[12px] font-semibold text-slate-400">{centerLabel}</ITText>
      </div>
    </div>
  );
}


/** Ola de fondo cuando hay una proporción real (parte sobre el total de unidades activas). */
const ratio = (part: number, total: number, color: string) =>
  total > 0 && part > 0 ? <WaveFill level={part / total} color={color} /> : undefined;

export default function DashboardPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const tt = (k: string) => (t as unknown as (key: string) => string)(k);
  const navigate = useNavigate();
  const canAudit = useCan("inventory.audit");
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [movements30, setMovements30] = useState<Record<MovementType, number> | null>(null);

  useEffect(() => {
    inventoryApi
      .dashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const empty = Object.fromEntries(
      (["STOCK_IN", "LOAN", "RETURN", "RETIREMENT", "TRANSFER", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "MAINTENANCE_IN", "MAINTENANCE_OUT", "REVERSAL"] as MovementType[]).map((k) => [k, 0])
    ) as Record<MovementType, number>;
    inventoryApi
      .movements()
      .then((list) => {
        const counts = { ...empty };
        for (const m of list) {
          if (new Date(m.date).getTime() >= since) counts[m.type as MovementType] += 1;
        }
        setMovements30(counts);
      })
      .catch(() => setMovements30(empty));
  }, []);

  const rowsBars = useMemo(() => {
    if (!movements30) return [];
    return (Object.keys(movements30) as MovementType[])
      .map((tp) => ({ type: tp, count: movements30[tp] }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [movements30]);

  if (loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("dashboard.title")} backAction={() => undefined}>
        <ITFlex justify="center" align="center" className="py-20">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  const s = data?.stats ?? {
    types: 0,
    devices: 0,
    activeUnits: 0,
    available: 0,
    loaned: 0,
    damaged: 0,
    maintenance: 0,
    retirement: 0,
  };
  const distrib = distribDe(s);

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("dashboard.title")}
      description={t("dashboard.execSummary")}
      icon={<FaBoxes size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("dashboard.title") },
      ]}
    >
      {canAudit && <InventoryAuditCard />}

      <ITCard contentClassName="flex flex-col gap-4">
        <ITFlex align="center" gap={2}>
          <FaChartPie className="text-slate-400" size={16} />
          <ITText className="text-sm font-bold text-slate-800">{t("dashboard.execSummary")}</ITText>
        </ITFlex>

        <ITGrid container columns={12} spacing={6}>
          <ITGrid item xs={12} md={6}>
            <ITFlex direction="column" gap={4} className="h-full rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <ITText className="text-[12px] font-bold text-slate-500">{t("dashboard.inventoryHealth")}</ITText>
              <ITFlex align="center" justify="center" gap={8} wrap="wrap">
                <DonutChart items={distrib} centerValue={s?.activeUnits ?? 0} centerLabel={t("dashboard.donutUnits")} />
                <ITFlex direction="column" gap={2.5}>
                  {distrib.map((it) => (
                    <button key={it.label} className="flex items-center gap-2 text-left" onClick={() => navigate(it.to)} title={t("common:actions.view")}>
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: it.color }} />
                      <ITText className="text-xs font-semibold text-slate-600">{tt(`dashboard.${it.label}`)}</ITText>
                      <ITText className="min-w-8 text-right text-xs font-bold text-slate-800">{it.value}</ITText>
                    </button>
                  ))}
                </ITFlex>
              </ITFlex>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} md={6}>
            <ITFlex direction="column" gap={3.5} className="h-full rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <ITText className="text-[12px] font-bold text-slate-500">{t("dashboard.mov30d")}</ITText>
              {rowsBars.length === 0 ? (
                <ITText className="text-xs text-slate-400">{t("dashboard.noMovs")}</ITText>
              ) : (
                <ITFlex direction="column" gap={3}>
                  {rowsBars.map((r) => {
                    const max = rowsBars[0].count;
                    const pct = Math.round((r.count / max) * 100);
                    return (
                      <button key={r.type} className="flex items-center gap-3 text-left" onClick={() => navigate("/inventory/movements")}>
                        <ITText className="w-36 shrink-0 text-xs font-semibold text-slate-600">{tt(`typeLabels.${r.type}`)}</ITText>
                        <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: TYPE_BADGE_HEX[r.type] }} />
                        </div>
                        <ITText className="min-w-6 text-right text-xs font-bold text-slate-800">{r.count}</ITText>
                      </button>
                    );
                  })}
                </ITFlex>
              )}
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </ITCard>

      <div className="bento-stagger grid grid-cols-2 gap-4 md:!grid-cols-4">
        {/* Las tarjetas con proporción real (sobre las unidades activas) llevan la ola de fondo. */}
        <KpiTile size="sm" label={t("dashboard.types")} value={s?.types ?? 0} tone="sky" icon={<FaLayerGroup size={16} />} onClick={() => navigate("/inventory/device-types")} />
        <KpiTile size="sm" label={t("dashboard.devices")} value={s?.devices ?? 0} tone="violet" icon={<FaBoxes size={16} />} onClick={() => navigate("/inventory/devices")} />
        <KpiTile size="sm" label={t("dashboard.activeUnits")} value={s?.activeUnits ?? 0} tone="emerald" icon={<FaChartPie size={16} />} onClick={() => navigate("/inventory/devices")} backdrop={ratio(s?.activeUnits ?? 0, s?.activeUnits ?? 0, KPI_TONES.emerald.accent)} />
        <KpiTile size="sm" label={t("dashboard.loaned")} value={s?.loaned ?? 0} tone="amber" icon={<FaUserTie size={16} />} onClick={() => navigate("/inventory/loans")} backdrop={ratio(s?.loaned ?? 0, s?.activeUnits ?? 0, KPI_TONES.amber.accent)} />
        <KpiTile size="sm" label={t("dashboard.maintenance")} value={s?.maintenance ?? 0} tone={(s?.maintenance ?? 0) > 0 ? "amber" : "neutral"} icon={<FaToolbox size={16} />} onClick={() => navigate("/inventory/movements")} />
        <KpiTile size="sm" label={t("dashboard.damaged")} value={s?.damaged ?? 0} tone={(s?.damaged ?? 0) > 0 ? "rose" : "neutral"} icon={<FaThumbsDown size={16} />} onClick={() => navigate("/inventory/movements")} backdrop={ratio(s?.damaged ?? 0, s?.activeUnits ?? 0, KPI_TONES.rose.accent)} />
        <KpiTile size="sm" label={t("dashboard.retirement")} value={s?.retirement ?? 0} tone={(s?.retirement ?? 0) > 0 ? "rose" : "neutral"} icon={<FaCogs size={16} />} onClick={() => navigate("/inventory/movements")} />
        <KpiTile size="sm" label={t("dashboard.available")} value={s.available} tone="emerald" icon={<FaBoxOpen size={16} />} onClick={() => navigate("/inventory/devices")} backdrop={ratio(s.available, s?.activeUnits ?? 0, KPI_TONES.emerald.accent)} />
      </div>
    </ITPage>
  );
}