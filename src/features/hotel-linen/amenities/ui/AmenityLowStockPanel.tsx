import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { amenityApi, type AmenityLowStockItem } from "@entities/hotel-linen";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { fmt } from "../lib";

const cell = "text-[12px] tabular-nums text-right";

/** Bodega de amenidades (AME) con productos en o bajo su mínimo. */
export default function AmenityLowStockPanel() {
  const { t } = useTranslation("hotel-linen-amenity");
  const [items, setItems] = useState<AmenityLowStockItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    amenityApi
      .lowStock()
      .then((list) => {
        setItems(list);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const empty = items.filter((i) => i.stock <= 0).length;

  return (
    <PanelCard title={t("lowStock.title")} description={t("lowStock.description")}>
      <ITFlex direction="column" gap={4}>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={6} md={3}>
            <KpiTile label={t("lowStock.kpiBelow")} value={items.length} icon={<FaExclamationTriangle size={14} />} tone={items.length > 0 ? "amber" : "emerald"} />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <KpiTile label={t("lowStock.kpiEmpty")} value={empty} icon={<FaBoxOpen size={14} />} tone={empty > 0 ? "rose" : "neutral"} />
          </ITGrid>
        </ITGrid>
        {!loading && items.length === 0 && <ITText muted>{t("lowStock.none")}</ITText>}
        {items.length > 0 && (
          <ITFlex direction="column" gap={2}>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={4}><ITText muted className="text-[11px]">{t("lowStock.item")}</ITText></ITGrid>
              {(["stock", "min", "max", "suggested"] as const).map((k) => (
                <ITGrid key={k} item xs={2}>
                  <ITText muted className="text-right text-[11px]">{t(`lowStock.${k}`)}</ITText>
                </ITGrid>
              ))}
            </ITGrid>
            {items.map((i) => (
              <ITGrid key={`${i.warehouse.id}-${i.product.id}`} container columns={12} spacing={3} className="items-center">
                <ITGrid item xs={4}>
                  <ITText className="text-[12px] font-bold">{i.product.name}</ITText>
                  <ITText muted className="font-mono text-[11px]">{`${i.product.code} · ${i.warehouse.name}`}</ITText>
                </ITGrid>
                <ITGrid item xs={2}><ITText className={`${cell} font-bold text-[var(--color-danger)]`}>{fmt(i.stock)}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText className={cell}>{fmt(i.minStock)}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText className={cell}>{i.maxStock ? fmt(i.maxStock) : "—"}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText className={cell}>{i.suggested ? fmt(i.suggested) : "—"}</ITText></ITGrid>
              </ITGrid>
            ))}
          </ITFlex>
        )}
      </ITFlex>
    </PanelCard>
  );
}
