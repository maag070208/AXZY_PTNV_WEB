import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITBadget, ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  fmtQty,
  lotStatusColor,
  movementTypeColor,
  stockStatusColor,
  type KitchenItemDetail,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import { LottieLoader } from "@shared/ui/lottie-loader";

const th = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const td = "text-[11px] text-slate-600";

export default function KitchenItemDetailPanel() {
  const { id } = useParams();
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
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

  const kpis = [
    { key: "available", value: `${fmtQty(item.available)} ${item.unit.name}` },
    { key: "suggested", value: fmtQty(item.suggested) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex align="center" gap={2}>
          <ITButton variant="text" color="gray" size="sm" onClick={() => navigate("/kitchen/items")}>
            <FaArrowLeft size={12} />
          </ITButton>
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[14px] font-black text-slate-800">
              {item.code} · {item.name}
            </ITText>
            <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {item.category.name} · {dyn(t)(`kinds.${item.kind}`)} · {item.unit.name}
            </ITText>
          </ITFlex>
          <ITBadget color={stockStatusColor(item.stockStatus)} size="sm">
            {dyn(t)(`stockStatus.${item.stockStatus}`)}
          </ITBadget>
        </ITFlex>
        <ITFlex gap={2}>
          {kpis.map((k) => (
            <ITFlex key={k.key} direction="column" gap={0} className="rounded-xl border border-slate-200 px-4 py-2">
              <ITText className="text-[15px] font-black text-slate-800">{k.value}</ITText>
              <ITText className={th}>{dyn(t)(`items.${k.key}`)}</ITText>
            </ITFlex>
          ))}
        </ITFlex>
      </ITFlex>

      <ITCard title={t("items.lots")} className="!p-5 border border-slate-200">
        {item.lots.length === 0 ? (
          <ITText className={td}>—</ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            <ITFlex className="border-b border-slate-100 pb-1" gap={3}>
              <ITText className={th}>{t("columns.lotCode")}</ITText>
              <ITText className={th}>{t("columns.expiresAt")}</ITText>
              <ITText className={th}>{t("columns.supplier")}</ITText>
              <ITText className={th}>{t("columns.onHand")}</ITText>
              <ITText className={th}>{t("columns.status")}</ITText>
            </ITFlex>
            {item.lots.map((l) => (
              <ITFlex key={l.id} gap={3} className="items-center">
                <ITText className={`${td} font-mono`}>{l.lotCode}</ITText>
                <ITText className={td}>{l.expiresAt ?? "—"}</ITText>
                <ITText className={td}>{l.supplier?.name ?? "—"}</ITText>
                <ITText className={`${td} font-bold`}>
                  {fmtQty(l.onHand)} {item.unit.name}
                </ITText>
                <ITBadget color={lotStatusColor(l.status)} size="sm">
                  {dyn(t)(`lotStatus.${l.status}`)}
                </ITBadget>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </ITCard>

      <ITCard title={t("items.lastMovements")} className="!p-5 border border-slate-200">
        {item.movements.length === 0 ? (
          <ITText className={td}>—</ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {item.movements.map((m, i) => (
              <ITFlex key={`${m.movementId}-${i}`} align="center" gap={3}>
                <ITBadget color={movementTypeColor(m.type)} size="sm">
                  {dyn(t)(`movementTypes.${m.type}`)}
                </ITBadget>
                <ITText className={td}>{new Date(m.date).toLocaleString("es-MX")}</ITText>
                <ITText className={`${td} font-mono`}>{m.lotCode}</ITText>
                <ITText className={`${td} font-bold`}>
                  {fmtQty(m.quantity)} {item.unit.name}
                </ITText>
                <ITText className={td}>{m.createdBy}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </ITCard>
    </ITFlex>
  );
}
