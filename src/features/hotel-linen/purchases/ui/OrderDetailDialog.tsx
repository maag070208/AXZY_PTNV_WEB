import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITGrid, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaFilePdf } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { purchaseApi, type PurchaseOrderDetail } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dateTime, day, money, pct, qty } from "../lib";
import { downloadHotelPurchaseOrderPdf } from "../pdf/downloadPdf";
import { OrderStatusChip } from "./PurchaseChips";

interface Props {
  /** OC a mostrar; `null` = cerrado. */
  orderId: string | null;
  reloadKey: number;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (order: PurchaseOrderDetail) => void;
  onReceive: (order: PurchaseOrderDetail) => void;
}

/** Detalle de la OC con totales, recepciones y acciones (aprobar, cancelar, cerrar con faltante, recibir, PDF). */
export default function OrderDetailDialog({ orderId, reloadKey, onClose, onChanged, onEdit, onReceive }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const canCreate = useCan("hotel_purchase.create");
  const canApprove = useCan("hotel_purchase.approve");
  const canReceive = useCan("hotel_purchase.receive");
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setOrder(null);
    setError(null);
    setClosing(false);
    setCloseNotes("");
    purchaseApi
      .order(orderId)
      .then((d) => active && setOrder(d))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [orderId, reloadKey]);

  const run = async (action: () => Promise<PurchaseOrderDetail>) => {
    setBusy(true);
    setError(null);
    try {
      setOrder(await action());
      setClosing(false);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const receivable = !!order && (order.status === "APPROVED" || order.status === "PARTIALLY_RECEIVED");

  return (
    <ITDialog isOpen={orderId !== null} onClose={onClose} title={order ? t("detail.title", { folio: order.folio }) : t("detail.loading")}>
      <ITFlex direction="column" gap={3} className="min-w-[820px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {!order && !error && <ITText muted>{t("common.loading")}</ITText>}
        {order && (
          <>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("detail.status")}</ITText>
                <OrderStatusChip status={order.status} />
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("form.supplier")}</ITText>
                <ITText className="text-[12px] font-bold">{order.supplier?.name ?? t("orders.noSupplier")}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("form.warehouse")}</ITText>
                <ITText className="text-[12px]">{order.warehouse?.name ?? "—"}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("form.expected")}</ITText>
                <ITText className="text-[12px]">{day(order.expectedDate)}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("detail.createdBy")}</ITText>
                <ITText className="text-[12px]">{`${order.createdBy?.name ?? "—"} · ${day(order.createdAt)}`}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("detail.approvedBy")}</ITText>
                <ITText className="text-[12px]">{order.approvedBy ? `${order.approvedBy.name} · ${day(order.approvedAt)}` : "—"}</ITText>
              </ITGrid>
            </ITGrid>

            <ITFlex direction="column" gap={1}>
              <ITGrid container columns={12} spacing={2}>
                {[t("form.product"), t("form.quantity"), t("detail.received"), t("form.unitCost"), t("form.tax"), t("form.total")].map((h, i) => (
                  <ITGrid key={h} item xs={i === 0 ? 4 : 1} md={i === 0 ? 4 : 1.6}>
                    <ITText muted className="text-[11px] font-bold uppercase">{h}</ITText>
                  </ITGrid>
                ))}
              </ITGrid>
              {order.lines.map((l) => (
                <ITGrid key={l.id} container columns={12} spacing={2} className="items-center">
                  <ITGrid item xs={4} md={4}>
                    <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                    <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
                  </ITGrid>
                  <ITGrid item xs={1} md={1.6}><ITText className="text-[12px] tabular-nums">{qty(l.quantity)}</ITText></ITGrid>
                  <ITGrid item xs={1} md={1.6}><ITText className="text-[12px] tabular-nums">{qty(l.receivedQuantity)}</ITText></ITGrid>
                  <ITGrid item xs={1} md={1.6}><ITText className="text-[12px] tabular-nums">{money(l.unitCost)}</ITText></ITGrid>
                  <ITGrid item xs={1} md={1.6}><ITText className="text-[12px] tabular-nums">{pct(l.taxRate)}</ITText></ITGrid>
                  <ITGrid item xs={1} md={1.6}><ITText className="text-[12px] font-bold tabular-nums">{money(l.total)}</ITText></ITGrid>
                </ITGrid>
              ))}
            </ITFlex>

            <ITFlex direction="column" gap={1} className="self-end text-right">
              <ITText className="text-[12px] tabular-nums">{`${t("form.subtotal")}: ${money(order.subtotal)}`}</ITText>
              {order.taxes.map((tx) => (
                <ITText key={tx.rate} className="text-[12px] tabular-nums">{`${t("pdf.taxLine", { rate: pct(tx.rate) })}: ${money(tx.tax)}`}</ITText>
              ))}
              <ITText className="text-[14px] font-bold tabular-nums">{`${t("form.total")}: ${money(order.total)}`}</ITText>
            </ITFlex>

            {order.notes && <ITText muted className="text-[12px]">{`${t("form.notes")}: ${order.notes}`}</ITText>}
            {order.closeNotes && <ITAlert variant="warning">{`${t("detail.closedReason")}: ${order.closeNotes}`}</ITAlert>}

            {order.receipts.length > 0 && (
              <ITFlex direction="column" gap={1}>
                <ITText className="text-[12px] font-bold uppercase">{t("detail.receipts")}</ITText>
                {order.receipts.map((r) => (
                  <ITText key={r.id} className="text-[12px]">
                    {`${dateTime(r.date)} · ${t("receive.invoice")} ${r.invoiceNumber} · ${r.receivedBy?.name ?? "—"} · ${t("receive.accepted")} ${qty(
                      r.lines.reduce((s, l) => s + l.acceptedQty, 0)
                    )} · ${t("receive.held")} ${qty(r.lines.reduce((s, l) => s + l.heldQty, 0))}`}
                  </ITText>
                ))}
              </ITFlex>
            )}

            {closing && (
              <ITFlex direction="column" gap={2}>
                <ITAlert variant="info">{t("detail.closeHint")}</ITAlert>
                <ITTextarea name="poCloseNotes" label={t("detail.closeReason")} rows={2} value={closeNotes} onChange={(e) => setCloseNotes(e)} />
                <ITFlex justify="end" gap={2}>
                  <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={() => setClosing(false)} />
                  <ITButton
                    variant="filled"
                    color="primary"
                    label={t("detail.confirmClose")}
                    disabled={busy || !closeNotes.trim()}
                    onClick={() => void run(() => purchaseApi.closeOrder(order.id, closeNotes.trim()))}
                  />
                </ITFlex>
              </ITFlex>
            )}

            <ITFlex justify="end" gap={2} wrap="wrap">
              <ITButton variant="outlined" color="secondary" icon={<FaFilePdf size={12} />} label={t("detail.pdf")} onClick={() => void downloadHotelPurchaseOrderPdf(order)} />
              {order.status === "DRAFT" && canCreate && <ITButton variant="outlined" color="primary" label={t("detail.edit")} onClick={() => onEdit(order)} />}
              {order.status === "DRAFT" && canApprove && (
                <ITButton variant="filled" color="primary" label={t("detail.approve")} disabled={busy} onClick={() => void run(() => purchaseApi.approveOrder(order.id))} />
              )}
              {(order.status === "DRAFT" || (order.status === "APPROVED" && order.receipts.length === 0)) && (canCreate || canApprove) && (
                <ITButton variant="outlined" color="error" label={t("detail.cancel")} disabled={busy} onClick={() => void run(() => purchaseApi.cancelOrder(order.id))} />
              )}
              {receivable && canReceive && <ITButton variant="filled" color="primary" label={t("detail.receive")} onClick={() => onReceive(order)} />}
              {receivable && canApprove && !closing && order.receipts.length > 0 && (
                <ITButton variant="outlined" color="warning" label={t("detail.close")} onClick={() => setClosing(true)} />
              )}
            </ITFlex>
          </>
        )}
      </ITFlex>
    </ITDialog>
  );
}
