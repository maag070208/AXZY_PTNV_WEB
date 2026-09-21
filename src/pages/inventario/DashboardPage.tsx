import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaChartPie, FaCogs, FaLayerGroup, FaThumbsDown, FaToolbox, FaUserTie } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventarioApi, type Dashboard, type DashboardStat, type TipoMovimiento } from "@entities/inventario";
import { TIPO_BADGE_HEX } from "@entities/inventario/model/movimientoColores";
import { StatCard } from "@shared/ui/stat-card";

type Distrib = { label: string; value: number; color: string; to: string }[];

function distribDe(s: DashboardStat): Distrib {
  return [
    { label: "disponibles", value: s.disponible, color: "#10b981", to: "/inventario/dispositivos" },
    { label: "prestadas", value: s.prestado, color: "#f59e0b", to: "/inventario/prestamos" },
    { label: "mantenimiento", value: s.mantenimiento, color: "#64748b", to: "/inventario/movimientos" },
    { label: "danadas", value: s.danado, color: "#f97316", to: "/inventario/movimientos" },
    { label: "baja", value: s.baja, color: "#ef4444", to: "/inventario/movimientos" },
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
            const seg = (
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
            return seg;
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
  const { t } = useTranslation(["inventario", "common"]);
  const tt = (k: string) => (t as unknown as (key: string) => string)(k);
  const navigate = useNavigate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [movs30, setMovs30] = useState<Record<TipoMovimiento, number> | null>(null);

  useEffect(() => {
    inventarioApi
      .dashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const empty = Object.fromEntries(
      (["ENTRADA", "PRESTAMO", "DEVOLUCION", "BAJA", "TRASPASO", "AJUSTE_ENTRADA", "AJUSTE_SALIDA", "MANTENIMIENTO_ENTRADA", "MANTENIMIENTO_SALIDA", "REVERSION"] as TipoMovimiento[]).map((k) => [k, 0])
    ) as Record<TipoMovimiento, number>;
    inventarioApi
      .movimientos()
      .then((list) => {
        const counts = { ...empty };
        for (const m of list) {
          if (new Date(m.fecha).getTime() >= since) counts[m.tipo as TipoMovimiento] += 1;
        }
        setMovs30(counts);
      })
      .catch(() => setMovs30(empty));
  }, []);

  const rowsBars = useMemo(() => {
    if (!movs30) return [];
    return (Object.keys(movs30) as TipoMovimiento[])
      .map((tp) => ({ tipo: tp, count: movs30[tp] }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [movs30]);

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
    tipos: 0,
    dispositivos: 0,
    unidadesActivas: 0,
    disponible: 0,
    prestado: 0,
    danado: 0,
    mantenimiento: 0,
    baja: 0,
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
                <DonutChart items={distrib} centerValue={s?.unidadesActivas ?? 0} centerLabel={t("dashboard.donutUnits")} />
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
                      <button key={r.tipo} className="flex items-center gap-3 text-left" onClick={() => navigate("/inventario/movimientos")}>
                        <ITText className="w-36 shrink-0 text-xs font-semibold text-slate-600">{tt(`typeLabels.${r.tipo}`)}</ITText>
                        <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: TIPO_BADGE_HEX[r.tipo] }} />
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
          <StatCard size="lg" icon={<FaLayerGroup size={18} className="text-white" />} circleClass="bg-blue-500" value={s?.tipos ?? 0} label={t("dashboard.tipos")} onClick={() => navigate("/inventario/tipos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaBoxes size={18} className="text-white" />} circleClass="bg-indigo-500" value={s?.dispositivos ?? 0} label={t("dashboard.dispositivos")} onClick={() => navigate("/inventario/dispositivos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaChartPie size={18} className="text-white" />} circleClass="bg-emerald-500" value={s?.unidadesActivas ?? 0} label={t("dashboard.unidadesActivas")} onClick={() => navigate("/inventario/dispositivos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaUserTie size={18} className="text-white" />} circleClass="bg-purple-500" value={s?.prestado ?? 0} label={t("dashboard.prestadas")} onClick={() => navigate("/inventario/prestamos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaToolbox size={18} className="text-white" />} circleClass="bg-amber-500" value={s?.mantenimiento ?? 0} label={t("dashboard.mantenimiento")} onClick={() => navigate("/inventario/movimientos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaThumbsDown size={18} className="text-white" />} circleClass="bg-orange-500" value={s?.danado ?? 0} label={t("dashboard.danadas")} onClick={() => navigate("/inventario/movimientos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaCogs size={18} className="text-white" />} circleClass="bg-red-500" value={s?.baja ?? 0} label={t("dashboard.baja")} onClick={() => navigate("/inventario/movimientos")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaBoxOpen size={18} className="text-white" />} circleClass="bg-slate-500" value={s.disponible} label={t("dashboard.disponibles")} onClick={() => navigate("/inventario/dispositivos")} />
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}