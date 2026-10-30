import { useTranslation } from "react-i18next";
import { LuUtensils } from "react-icons/lu";
import { kitchenApi, fmtQty } from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import { useWidgetData } from "../../model/useWidgetData";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Almacén de cocina: qué reabastecer y qué usar primero (el tablero del chef). */
export default function KitchenWidget() {
  const { t: tt } = useTranslation("kitchen");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(kitchenApi.alerts);

  return (
    <WidgetCard title={t("title")} icon={<LuUtensils size={16} />} to="/kitchen" loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <MetricGrid>
            <Metric value={data.counts.low} label={t("overview.low")} tone={alarmTone(data.counts.low, "amber")} />
            <Metric value={data.counts.expiring} label={t("overview.expiring")} tone={alarmTone(data.counts.expiring, "orange")} />
            <Metric value={data.counts.expired} label={t("overview.expired")} tone={alarmTone(data.counts.expired, "rose")} />
            <Metric value={data.counts.over} label={t("overview.over")} tone={alarmTone(data.counts.over, "sky")} />
          </MetricGrid>

          <SectionLabel>{t("overview.useFirst")}</SectionLabel>
          {data.expiring.length + data.expired.length === 0 ? (
            <EmptyText>{t("overview.empty")}</EmptyText>
          ) : (
            <RowList>
              {[...data.expired, ...data.expiring].slice(0, 5).map((l) => (
                <ListRow
                  key={l.id}
                  title={l.item.name}
                  subtitle={l.lotCode}
                  right={
                    <span style={{ color: l.expiresAt < data.today ? "var(--color-danger)" : undefined }} className="font-bold">
                      {l.expiresAt}
                    </span>
                  }
                />
              ))}
            </RowList>
          )}

          <SectionLabel>{t("overview.restockList")}</SectionLabel>
          {data.low.length === 0 ? (
            <EmptyText>{t("overview.empty")}</EmptyText>
          ) : (
            <RowList>
              {data.low.slice(0, 5).map((i) => (
                <ListRow
                  key={i.id}
                  title={i.name}
                  right={`${fmtQty(i.available)} / ${fmtQty(i.minStock)} ${i.unit.name}`}
                />
              ))}
            </RowList>
          )}
        </>
      )}
    </WidgetCard>
  );
}
