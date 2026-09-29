import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITAlert, ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { kitchenApi, fmtQty, type KitchenAlerts } from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import { LottieLoader } from "@shared/ui/lottie-loader";

const tint: Record<string, string> = {
  low: "bg-amber-50 text-amber-600",
  expiring: "bg-orange-50 text-orange-600",
  expired: "bg-rose-50 text-rose-600",
  over: "bg-sky-50 text-sky-600",
};

/** Resumen del almacén: alertas de mínimos, máximos y caducidad. */
export default function KitchenOverviewPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<KitchenAlerts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    kitchenApi
      .alerts()
      .then(setAlerts)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <ITAlert variant="error">{error}</ITAlert>;
  if (!alerts) {
    return (
      <ITFlex justify="center" className="py-16">
        <LottieLoader size="lg" />
      </ITFlex>
    );
  }

  const empty = alerts.counts.low + alerts.counts.over + alerts.counts.expiring + alerts.counts.expired === 0;

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex wrap="wrap" gap={3}>
        {(["low", "expiring", "expired", "over"] as const).map((key) => (
          <ITFlex
            key={key}
            grow={1}
            basis="180px"
            align="center"
            gap={3}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl text-lg font-black ${tint[key]}`}>
              {alerts.counts[key]}
            </ITFlex>
            <ITText className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {dyn(t)(`overview.${key}`)}
            </ITText>
          </ITFlex>
        ))}
      </ITFlex>

      {empty && <ITAlert variant="success">{t("overview.empty")}</ITAlert>}

      <ITFlex direction="column" gap={4} className="lg:flex-row">
        <ITCard title={t("overview.useFirst")} className="!p-5 border border-slate-200 flex-1">
          {alerts.expiring.length === 0 && alerts.expired.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          ) : (
            <ITFlex direction="column" gap={2}>
              {[...alerts.expired, ...alerts.expiring].map((l) => (
                <ITFlex key={l.id} align="center" justify="between" gap={2}>
                  <ITFlex direction="column" gap={0}>
                    <ITText className="text-[12px] font-black text-slate-800">{l.item.name}</ITText>
                    <ITText className="text-[10px] font-mono text-slate-400">{l.lotCode}</ITText>
                  </ITFlex>
                  <ITFlex direction="column" gap={0} className="items-end">
                    <ITText className={`text-[11px] font-bold ${l.expiresAt < alerts.today ? "text-rose-600" : "text-orange-600"}`}>
                      {l.expiresAt}
                    </ITText>
                    <ITText className="text-[11px] text-slate-500">
                      {fmtQty(l.onHand)} {l.item.unit.name}
                    </ITText>
                  </ITFlex>
                </ITFlex>
              ))}
              <ITButton variant="text" color="primary" size="sm" onClick={() => navigate("/kitchen/lots")}>
                <ITText className="font-bold text-[11px]">{t("lots.title")}</ITText>
              </ITButton>
            </ITFlex>
          )}
        </ITCard>

        <ITCard title={t("overview.restockList")} className="!p-5 border border-slate-200 flex-1">
          {alerts.low.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          ) : (
            <ITFlex direction="column" gap={2}>
              {alerts.low.map((i) => (
                <ITFlex key={i.id} align="center" justify="between" gap={2}>
                  <ITText className="text-[12px] font-black text-slate-800">{i.name}</ITText>
                  <ITText className="text-[11px] text-slate-500">
                    {fmtQty(i.available)} / {fmtQty(i.minStock)} {i.unit.name}
                  </ITText>
                </ITFlex>
              ))}
              <ITButton variant="text" color="primary" size="sm" onClick={() => navigate("/kitchen/restock")}>
                <ITText className="font-bold text-[11px]">{t("restock.title")}</ITText>
              </ITButton>
            </ITFlex>
          )}
        </ITCard>
      </ITFlex>
    </ITFlex>
  );
}
