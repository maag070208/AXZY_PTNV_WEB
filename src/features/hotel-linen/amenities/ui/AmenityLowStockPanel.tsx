import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { amenityApi, type AmenityLowStockItem } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
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

  const fetchRows = useMemo(() => makeClientTableFetch<AmenityLowStockItem>(() => Promise.resolve(items)), [items]);
  const columns: Column<AmenityLowStockItem>[] = useMemo(
    () => [
      {
        key: "product.name",
        label: t("lowStock.item"),
        type: "string",
        width: 260,
        filter: true,
        render: (i) => (
          <ITFlex direction="column">
            <ITText className="text-[12px] font-bold">{i.product.name}</ITText>
            <ITText muted className="font-mono text-[11px]">{`${i.product.code} · ${i.warehouse.name}`}</ITText>
          </ITFlex>
        ),
      },
      { key: "stock", label: t("lowStock.stock"), type: "number", width: 100, render: (i) => <ITText className={`${cell} font-bold text-[var(--color-danger)]`}>{fmt(i.stock)}</ITText> },
      { key: "minStock", label: t("lowStock.min"), type: "number", width: 100, render: (i) => <ITText className={cell}>{fmt(i.minStock)}</ITText> },
      { key: "maxStock", label: t("lowStock.max"), type: "number", width: 100, render: (i) => <ITText className={cell}>{i.maxStock ? fmt(i.maxStock) : "—"}</ITText> },
      { key: "suggested", label: t("lowStock.suggested"), type: "number", width: 110, render: (i) => <ITText className={cell}>{i.suggested ? fmt(i.suggested) : "—"}</ITText> },
    ],
    [t]
  );

  const empty = items.filter((i) => i.stock <= 0).length;

  return (
    <PanelCard title={t("lowStock.title")} description={t("lowStock.description")}>
      <ITFlex direction="column" gap={4}>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITText as="div" className="grid !grid-cols-2 gap-3 md:!grid-cols-4">
          <KpiTile size="sm" label={t("lowStock.kpiBelow")} value={items.length} icon={<FaExclamationTriangle size={12} />} tone={items.length > 0 ? "amber" : "neutral"} hint={items.length === 0 ? t("lowStock.none") : undefined} />
          <KpiTile size="sm" label={t("lowStock.kpiEmpty")} value={empty} icon={<FaBoxOpen size={12} />} tone={empty > 0 ? "rose" : "neutral"} />
        </ITText>
        {!loading && items.length === 0 && <ITText muted className="py-4 text-center">{t("lowStock.none")}</ITText>}
        {items.length > 0 && (
          <ITDataTable
            showViewToggle={false}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchRows as never}
            size="lg"
            defaultItemsPerPage={10}
            itemsPerPageOptions={[10, 25, 50]}
            layout="fixed"
            density="compact"
            rowHeight={52}
          />
        )}
      </ITFlex>
    </PanelCard>
  );
}
