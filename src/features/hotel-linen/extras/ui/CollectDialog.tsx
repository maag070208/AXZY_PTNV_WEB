import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInputNumber, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, type RoomExtra } from "@entities/hotel-linen";

interface Props {
  extra: RoomExtra | null;
  onClose: () => void;
  onDone: () => void;
}

/** Recolección: cuenta lo recogido; lo que falta queda como faltante y avisa a Recepción. */
export default function CollectDialog({ extra, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const [qty, setQty] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQty(extra ? extra.quantity : null);
    setError(null);
  }, [extra]);

  const valid = !!extra && qty !== null && qty >= 0 && qty <= extra.quantity;
  const missing = extra && qty !== null ? Math.max(0, extra.quantity - qty) : 0;

  const submit = async () => {
    if (!extra || !valid) return;
    setBusy(true);
    setError(null);
    try {
      await receptionApi.collectExtra(extra.id, qty as number);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={extra !== null} onClose={onClose} title={t("extras.collect.title", { room: extra?.room.number ?? "" })}>
      <ITFlex direction="column" gap={3} className="min-w-[380px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITText>{t("extras.collect.delivered", { count: extra?.quantity ?? 0, product: extra?.product.name ?? "" })}</ITText>
        <ITInputNumber name="collectQty" label={t("extras.collect.quantity")} decimals={0} min={0} value={qty} onChange={(v) => setQty(v ?? null)} />
        {missing > 0 && <ITAlert variant="warning">{t("extras.collect.missing", { count: missing })}</ITAlert>}
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("extras.collect.confirm")} disabled={busy || !valid} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
