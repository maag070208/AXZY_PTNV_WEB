import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaArrowLeft, FaCheck, FaFileInvoice, FaPaperPlane, FaPen, FaTruckLoading, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { fmtQty } from "@entities/kitchen";
import { usePurchaseOrder } from "../model/usePurchaseOrder";
import PurchaseOrderStatusBadge from "./PurchaseOrderStatusBadge";
import PurchaseOrderReceiveDialog from "./PurchaseOrderReceiveDialog";

const HEAD = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Detalle de una orden: líneas con existencias, recepciones y acciones por estado. */
export default function PurchaseOrderDetailPanel({ id }: { id?: string }) {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const fx = usePurchaseOrder(id);
  const canCreate = useCan("purchase_orders.create");
  const canApprove = useCan("purchase_orders.approve");
  const canReceive = useCan("kitchen.stock_in");
  const canRegisterInvoice = useCan("invoices.register");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (fx.loading || !fx.order) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{fx.error ?? t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const order = fx.order;
  const req = (v: string | null) => (v ? new Date(v).toLocaleString("es-MX") : "—");
  const receivable = ["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(order.status);
  const cancellable = ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(order.status);

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITFlex align="center" justify="between" wrap="wrap" gap={3}>
        <ITFlex align="center" gap={3}>
          <ITButton variant="text" color="gray" size="sm" onClick={() => navigate("/kitchen/purchase-orders")}>
            <FaArrowLeft size={12} />
          </ITButton>
          <ITFlex direction="column" gap={0}>
            <ITFlex align="center" gap={2}>
              <ITText className="text-[16px] font-black text-slate-800">{order.number}</ITText>
              <PurchaseOrderStatusBadge status={order.status} />
            </ITFlex>
            <ITText className="text-[11px] text-slate-500">
              {order.supplier.name} · {t("purchaseOrders.columns.expectedAt")}: {order.expectedAt ?? "—"}
            </ITText>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" gap={2} wrap="wrap">
          {order.status === "DRAFT" && canCreate && (
            <ITButton variant="outlined" color="secondary" onClick={() => navigate(`/kitchen/purchase-orders/${order.id}/edit`)}>
              <ITFlex align="center" gap={1}>
                <FaPen size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.edit")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {order.status === "DRAFT" && canApprove && (
            <ITButton variant="filled" color="success" disabled={fx.busy} onClick={() => void fx.approve()}>
              <ITFlex align="center" gap={1}>
                <FaCheck size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.approve")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {order.status === "APPROVED" && canCreate && (
            <ITButton variant="filled" color="primary" disabled={fx.busy} onClick={() => void fx.send()}>
              <ITFlex align="center" gap={1}>
                <FaPaperPlane size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.send")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {receivable && canReceive && (
            <ITButton variant="filled" color="primary" disabled={fx.busy} onClick={() => setReceiveOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaTruckLoading size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.receive")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {(order.status === "PARTIALLY_RECEIVED" || order.status === "RECEIVED") && canRegisterInvoice && (
            <ITButton
              variant="outlined"
              color="primary"
              onClick={() => navigate("/kitchen/invoices/new", { state: { purchaseOrderId: order.id } })}
            >
              <ITFlex align="center" gap={1}>
                <FaFileInvoice size={11} />
                <ITText className="font-bold text-[11px]">{t("invoices.registerFromOrder")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {cancellable && canCreate && (
            <ITButton variant="outlined" color="error" disabled={fx.busy} onClick={() => setCancelOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaUndo size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.cancel")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      </ITFlex>

      <ITCard className="!p-5 border border-slate-200">
        <ITGrid container columns={12} spacing={4}>
          {[
            { label: t("purchaseOrders.columns.createdBy"), value: order.createdBy.name },
            { label: t("purchaseOrders.columns.createdAt"), value: req(order.createdAt) },
            { label: t("purchaseOrders.status.APPROVED"), value: order.approvedBy ? `${order.approvedBy.name} · ${req(order.approvedAt)}` : "—" },
            { label: t("purchaseOrders.status.SENT"), value: req(order.sentAt) },
          ].map((f) => (
            <ITGrid key={f.label} item xs={12} md={3}>
              <ITText className={`${HEAD} block`}>{f.label}</ITText>
              <ITText className="text-[12px] font-bold text-slate-700">{f.value}</ITText>
            </ITGrid>
          ))}
          {order.notes && (
            <ITGrid item xs={12}>
              <ITText className={`${HEAD} block`}>{t("purchaseOrders.form.notes")}</ITText>
              <ITText className="text-[12px] text-slate-600">{order.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </ITCard>

      <ITCard className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={2}>
          <ITGrid container columns={12} spacing={2} className="hidden border-b border-slate-100 pb-2 md:grid">
            <ITGrid item md={3}><ITText className={HEAD}>{t("purchaseOrders.columns.item")}</ITText></ITGrid>
            <ITGrid item md={1}><ITText className={HEAD}>{t("purchaseOrders.columns.quantity")}</ITText></ITGrid>
            <ITGrid item md={1}><ITText className={HEAD}>{t("purchaseOrders.columns.received")}</ITText></ITGrid>
            <ITGrid item md={1}><ITText className={HEAD}>{t("purchaseOrders.columns.pending")}</ITText></ITGrid>
            <ITGrid item md={2}><ITText className={HEAD}>{t("purchaseOrders.columns.available")}</ITText></ITGrid>
            <ITGrid item md={2}><ITText className={HEAD}>{t("purchaseOrders.columns.inTransit")}</ITText></ITGrid>
            <ITGrid item md={2}><ITText className={HEAD}>{t("purchaseOrders.columns.unitCost")}</ITText></ITGrid>
          </ITGrid>
          {order.lines.map((line) => (
            <ITGrid key={line.id} container columns={12} spacing={2} className="items-center border-b border-slate-50 pb-2">
              <ITGrid item xs={12} md={3}>
                <ITText className="text-[12px] font-bold text-slate-800">{line.item.name}</ITText>
                <ITText className="text-[10px] uppercase text-slate-400">{line.item.unit.name}</ITText>
              </ITGrid>
              <ITGrid item xs={4} md={1}><ITText className="text-[12px] font-bold text-slate-700">{fmtQty(line.quantity)}</ITText></ITGrid>
              <ITGrid item xs={4} md={1}><ITText className="text-[12px] font-bold text-emerald-700">{fmtQty(line.receivedQuantity)}</ITText></ITGrid>
              <ITGrid item xs={4} md={1}><ITText className="text-[12px] font-bold text-amber-600">{fmtQty(line.pendingQuantity)}</ITText></ITGrid>
              <ITGrid item xs={6} md={2}><ITText className="text-[11px] text-slate-600">{fmtQty(line.available)}</ITText></ITGrid>
              <ITGrid item xs={6} md={2}><ITText className="text-[11px] text-slate-600">{fmtQty(line.inTransit)}</ITText></ITGrid>
              <ITGrid item xs={12} md={2}>
                <ITText className="text-[11px] text-slate-600">
                  {line.unitCost == null ? "—" : money(line.unitCost)}
                </ITText>
              </ITGrid>
            </ITGrid>
          ))}
        </ITFlex>
      </ITCard>

      {order.movements.length > 0 && (
        <ITCard className="!p-5 border border-slate-200">
          <ITText className={`${HEAD} block mb-2`}>{t("purchaseOrders.receipts")}</ITText>
          <ITFlex direction="column" gap={1}>
            {order.movements.map((m) => (
              <ITFlex key={m.id} align="center" gap={3}>
                <ITText className="text-[11px] text-slate-500">{new Date(m.date).toLocaleString("es-MX")}</ITText>
                <ITText className="text-[11px] font-mono text-slate-600">{m.reference ?? "—"}</ITText>
                <ITText className="text-[11px] text-slate-500">{m.createdBy}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        </ITCard>
      )}

      <PurchaseOrderReceiveDialog
        open={receiveOpen}
        order={order}
        busy={fx.busy}
        onClose={() => setReceiveOpen(false)}
        onSubmit={(input, key) => {
          void fx.receive(input, key);
          setReceiveOpen(false);
        }}
      />

      <ITConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          void fx.cancel();
          setCancelOpen(false);
        }}
        title={t("purchaseOrders.actions.cancel")}
        message={t("purchaseOrders.cancelConfirm", { number: order.number })}
        confirmLabel={t("purchaseOrders.actions.cancel")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={fx.busy}
      />

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
