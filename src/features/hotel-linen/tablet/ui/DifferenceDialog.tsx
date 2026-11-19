import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITFlex, ITDialog, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { turnoverApi, type QueueItem } from "@entities/hotel-linen";
import { DialogHeader } from "@shared/ui/dialog-header";
import { useSuccessToast } from "@app/toast/useSuccessToast";
import QtyStepper from "./QtyStepper";

interface Props {
  /** Pedido entregado sobre el que se reporta; `null` = cerrado. */
  item: QueueItem | null;
  onClose: () => void;
  onDone: () => void;
}

/** "Reportar diferencia": piezas que no llegaron (por renglón) y notas obligatorias; genera un ajuste de salida. */
export default function DifferenceDialog({ item, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  const notify = useSuccessToast();
  const [missing, setMissing] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMissing({});
    setNotes("");
    setError(null);
  }, [item]);

  const lines = Object.entries(missing).filter(([, qty]) => qty > 0);

  const submit = async () => {
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      await turnoverApi.reportDifference(item.id, { lines: lines.map(([productId, missingQty]) => ({ productId, missingQty })), notes: notes.trim() });
      notify(t("toast.difference"));
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={item !== null} onClose={onClose}>
      <DialogHeader icon={<FaExclamationTriangle />} title={t("difference.title", { number: item?.room?.number ?? "" })} subtitle={t("difference.subtitle")} />
      <ITFlex direction="column" gap={3} className="min-w-[min(560px,90vw)]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {item?.lines.map((l) => (
          <ITFlex key={l.id} justify="between" align="center" gap={3}>
            <ITFlex direction="column">
              <ITText className="text-[18px] font-bold">{l.product.name}</ITText>
              <ITText muted className="text-[12px]">{t("difference.missing")} / {l.receivedQty}</ITText>
            </ITFlex>
            <QtyStepper value={missing[l.product.id] ?? 0} max={l.receivedQty} onChange={(q) => setMissing((m) => ({ ...m, [l.product.id]: q }))} />
          </ITFlex>
        ))}
        <ITInput name="differenceNotes" label={t("difference.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <ITFlex justify="end" gap={2} className="mt-2">
          <ITButton variant="outlined" color="gray" className="!h-14 !px-6" label={t("cancel")} disabled={busy} onClick={onClose} />
          <ITButton variant="filled" color="primary" className="!h-14 !px-8 !text-[18px]" label={busy ? t("sending") : t("difference.send")} disabled={busy || lines.length === 0 || !notes.trim()} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
