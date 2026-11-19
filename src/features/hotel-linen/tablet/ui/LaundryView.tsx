import { useState } from "react";
import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { laundryApi, type QueueItem } from "@entities/hotel-linen";
import { useSuccessToast } from "@app/toast/useSuccessToast";
import OrderCard from "./OrderCard";
import QtyStepper from "./QtyStepper";

interface Props {
  items: QueueItem[];
  reload: () => Promise<void>;
}

/** Tarjeta de un pedido por surtir: ajusta cantidades (por defecto todo lo pendiente) y "Listo". */
function FulfillCard({ item, reload }: { item: QueueItem; reload: () => Promise<void> }) {
  const { t } = useTranslation("hotel-linen-tablet");
  const notify = useSuccessToast();
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(item.lines.map((l) => [l.id, l.pendingQty])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const any = Object.values(qty).some((q) => q > 0);

  const ready = async () => {
    setBusy(true);
    setError(null);
    try {
      await laundryApi.fulfillRequest(item.id, { lines: item.lines.map((l) => ({ lineId: l.id, deliveredQty: qty[l.id] ?? 0 })) });
      notify(t("toast.ready"));
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OrderCard
      item={item}
      actions={
        <>
          {error && <ITAlert variant="error">{error}</ITAlert>}
          <ITButton variant="filled" color="primary" className="!h-16 !text-[18px]" label={busy ? t("sending") : t("laundry.ready")} disabled={busy || !any} onClick={() => void ready()} />
        </>
      }
    >
      {item.lines.map((l) => (
        <ITFlex key={l.id} justify="between" align="center" gap={3}>
          <ITFlex direction="column">
            <ITText className="text-[16px] font-bold">{l.product.name}</ITText>
            <ITText muted className="text-[12px]">{t("laundry.requested", { qty: l.pendingQty })}</ITText>
          </ITFlex>
          <QtyStepper value={qty[l.id] ?? 0} max={l.pendingQty} onChange={(q) => setQty((all) => ({ ...all, [l.id]: q }))} />
        </ITFlex>
      ))}
    </OrderCard>
  );
}

/** Lavandería: pendientes de surtir (habitación, artículos, antigüedad). */
export default function LaundryView({ items, reload }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  return (
    <ITFlex direction="column" gap={3}>
      <ITText className="text-[18px] font-bold">{t("laundry.pending")}</ITText>
      {items.length === 0 && <ITText muted>{t("laundry.none")}</ITText>}
      <ITFlex gap={3} wrap="wrap">
        {items.map((item) => (
          <ITFlex key={item.id} direction="column" className="min-w-[320px] flex-1">
            <FulfillCard item={item} reload={reload} />
          </ITFlex>
        ))}
      </ITFlex>
    </ITFlex>
  );
}
