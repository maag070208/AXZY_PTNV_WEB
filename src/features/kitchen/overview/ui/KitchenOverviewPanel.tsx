import { useNavigate } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowUp, FaClipboardCheck, FaShoppingCart } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KitchenAlertKpis, StockBar, fmtQty, useKitchenAlerts, type KitchenAlerts } from "@entities/kitchen";
import { useCan } from "@entities/user";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { PanelCard } from "@shared/ui/panel-card";

const DAY_MS = 86_400_000;
const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS);

/** Resumen del almacén: indicadores, accesos rápidos, qué usar primero y qué reabastecer. */
export default function KitchenOverviewPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const { alerts, error } = useKitchenAlerts();
  const can = {
    stockIn: useCan("kitchen.stock_in"),
    stockOut: useCan("kitchen.stock_out"),
    count: useCan("kitchen.adjust"),
    order: useCan("purchase_orders.create"),
  };

  if (error) return <ITAlert variant="error">{error}</ITAlert>;
  if (!alerts) {
    return (
      <ITFlex justify="center" className="py-16">
        <LottieLoader size="lg" />
      </ITFlex>
    );
  }

  const quick = [
    { key: "stockIn", to: "/kitchen/stock-in", icon: <FaArrowDown size={15} />, tone: "bg-emerald-50 text-emerald-600", show: can.stockIn },
    { key: "stockOut", to: "/kitchen/stock-out", icon: <FaArrowUp size={15} />, tone: "bg-sky-50 text-sky-600", show: can.stockOut },
    { key: "count", to: "/kitchen/count", icon: <FaClipboardCheck size={15} />, tone: "bg-violet-50 text-violet-600", show: can.count },
    { key: "order", to: "/kitchen/purchase-orders/new", icon: <FaShoppingCart size={15} />, tone: "bg-amber-50 text-amber-600", show: can.order },
  ] as const;
  const empty = alerts.counts.low + alerts.counts.over + alerts.counts.expiring + alerts.counts.expired === 0;

  return (
    <ITFlex direction="column" gap={4}>
      <KitchenAlertKpis alerts={alerts} onSelect={(key) => navigate(key === "low" || key === "over" ? "/kitchen/items" : "/kitchen/lots")} />

      {empty && <ITAlert variant="success">{t("overview.empty")}</ITAlert>}

      {quick.some((q) => q.show) && (
        <PanelCard title={t("overview.quickTitle")}>
          <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2 xl:!grid-cols-4">
            {quick
              .filter((q) => q.show)
              .map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => navigate(q.to)}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 !bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${q.tone}`}>{q.icon}</span>
                  <span className="min-w-0">
                    <span className="block !text-[13px] font-black text-slate-800">{t(`overview.quick.${q.key}`)}</span>
                    <span className="block !text-[11px] text-slate-400">{t(`overview.quick.${q.key}Hint`)}</span>
                  </span>
                </button>
              ))}
          </div>
        </PanelCard>
      )}

      <div className="grid gap-4 lg:!grid-cols-2">
        <UseFirstCard alerts={alerts} onViewAll={() => navigate("/kitchen/lots")} />
        <PanelCard
          title={t("overview.restockList")}
          description={t("overview.restockHint")}
          actions={<ITButton variant="text" color="primary" size="sm" label={t("overview.viewAll")} onClick={() => navigate("/kitchen/restock")} />}
        >
          {alerts.low.length === 0 ? (
            <ITText className="text-[12px] text-slate-400">{t("overview.noRestock")}</ITText>
          ) : (
            <ITFlex direction="column" gap={3}>
              {alerts.low.map((i) => {
                const target = i.maxStock ?? i.minStock * 2;
                const suggested = Math.max(0, target - i.available);
                return (
                  <div key={i.id} className="rounded-xl border border-slate-100 p-3">
                    <ITFlex align="center" justify="between" gap={2} className="mb-2">
                      <ITFlex direction="column" gap={0}>
                        <ITText className="text-[12px] font-black text-slate-800">{i.name}</ITText>
                        <ITText className="text-[10px] font-mono text-slate-400">{i.code}</ITText>
                      </ITFlex>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        {t("overview.order", { qty: fmtQty(i.unit.whole ? Math.ceil(suggested) : suggested), unit: i.unit.name })}
                      </span>
                    </ITFlex>
                    <StockBar available={i.available} min={i.minStock} max={i.maxStock} />
                    <ITText className="mt-1 block text-[10px] text-slate-500">
                      {fmtQty(i.available)} / {fmtQty(i.minStock)}
                      {i.maxStock != null ? ` – ${fmtQty(i.maxStock)}` : ""} {i.unit.name}
                    </ITText>
                  </div>
                );
              })}
            </ITFlex>
          )}
        </PanelCard>
      </div>
    </ITFlex>
  );
}

function UseFirstCard({ alerts, onViewAll }: { alerts: KitchenAlerts; onViewAll: () => void }) {
  const { t } = useTranslation("kitchen");
  const lots = [...alerts.expired, ...alerts.expiring];
  return (
    <PanelCard
      title={t("overview.useFirst")}
      description={t("overview.useFirstHint")}
      actions={<ITButton variant="text" color="primary" size="sm" label={t("overview.viewAll")} onClick={onViewAll} />}
    >
      {lots.length === 0 ? (
        <ITText className="text-[12px] text-slate-400">{t("overview.noUrgent")}</ITText>
      ) : (
        <ITFlex direction="column" gap={0}>
          {lots.map((l) => {
            const days = daysBetween(alerts.today, l.expiresAt);
            const expired = days < 0;
            const label = expired ? t("overview.expiredAgo", { count: -days }) : days === 0 ? t("overview.expiresToday") : t("overview.expiresIn", { count: days });
            return (
              <ITFlex key={l.id} align="center" justify="between" gap={2} className="border-b border-slate-100 py-2.5 last:border-0">
                <ITFlex align="center" gap={3}>
                  <span className={`h-9 w-1.5 rounded-full ${expired ? "bg-rose-500" : "bg-[#fb923c]"}`} />
                  <ITFlex direction="column" gap={0}>
                    <ITText className="text-[12px] font-black text-slate-800">{l.item.name}</ITText>
                    <ITText className="text-[10px] font-mono text-slate-400">{l.lotCode}</ITText>
                  </ITFlex>
                </ITFlex>
                <ITFlex direction="column" gap={0} className="items-end">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${expired ? "bg-rose-50 text-rose-700" : "bg-[#fff7ed] text-[#c2410c]"}`}>{label}</span>
                  <ITText className="mt-0.5 text-[11px] text-slate-500">
                    {fmtQty(l.onHand)} {l.item.unit.name}
                  </ITText>
                </ITFlex>
              </ITFlex>
            );
          })}
        </ITFlex>
      )}
    </PanelCard>
  );
}
