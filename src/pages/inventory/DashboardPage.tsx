import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaChartPie, FaCogs, FaLayerGroup, FaThumbsDown, FaToolbox, FaUserTie } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Dashboard, type DashboardStat, type MovementType } from "@entities/inventory";
import { TYPE_BADGE_HEX } from "@entities/inventory/model/movementColors";
import { StatCard } from "@shared/ui/stat-card";

type Distrib = { label: string; value: number; color: string; to: string }[];

function distribDe(s: DashboardStat): Distrib {
  return [
    { label: "available", value: s.available, color: "#10b981", to: "/inventory/devices" },
    { label: "loaned", value: s.loaned, color: "#f59e0b", to: "/inventory/loans" },
    { label: "maintenance", value: s.maintenance, color: "#64748b", to: "/inventory/movements" },
    { label: "damaged", value: s.damaged, color: "#f97316", to: "/inventory/movements" },
    { label: "retirement", value: s.retirement, color: "#ef4444", to: "/inventory/movements" },
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
        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="4.5" />
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
        <ITText className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{centerLabel}</ITText>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const tt = (k: string) => (t as unknown as (key: string) => string)(k);
  const navigate = useNavigate();
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
      <ITPage title={t("dashboard.title")} loading backAction={() => undefined}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
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
    <ITPage
      title={t("dashboard.title")}
      description={t("dashboard.execSummary")}
      icon={<FaBoxes size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("dashboard.title") },
      ]}
    >
      <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <ITFlex align="center" gap={2}>
          <FaChartPie className="text-slate-400" size={16} />
          <ITText className="text-sm font-bold text-slate-800">{t("dashboard.execSummary")}</ITText>
        </ITFlex>

        <ITGrid container columns={12} spacing={6}>
          <ITGrid item xs={12} md={6}>
            <ITFlex direction="column" gap={4} className="h-full rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <ITText className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("dashboard.inventoryHealth")}</ITText>
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
              <ITText className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("dashboard.mov30d")}</ITText>
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
      </ITFlex>

      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaLayerGroup size={18} className="text-white" />} circleClass="bg-blue-500" value={s?.types ?? 0} label={t("dashboard.types")} onClick={() => navigate("/inventory/device-types")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaBoxes size={18} className="text-white" />} circleClass="bg-indigo-500" value={s?.devices ?? 0} label={t("dashboard.devices")} onClick={() => navigate("/inventory/devices")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaChartPie size={18} className="text-white" />} circleClass="bg-emerald-500" value={s?.activeUnits ?? 0} label={t("dashboard.activeUnits")} onClick={() => navigate("/inventory/devices")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaUserTie size={18} className="text-white" />} circleClass="bg-purple-500" value={s?.loaned ?? 0} label={t("dashboard.loaned")} onClick={() => navigate("/inventory/loans")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaToolbox size={18} className="text-white" />} circleClass="bg-amber-500" value={s?.maintenance ?? 0} label={t("dashboard.maintenance")} onClick={() => navigate("/inventory/movements")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaThumbsDown size={18} className="text-white" />} circleClass="bg-orange-500" value={s?.damaged ?? 0} label={t("dashboard.damaged")} onClick={() => navigate("/inventory/movements")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaCogs size={18} className="text-white" />} circleClass="bg-red-500" value={s?.retirement ?? 0} label={t("dashboard.retirement")} onClick={() => navigate("/inventory/movements")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaBoxOpen size={18} className="text-white" />} circleClass="bg-slate-500" value={s.available} label={t("dashboard.available")} onClick={() => navigate("/inventory/devices")} />
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}