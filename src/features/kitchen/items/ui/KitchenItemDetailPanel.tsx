import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ITAlert, ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxes, FaCoins, FaShoppingCart, FaCalendarTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import {
  StockBar,
  kitchenApi,
  fmtQty,
  lotStatusColor,
  movementTypeColor,
  stockStatusColor,
  type KitchenItemDetail,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { PanelCard } from "@shared/ui/panel-card";

const th = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const LOT_GRID = "grid grid-cols-[1.4fr_1fr_1.4fr_1fr_auto] items-center gap-3";
const MOVE_GRID = "grid grid-cols-[auto_1.2fr_1fr_1fr_1.2fr] items-center gap-3";
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Detalle de un artículo: indicadores, existencia contra mínimo/máximo, lotes y últimos movimientos. */
export default function KitchenItemDetailPanel() {
  const { id } = useParams();
  const { t } = useTranslation("kitchen");
  const [item, setItem] = useState<KitchenItemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    kitchenApi
      .item(id)
      .then(setItem)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ITFlex justify="center" className="py-16">
        <LottieLoader size="lg" />
      </ITFlex>
    );
  }
  if (error || !item) return <ITAlert variant="error">{error ?? t("items.notFound")}</ITAlert>;

  const unit = item.unit.name;

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex direction="column" gap={0}>
          <ITFlex align="center" gap={2}>
            <ITText className="text-[18px] font-black text-slate-800">{item.name}</ITText>
            <ITBadget color={stockStatusColor(item.stockStatus)} size="lg">
              {dyn(t)(`stockStatus.${item.stockStatus}`)}
            </ITBadget>
            {!item.active && (
              <ITBadget color="gray" size="lg">
                {t("common.inactive")}
              </ITBadget>
            )}
          </ITFlex>
          <ITText className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <span className="font-mono">{item.code}</span> · {item.category.name} · {dyn(t)(`kinds.${item.kind}`)} · {dyn(t)(`storages.${item.storage}`)}
          </ITText>
        </ITFlex>
      </ITFlex>

      <div className="grid !grid-cols-2 gap-3 md:!grid-cols-4">
        <KpiTile label={t("columns.available")} value={`${fmtQty(item.available)} ${unit}`} icon={<FaBoxes size={15} />} tone={item.stockStatus === "LOW" ? "amber" : "sky"} />
        <KpiTile label={t("items.expired")} value={`${fmtQty(item.expired)} ${unit}`} icon={<FaCalendarTimes size={15} />} tone={item.expired > 0 ? "rose" : "neutral"} />
        <KpiTile label={t("items.suggested")} value={`${fmtQty(item.suggested)} ${unit}`} icon={<FaShoppingCart size={15} />} tone="violet" />
        <KpiTile label={t("items.stockValue")} value={money(item.stockValue)} icon={<FaCoins size={15} />} tone="emerald" />
      </div>

      <PanelCard title={t("items.infoTitle")}>
        <ITFlex align="center" justify="between" gap={3} className="mb-2">
          <ITText className={th}>{t("items.limits")}</ITText>
          <ITText className="text-[12px] font-bold text-slate-700">
            {fmtQty(item.available)} / {fmtQty(item.minStock)}
            {item.maxStock != null ? ` – ${fmtQty(item.maxStock)}` : ""} {unit}
          </ITText>
        </ITFlex>
        <StockBar available={item.available} min={item.minStock} max={item.maxStock} />
        {item.notes && <ITText className="mt-3 block text-[12px] text-slate-500">{item.notes}</ITText>}
      </PanelCard>

      <div className="grid gap-4 xl:!grid-cols-2">
        <PanelCard title={t("items.lots")}>
          {item.lots.length === 0 ? (
            <ITText className="text-[12px] text-slate-400">—</ITText>
          ) : (
            <div>
              <div className={`${LOT_GRID} border-b border-slate-100 pb-2`}>
                <span className={th}>{t("columns.lotCode")}</span>
                <span className={th}>{t("columns.expiresAt")}</span>
                <span className={th}>{t("columns.supplier")}</span>
                <span className={th}>{t("columns.onHand")}</span>
                <span className={th}>{t("columns.status")}</span>
              </div>
              {item.lots.map((l) => (
                <div key={l.id} className={`${LOT_GRID} border-b border-slate-50 py-2.5 last:border-0`}>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{l.lotCode}</span>
                  <span className="text-[11px] text-slate-600">{l.expiresAt ?? "—"}</span>
                  <span className="truncate text-[11px] text-slate-600">{l.supplier?.name ?? "—"}</span>
                  <span className="text-[12px] font-black text-slate-800">
                    {fmtQty(l.onHand)} {unit}
                  </span>
                  <ITBadget color={lotStatusColor(l.status)} size="sm">
                    {dyn(t)(`lotStatus.${l.status}`)}
                  </ITBadget>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title={t("items.lastMovements")}>
          {item.movements.length === 0 ? (
            <ITText className="text-[12px] text-slate-400">—</ITText>
          ) : (
            <div>
              {item.movements.map((m, i) => (
                <div key={`${m.movementId}-${i}`} className={`${MOVE_GRID} border-b border-slate-50 py-2.5 last:border-0`}>
                  <ITBadget color={movementTypeColor(m.type)} size="sm">
                    {dyn(t)(`movementTypes.${m.type}`)}
                  </ITBadget>
                  <span className="text-[11px] text-slate-600">{new Date(m.date).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
                  <span className="font-mono text-[11px] text-slate-500">{m.lotCode}</span>
                  <span className="text-[12px] font-black text-slate-800">
                    {fmtQty(m.quantity)} {unit}
                  </span>
                  <span className="truncate text-[11px] text-slate-500">{m.createdBy}</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </ITFlex>
  );
}
