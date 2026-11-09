import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITGrid, ITInput, ITInputNumber, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { purchaseApi, type PurchaseOrderDetail } from "@entities/hotel-linen";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { qty } from "../lib";

interface Draft {
  received: number | null;
  accepted: number | null;
  held: number | null;
  reason: string;
}

interface Props {
  /** OC a recibir; `null` = cerrado. */
  order: PurchaseOrderDetail | null;
  onClose: () => void;
  onDone: () => void;
}

/** Recepción contra factura y OC: por renglón recibido / aceptado / apartado (con motivo). */
export default function ReceiveDialog({ order, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const requestKey = useRequestKey();
  const [invoice, setInvoice] = useState("");
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    setInvoice("");
    setNotes("");
    setError(null);
    // Por defecto llega todo lo pendiente y se acepta completo.
    setDrafts(Object.fromEntries(order.lines.map((l) => [l.id, { received: l.pendingQuantity, accepted: l.pendingQuantity, held: 0, reason: "" }])));
  }, [order]);

  const patch = (id: string, change: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...change } }));
  const setReceived = (id: string, value: number | null) => {
    const d = drafts[id];
    patch(id, { received: value, accepted: Math.max(0, (value ?? 0) - (d?.held ?? 0)) });
  };
  const setHeld = (id: string, value: number | null) => {
    const d = drafts[id];
    patch(id, { held: value, accepted: Math.max(0, (d?.received ?? 0) - (value ?? 0)) });
  };

  const rows = order?.lines ?? [];
  const lineErrors = rows.map((l) => {
    const d = drafts[l.id];
    if (!d) return false;
    const over = (d.accepted ?? 0) + (d.held ?? 0) > (d.received ?? 0);
    const noReason = (d.held ?? 0) > 0 && !d.reason.trim();
    return over || noReason;
  });
  const anyQty = rows.some((l) => (drafts[l.id]?.received ?? 0) > 0);
  const exceeds = rows.some((l) => {
    const d = drafts[l.id];
    return !!d && l.receivedQuantity + (d.accepted ?? 0) + (d.held ?? 0) > l.quantity + 1e-9;
  });
  const valid = invoice.trim() !== "" && anyQty && !lineErrors.some(Boolean) && (!exceeds || notes.trim() !== "");

  const submit = async () => {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        invoiceNumber: invoice.trim(),
        notes: notes.trim() || null,
        lines: rows.map((l) => {
          const d = drafts[l.id];
          return { lineId: l.id, receivedQty: d?.received ?? 0, acceptedQty: d?.accepted ?? 0, heldQty: d?.held ?? 0, holdReason: d?.reason.trim() || null };
        }),
      };
      await purchaseApi.receive(order.id, body, requestKey(body));
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={order !== null} onClose={onClose} title={order ? t("receive.title", { folio: order.folio }) : ""}>
      <ITFlex direction="column" gap={3} className="min-w-[860px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITText muted className="text-[12px]">{t("receive.hint")}</ITText>
        <ITInput name="receiveInvoice" label={t("receive.invoice")} value={invoice} onChange={(e) => setInvoice(e.target.value)} />
        {rows.map((l, index) => {
          const d = drafts[l.id];
          return (
            <ITGrid key={l.id} container columns={12} spacing={3} className="items-end">
              <ITGrid item xs={12} md={3}>
                <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">{`${l.product.code} · ${t("receive.pending")} ${qty(l.pendingQuantity)}`}</ITText>
              </ITGrid>
              <ITGrid item xs={4} md={2}>
                <ITInputNumber name={`recvQty${index}`} label={t("receive.received")} decimals={2} min={0} value={d?.received ?? null} onChange={(v) => setReceived(l.id, v ?? null)} />
              </ITGrid>
              <ITGrid item xs={4} md={2}>
                <ITInputNumber name={`recvAcc${index}`} label={t("receive.accepted")} decimals={2} min={0} value={d?.accepted ?? null} onChange={(v) => patch(l.id, { accepted: v ?? null })} />
              </ITGrid>
              <ITGrid item xs={4} md={2}>
                <ITInputNumber name={`recvHeld${index}`} label={t("receive.held")} decimals={2} min={0} value={d?.held ?? null} onChange={(v) => setHeld(l.id, v ?? null)} />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                {(d?.held ?? 0) > 0 && (
                  <ITInput name={`recvReason${index}`} label={t("receive.reason")} value={d?.reason ?? ""} onChange={(e) => patch(l.id, { reason: e.target.value })} />
                )}
              </ITGrid>
            </ITGrid>
          );
        })}
        {lineErrors.some(Boolean) && <ITAlert variant="warning">{t("receive.lineInvalid")}</ITAlert>}
        {exceeds && <ITAlert variant="warning">{t("receive.overHint")}</ITAlert>}
        <ITTextarea name="receiveNotes" label={t("receive.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("receive.confirm")} disabled={busy || !valid} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
