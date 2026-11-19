import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITSelect } from "@axzydev/axzy_ui_system";
import { FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, turnoverApi, type HotelProduct, type QueueItem } from "@entities/hotel-linen";
import { DialogHeader } from "@shared/ui/dialog-header";
import { useSuccessToast } from "@app/toast/useSuccessToast";
import QtyStepper from "./QtyStepper";

interface Props {
  /** Pedido por surtir al que se agrega; `null` = cerrado. */
  item: QueueItem | null;
  onClose: () => void;
  onDone: () => void;
}

/** Supervisora: agrega un artículo extra a un pedido que lavandería aún no surte (suma si ya estaba). */
export default function ExtraDialog({ item, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  const notify = useSuccessToast();
  const [catalog, setCatalog] = useState<HotelProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setProductId("");
    setQuantity(1);
    setError(null);
    hotelLinenApi
      .products()
      .then((all) => setCatalog(all.filter((p) => p.kind === "LINEN" && p.active)))
      .catch(() => undefined);
  }, [item]);

  const options = useMemo(() => catalog.map((p) => ({ value: p.id, label: [p.name, p.size].filter(Boolean).join(" · ") })), [catalog]);

  const submit = async () => {
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      await turnoverApi.addLines(item.id, [{ productId, quantity }]);
      notify(t("toast.extra"));
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={item !== null} onClose={onClose}>
      <DialogHeader icon={<FaPlus />} title={t("extra.title", { number: item?.room?.number ?? "" })} />
      <ITFlex direction="column" gap={3} className="min-w-[min(560px,90vw)]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITSelect name="extraProduct" label={t("extra.product")} options={options} value={productId} onChange={(e) => setProductId(e.target.value)} />
        <QtyStepper value={quantity} min={1} onChange={setQuantity} />
        <ITFlex justify="end" gap={2} className="mt-2">
          <ITButton variant="outlined" color="gray" className="!h-14 !px-6" label={t("cancel")} disabled={busy} onClick={onClose} />
          <ITButton variant="filled" color="primary" className="!h-14 !px-8 !text-[18px]" label={busy ? t("sending") : t("extra.add")} disabled={busy || !productId} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
