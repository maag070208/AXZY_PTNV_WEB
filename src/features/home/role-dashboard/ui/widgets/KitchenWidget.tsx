import { useTranslation } from "react-i18next";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaUtensils } from "react-icons/fa";
import { kitchenApi, fmtQty } from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/** Almacén de cocina: qué reabastecer y qué usar primero (el tablero del chef). */
export default function KitchenWidget() {
  const { t: tt } = useTranslation("kitchen");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(kitchenApi.alerts);

  return (
    <WidgetCard
      title={t("title")}
      icon={<FaUtensils size={14} />}
      iconClass="bg-[#0D5777]"
      to="/kitchen"
      loading={loading}
      error={error}
      onRetry={reload}
    >
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={data.counts.low} label={t("overview.low")} tone="text-amber-600" />
            <Metric value={data.counts.expiring} label={t("overview.expiring")} tone="text-orange-600" />
            <Metric value={data.counts.expired} label={t("overview.expired")} tone="text-rose-600" />
            <Metric value={data.counts.over} label={t("overview.over")} tone="text-sky-600" />
          </ITFlex>

          <SectionLabel>{t("overview.useFirst")}</SectionLabel>
          {data.expiring.length + data.expired.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">{t("overview.empty")}</ITText>
          ) : (
            [...data.expired, ...data.expiring].slice(0, 5).map((l) => (
              <ITFlex key={l.id} justify="between" className="border-b border-slate-100 py-1">
                <ITFlex direction="column" gap={0}>
                  <ITText className="text-[11px] font-bold text-slate-800">{l.item.name}</ITText>
                  <ITText className="text-[9px] uppercase text-slate-400">{l.lotCode}</ITText>
                </ITFlex>
                <ITText className={`text-[11px] font-black ${l.expiresAt < data.today ? "text-rose-600" : "text-orange-600"}`}>
                  {l.expiresAt}
                </ITText>
              </ITFlex>
            ))
          )}

          <SectionLabel>{t("overview.restockList")}</SectionLabel>
          {data.low.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">{t("overview.empty")}</ITText>
          ) : (
            data.low.slice(0, 5).map((i) => (
              <ITFlex key={i.id} justify="between" className="border-b border-slate-100 py-1">
                <ITText className="text-[11px] font-bold text-slate-800">{i.name}</ITText>
                <ITText className="text-[11px] text-slate-500">
                  {fmtQty(i.available)} / {fmtQty(i.minStock)} {i.unit.name}
                </ITText>
              </ITFlex>
            ))
          )}
        </>
      )}
    </WidgetCard>
  );
}
